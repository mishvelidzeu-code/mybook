(function () {
  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function readStoredPurchase() {
    try {
      return JSON.parse(sessionStorage.getItem("lurji-taro-last-purchase") || "null");
    } catch (error) {
      return null;
    }
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

  function render() {
    const container = document.getElementById("paymentFailCard");
    if (!container) return;

    const purchase = readStoredPurchase();
    const orderId = query("order_id") || purchase?.orderId || "";
    const bookTitle = purchase?.bookTitle || "შეკვეთა";
    const retryHref = purchase?.bookId ? `payments.html?id=${encodeURIComponent(purchase.bookId)}` : "library.html";

    container.innerHTML = `
      <div class="success-header">
        <span class="status-chip status-chip--error">გადახდა ვერ დასრულდა</span>
        <h2>${escapeHTML(bookTitle)}</h2>
        <p>შეგიძლია ისევ დაბრუნდე checkout-ზე და თავიდან სცადო გადახდა.</p>
      </div>

      <div class="success-note">
        <strong>შეკვეთის ნომერი</strong>
        <p>${escapeHTML(orderId || "ჯერ არ მოიძებნა")}</p>
      </div>

      <div class="success-note">
        <strong>რა შეიძლება მოხდა?</strong>
        <p>ბარათი არ დადასტურდა, გადახდა გაწყდა ან ბანკის გვერდი დახურე დასრულებამდე.</p>
        <p>თუ თანხა ნამდვილად ჩამოგეჭრა, მოგვწერე და შეკვეთას order_id-ით გადავამოწმებთ.</p>
      </div>

      <div class="button-row">
        <a class="primary-btn" href="${retryHref}">გადახდის თავიდან ცდა</a>
        <a class="ghost-btn" href="library.html">წიგნებზე დაბრუნება</a>
      </div>
    `;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
