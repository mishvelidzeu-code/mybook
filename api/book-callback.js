const {
  escapeHtml,
  parseBody,
  createSupabaseAdminClient,
  mapBogStatus,
  getBogReference,
  createMailerTransport,
  getMailerFromAddress,
  getAdminNotificationEmail,
  getFallbackDownloadUrl,
  createSignedBookUrl
} = require("./_shared/payments");

function getCallbackToken(req) {
  const queryToken = String(req.query?.token || "").trim();
  if (queryToken) {
    return queryToken;
  }

  try {
    const parsedUrl = new URL(req.url, "http://localhost");
    return String(parsedUrl.searchParams.get("token") || "").trim();
  } catch (error) {
    return "";
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    if (process.env.BOG_CALLBACK_TOKEN) {
      const authHeader = String(req.headers.authorization || "").trim();
      const queryToken = getCallbackToken(req);
      const isAuthorized = authHeader === `Bearer ${process.env.BOG_CALLBACK_TOKEN}`
        || queryToken === process.env.BOG_CALLBACK_TOKEN;

      if (!isAuthorized) {
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    const callbackData = parseBody(req);
    const orderId = callbackData?.body?.external_order_id;
    const mappedStatus = mapBogStatus(callbackData?.body?.order_status?.key);
    const gatewayReference = getBogReference(callbackData);

    if (!orderId) {
      return res.status(200).json({ received: true });
    }

    const supabase = createSupabaseAdminClient();
    const { data: existingSale, error: saleError } = await supabase
      .from("sales")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (saleError || !existingSale) {
      console.log("Callback order not found:", orderId, saleError);
      return res.status(200).json({ received: true });
    }

    if (["paid", "delivered"].includes(existingSale.status) && mappedStatus === "paid") {
      return res.status(200).json({ received: true });
    }

    if (mappedStatus === "failed") {
      await supabase
        .from("sales")
        .update({
          status: "failed",
          gateway_reference: gatewayReference || existingSale.gateway_reference || null,
          payment_provider: "bog"
        })
        .eq("id", existingSale.id);

      return res.status(200).json({ received: true });
    }

    if (mappedStatus !== "paid") {
      return res.status(200).json({ received: true });
    }

    const paidAt = new Date().toISOString();
    await supabase
      .from("sales")
      .update({
        status: "paid",
        paid_at: paidAt,
        gateway_reference: gatewayReference || existingSale.gateway_reference || null,
        payment_provider: "bog"
      })
      .eq("id", existingSale.id);

    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, title, author, type, file_path")
      .eq("id", existingSale.book_id)
      .maybeSingle();

    if (bookError) {
      console.error("BOOK FETCH ERROR:", bookError);
    }

    let signedDownloadUrl = "";
    let usingFallbackDownload = false;
    if (book?.file_path) {
      try {
        signedDownloadUrl = await createSignedBookUrl(supabase, book.file_path);
      } catch (signedUrlError) {
        console.error("SIGNED URL ERROR:", signedUrlError);
      }
    }

    if (!signedDownloadUrl) {
      signedDownloadUrl = getFallbackDownloadUrl();
      usingFallbackDownload = Boolean(signedDownloadUrl);
    }

    const transporter = createMailerTransport();
    const fromAddress = getMailerFromAddress();
    const adminNotificationEmail = getAdminNotificationEmail();

    if (transporter && fromAddress) {
      try {
        const safeOrderId = escapeHtml(orderId);
        const safeBuyerName = escapeHtml(existingSale.buyer_name);
        const safeBuyerEmail = escapeHtml(existingSale.buyer_email);
        const safeBuyerPhone = escapeHtml(existingSale.buyer_phone);
        const safeBookTitle = escapeHtml(existingSale.book_title);
        const safeAmount = escapeHtml(existingSale.amount);
        const safeAuthor = escapeHtml(book?.author || "");
        const safeDownloadUrl = escapeHtml(signedDownloadUrl);

        if (adminNotificationEmail) {
          await transporter.sendMail({
            from: `"წიგნების თარო" <${fromAddress}>`,
            to: adminNotificationEmail,
            subject: "ახალი გადახდილი წიგნის შეკვეთა",
            html: `
              <div style="font-family:Arial;padding:20px;">
                <h2 style="color:#2269c4;">ახალი გადახდილი შეკვეთა</h2>
                <p><strong>Order ID:</strong> ${safeOrderId}</p>
                <p><strong>წიგნი:</strong> ${safeBookTitle}</p>
                <p><strong>მყიდველი:</strong> ${safeBuyerName}</p>
                <p><strong>ელფოსტა:</strong> ${safeBuyerEmail}</p>
                <p><strong>ტელეფონი:</strong> ${safeBuyerPhone}</p>
                <p><strong>თანხა:</strong> ${safeAmount} GEL</p>
              </div>
            `
          });
        }

        if (existingSale.buyer_email) {
          const hasDownload = Boolean(signedDownloadUrl);

          await transporter.sendMail({
            from: `"წიგნების თარო" <${fromAddress}>`,
            to: existingSale.buyer_email,
            subject: "თქვენი წიგნი მზად არის — წიგნების თარო",
            html: `
              <div style="font-family:Arial;padding:20px;color:#17355b;">
                <h2 style="color:#2269c4;">გადახდა წარმატებით დადასტურდა</h2>
                <p>გამარჯობა ${safeBuyerName},</p>
                <p>შენი შეკვეთა მივიღეთ და გადავამოწმეთ.</p>

                <p>
                  <strong>შეკვეთის ნომერი:</strong> ${safeOrderId}<br />
                  <strong>წიგნი:</strong> ${safeBookTitle}<br />
                  <strong>ავტორი:</strong> ${safeAuthor || "—"}<br />
                  <strong>თანხა:</strong> ${safeAmount} GEL
                </p>

                ${hasDownload ? `
                  <p>წიგნის ჩამოსატვირთი დროებითი ბმული:</p>
                  <p>
                    <a href="${safeDownloadUrl}" style="display:inline-block;padding:12px 18px;background:#2269c4;color:#fff;text-decoration:none;border-radius:10px;">
                      წიგნის ჩამოტვირთვა
                    </a>
                  </p>
                  <p style="font-size:14px;color:#5d7596;">
                    ${usingFallbackDownload
                      ? "ეს დროებითი სატესტო PDF-ია. რეალურ წიგნის ფაილს მოგვიანებით მივაბამთ."
                      : "ბმული დროებით მუშაობს. თუ ვადა გაუვიდა, მოგვწერე შეკვეთის ნომრით."}
                  </p>
                ` : `
                  <p>ჩამოსატვირთი ბმული ხელით გამოგზავნება ჩვენი გუნდის მხრიდან, რადგან ფაილი ჯერ პირდაპირ მიწოდებისთვის არ არის გამზადებული.</p>
                `}

                <hr style="margin:20px 0;" />

                <p style="font-size:14px;color:#6b7280;">მადლობა ნდობისთვის,<br />წიგნების თარო</p>
              </div>
            `
          });

          if (hasDownload) {
            const deliveredAt = new Date().toISOString();
            await supabase
              .from("sales")
              .update({
                status: "delivered",
                download_email_sent_at: deliveredAt,
                delivered_at: deliveredAt
              })
              .eq("id", existingSale.id);
          }
        }
      } catch (mailError) {
        console.error("CALLBACK EMAIL ERROR:", mailError);
      }
    } else {
      console.warn("CALLBACK EMAIL SKIPPED: mail transporter is not configured");
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("BOOK CALLBACK ERROR:", error);
    return res.status(500).json({ error: "Callback failed" });
  }
};
