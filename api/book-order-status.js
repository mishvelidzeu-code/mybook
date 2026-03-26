const { createSupabaseAdminClient } = require("./_shared/payments");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const orderId = String(req.query?.order_id || "").trim();
    if (!orderId) {
      return res.status(400).json({ error: "order_id is required" });
    }

    const supabase = createSupabaseAdminClient();
    const { data: sale, error } = await supabase
      .from("sales")
      .select("id, order_id, book_title, amount, buyer_email, buyer_name, status, paid_at, download_email_sent_at, delivered_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!sale) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.status(200).json({
      saleId: sale.id,
      orderId: sale.order_id,
      bookTitle: sale.book_title,
      amount: Number(sale.amount || 0),
      buyerEmail: sale.buyer_email,
      buyerName: sale.buyer_name,
      status: sale.status || "pending",
      paidAt: sale.paid_at || null,
      downloadEmailSentAt: sale.download_email_sent_at || null,
      deliveredAt: sale.delivered_at || null
    });
  } catch (error) {
    console.error("BOOK ORDER STATUS ERROR:", error);
    return res.status(500).json({ error: "Status lookup failed" });
  }
};
