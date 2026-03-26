(function () {
  const LAST_PURCHASE_KEY = "lurji-taro-last-purchase";

  function formatPrice(value) {
    const amount = Number(value);
    return `₾${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return entities[char];
    });
  }

  function renderEmptyState(container) {
    container.innerHTML = `
      <article class="empty-state">
        <strong>ბოლო შეკვეთა ვერ მოიძებნა</strong>
        <p>თუ ახლახან გადაიხადე, სცადე კიდევ ერთხელ დაბრუნდე შეძენის გვერდიდან.</p>
        <div class="button-row">
          <a class="primary-btn" href="library.html">წიგნების ნახვა</a>
          <a class="ghost-btn" href="index.html">მთავარი</a>
        </div>
      </article>
    `;
  }

  function renderSuccess(container, purchase) {
    const orderLabel = purchase.saleId ? `#${purchase.saleId}` : "დროებითი შეკვეთა";
    const statusCopy = purchase.isDemo
      ? "ეს სატესტო შეძენაა. რეალური თანხა არ ჩამოჭრილა."
      : "შეკვეთა ჩაიწერა. ახლა შემდეგ ეტაპზე უნდა მივაბათ ავტომატური ელფოსტა და download link.";

    const nextStepCopy = purchase.isDemo
      ? "ტესტისთვის ჩანაწერი შენახულია და გაყიდვებშიც გამოჩნდება."
      : "როცა email function და gateway webhook დაემატება, მყიდველი აქვე ნახავს რომ ბმული ელფოსტაზე გაიგზავნა.";

    container.innerHTML = `
      <div class="success-header">
        <span class="status-chip">შეკვეთა წარმატებულია</span>
        <h2>${escapeHTML(purchase.bookTitle || "შეკვეთა")}</h2>
        <p>${escapeHTML(purchase.message || "შეძენა წარმატებით დაფიქსირდა")}</p>
      </div>

      <div class="info-grid">
        <div class="detail-card">
          <strong>შეკვეთის ნომერი</strong>
          <p>${escapeHTML(orderLabel)}</p>
        </div>
        <div class="detail-card">
          <strong>გადახდილი თანხა</strong>
          <p>${escapeHTML(formatPrice(purchase.amount))}</p>
        </div>
        <div class="detail-card">
          <strong>მიმღები ელფოსტა</strong>
          <p>${escapeHTML(purchase.buyerEmail || "-")}</p>
        </div>
        <div class="detail-card">
          <strong>გადახდის მეთოდი</strong>
          <p>${escapeHTML(purchase.paymentMethod || "-")}</p>
        </div>
      </div>

      <div class="success-note">
        <strong>რა ხდება ახლა?</strong>
        <p>${escapeHTML(statusCopy)}</p>
        <p>${escapeHTML(nextStepCopy)}</p>
      </div>

      <div class="success-note">
        <strong>რას ნიშნავს ეს გვერდი?</strong>
        <p>success page არის გვერდი, რომელსაც მომხმარებელი ხედავს გადახდის დასრულებისთანავე. აქ უნდა გამოჩნდეს შეკვეთის ნომერი, სტატუსი და შემდეგი ნაბიჯი.</p>
      </div>

      <div class="button-row">
        <a class="primary-btn" href="library.html">ბიბლიოთეკაში დაბრუნება</a>
        <a class="ghost-btn" href="index.html">მთავარი</a>
      </div>
    `;
  }

  function init() {
    const container = document.getElementById("successCard");
    if (!container) return;

    try {
      const purchase = JSON.parse(sessionStorage.getItem(LAST_PURCHASE_KEY) || "null");
      if (!purchase) {
        renderEmptyState(container);
        return;
      }

      renderSuccess(container, purchase);
    } catch (error) {
      renderEmptyState(container);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
