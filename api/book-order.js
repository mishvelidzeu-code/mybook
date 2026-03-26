const {
  parseBody,
  createOrderId,
  getSiteUrl,
  createSupabaseAdminClient,
  getBogAccessToken
} = require("./_shared/payments");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let saleId = "";

  try {
    const payload = parseBody(req);
    const {
      bookId,
      buyerName,
      buyerEmail,
      buyerPhone,
      paymentMethod
    } = payload;

    if (!bookId || !buyerName || !buyerEmail || !buyerPhone) {
      return res.status(400).json({ error: "Missing checkout fields" });
    }

    const supabase = createSupabaseAdminClient();
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, title, price, type")
      .eq("id", bookId)
      .maybeSingle();

    if (bookError) {
      throw bookError;
    }

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    const amount = 1;

    const orderId = createOrderId();
    const siteUrl = getSiteUrl();

    const { data: insertedSale, error: saleInsertError } = await supabase
      .from("sales")
      .insert({
        order_id: orderId,
        book_id: book.id,
        book_title: book.title,
        buyer_name: String(buyerName).trim(),
        buyer_email: String(buyerEmail).trim().toLowerCase(),
        buyer_phone: String(buyerPhone).trim(),
        payment_method: paymentMethod || "bog_card",
        payment_provider: "bog",
        amount,
        status: "pending"
      })
      .select("id")
      .single();

    if (saleInsertError) {
      throw saleInsertError;
    }

    saleId = insertedSale?.id || "";

    const accessToken = await getBogAccessToken();
    const orderResponse = await fetch("https://api.bog.ge/payments/v1/ecommerce/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Accept-Language": "ka"
      },
      body: JSON.stringify({
        callback_url: `${siteUrl}/api/book-callback`,
        external_order_id: orderId,
        purchase_units: {
          currency: "GEL",
          total_amount: amount,
          basket: [
            {
              quantity: 1,
              unit_price: amount,
              product_id: book.id
            }
          ]
        },
        redirect_urls: {
          success: `${siteUrl}/success.html?order_id=${encodeURIComponent(orderId)}&payment=bog`,
          fail: `${siteUrl}/payment-fail.html?order_id=${encodeURIComponent(orderId)}&payment=bog`
        }
      })
    });

    const orderData = await orderResponse.json().catch(() => ({}));
    const redirectUrl = orderData?._links?.redirect?.href || "";
    const gatewayReference = String(orderData?.id || orderData?.order_id || "");

    if (!orderResponse.ok || !redirectUrl) {
      await supabase
        .from("sales")
        .update({
          status: "failed",
          gateway_reference: gatewayReference || null
        })
        .eq("id", saleId);

      return res.status(500).json({ error: "BOG order creation failed" });
    }

    if (gatewayReference) {
      await supabase
        .from("sales")
        .update({ gateway_reference: gatewayReference })
        .eq("id", saleId);
    }

    return res.status(200).json({
      redirect: redirectUrl,
      saleId,
      orderId,
      status: "pending",
      message: "შეკვეთა შეიქმნა. ახლა გადაგიყვანთ BOG გადახდის გვერდზე."
    });
  } catch (error) {
    console.error("BOOK ORDER ERROR:", error);

    if (saleId) {
      try {
        const supabase = createSupabaseAdminClient();
        await supabase
          .from("sales")
          .update({ status: "failed" })
          .eq("id", saleId);
      } catch (updateError) {
        console.error("SALE FAIL UPDATE ERROR:", updateError);
      }
    }

    return res.status(500).json({
      error: error.message || "Server error"
    });
  }
};
