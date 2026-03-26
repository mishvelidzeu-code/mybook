(function () {
  const LAST_PURCHASE_KEY = "lurji-taro-last-purchase";
  const MAX_STATUS_POLLS = 8;
  const STATUS_POLL_DELAY = 1500;

  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

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

  function readStoredPurchase() {
    try {
      return JSON.parse(sessionStorage.getItem(LAST_PURCHASE_KEY) || "null");
    } catch (error) {
      return null;
    }
  }

  function saveStoredPurchase(purchase) {
    sessionStorage.setItem(LAST_PURCHASE_KEY, JSON.stringify(purchase));
  }

  function getStatusPresentation(status) {
    switch (status) {
      case "delivered":
        return {
          chipClass: "status-chip",
          chipLabel: "წიგნი გამოგზავნილია",
          headline: "გადახდა დადასტურდა და ბმული გაიგზავნა ელფოსტაზე",
          nextStep: "შეამოწმე ელფოსტა და spam საქაღალდე. ჩამოსატვირთი ბმული დროებით მოქმედებს."
        };
      case "paid":
        return {
          chipClass: "status-chip",
          chipLabel: "გადახდა დადასტურდა",
          headline: "შეკვეთა დადასტურდა",
          nextStep: "ელფოსტის გაგზავნა ან წიგნის მიწოდება იწყება. თუ წერილი მალე არ მოვიდა, მოგვწერე შეკვეთის ნომრით."
        };
      case "failed":
        return {
          chipClass: "status-chip status-chip--error",
          chipLabel: "გადახდა ვერ დადასტურდა",
          headline: "შეკვეთა დასრულებული არ არის",
          nextStep: "თუ თანხა ჩამოგეჭრა, მოგვწერე ამ შეკვეთის ნომრით. სხვა შემთხვევაში შეგიძლია ხელახლა სცადო გადახდა."
        };
      default:
        return {
          chipClass: "status-chip status-chip--pending",
          chipLabel: "ვადასტურებთ გადახდას",
          headline: "ბანკიდან პასუხს ველოდებით",
          nextStep: "BOG redirect დასრულდა. რამდენიმე წამში callback განაახლებს სტატუსს და ელფოსტაც ამის შემდეგ გაიგზავნება."
        };
    }
  }

  function formatStatusLabel(status) {
    switch (status) {
      case "delivered":
        return "გაგზავნილია";
      case "paid":
        return "გადახდილია";
      case "failed":
        return "ვერ დასრულდა";
      default:
        return "მოლოდინშია";
    }
  }

  function renderEmptyState(container) {
    container.innerHTML = `
      <article class="empty-state">
        <strong>ბოლო შეკვეთა ვერ მოიძებნა</strong>
        <p>თუ ახლახან გადაიხადე, დაბრუნდი რამდენიმე წამში ან ხელახლა შედი შეძენის გვერდიდან.</p>
        <div class="button-row">
          <a class="primary-btn" href="library.html">წიგნების ნახვა</a>
          <a class="ghost-btn" href="index.html">მთავარი</a>
        </div>
      </article>
    `;
  }

  function renderSuccess(container, purchase) {
    const normalizedStatus = purchase.status || "pending";
    const statusView = getStatusPresentation(normalizedStatus);
    const orderLabel = purchase.orderId || purchase.saleId || "ჯერ არ მოიძებნა";

    container.innerHTML = `
      <div class="success-header">
        <span class="${statusView.chipClass}">${escapeHTML(statusView.chipLabel)}</span>
        <h2>${escapeHTML(purchase.bookTitle || "შეკვეთა")}</h2>
        <p>${escapeHTML(statusView.headline)}</p>
      </div>

      <div class="info-grid">
        <div class="detail-card">
          <strong>შეკვეთის ნომერი</strong>
          <p>${escapeHTML(orderLabel)}</p>
        </div>
        <div class="detail-card">
          <strong>თანხა</strong>
          <p>${escapeHTML(formatPrice(purchase.amount))}</p>
        </div>
        <div class="detail-card">
          <strong>ელფოსტა</strong>
          <p>${escapeHTML(purchase.buyerEmail || "-")}</p>
        </div>
        <div class="detail-card">
          <strong>სტატუსი</strong>
          <p>${escapeHTML(formatStatusLabel(normalizedStatus))}</p>
        </div>
      </div>

      <div class="success-note">
        <strong>რა ხდება ახლა?</strong>
        <p>${escapeHTML(statusView.nextStep)}</p>
      </div>

      <div class="success-note">
        <strong>თუ წიგნი არ მოგივიდა</strong>
        <p>მოგვწერე შეკვეთის ნომერი და ელფოსტა, რომლითაც იყიდე. ამ ორი ინფორმაციით გაყიდვის ჩანაწერს სწრაფად ვიპოვით.</p>
      </div>

      <div class="button-row">
        <a class="primary-btn" href="library.html">ბიბლიოთეკაში დაბრუნება</a>
        <a class="ghost-btn" href="index.html">მთავარი</a>
      </div>
    `;
  }

  function mergePurchase(storedPurchase, remoteStatus, orderIdFromQuery) {
    return {
      ...(storedPurchase || {}),
      ...(remoteStatus || {}),
      orderId: remoteStatus?.orderId || storedPurchase?.orderId || orderIdFromQuery || "",
      saleId: remoteStatus?.saleId || storedPurchase?.saleId || "",
      status: remoteStatus?.status || storedPurchase?.status || "pending",
      bookTitle: remoteStatus?.bookTitle || storedPurchase?.bookTitle || "შეკვეთა",
      amount: remoteStatus?.amount || storedPurchase?.amount || 0,
      buyerEmail: remoteStatus?.buyerEmail || storedPurchase?.buyerEmail || "",
      buyerName: remoteStatus?.buyerName || storedPurchase?.buyerName || ""
    };
  }

  async function fetchPaymentStatus(orderId) {
    const statusEndpoint = window.APP_CONFIG?.BOG_STATUS_ENDPOINT || "/api/book-order-status";
    const response = await fetch(`${statusEndpoint}?order_id=${encodeURIComponent(orderId)}`);

    if (!response.ok) {
      throw new Error("შეკვეთის სტატუსი ვერ მოიძებნა");
    }

    return response.json();
  }

  async function hydrateStatus(container, purchase, attempt = 0) {
    const orderId = purchase.orderId;
    if (!orderId) {
      renderSuccess(container, purchase);
      return;
    }

    try {
      const remoteStatus = await fetchPaymentStatus(orderId);
      const mergedPurchase = mergePurchase(purchase, remoteStatus, orderId);
      saveStoredPurchase(mergedPurchase);
      renderSuccess(container, mergedPurchase);

      if (mergedPurchase.status === "pending" && attempt < MAX_STATUS_POLLS) {
        setTimeout(() => {
          hydrateStatus(container, mergedPurchase, attempt + 1);
        }, STATUS_POLL_DELAY);
      }
    } catch (error) {
      renderSuccess(container, purchase);
    }
  }

  function init() {
    const container = document.getElementById("successCard");
    if (!container) return;

    const storedPurchase = readStoredPurchase();
    const orderIdFromQuery = query("order_id");

    if (!storedPurchase && !orderIdFromQuery) {
      renderEmptyState(container);
      return;
    }

    const initialPurchase = mergePurchase(storedPurchase, null, orderIdFromQuery);
    renderSuccess(container, initialPurchase);
    hydrateStatus(container, initialPurchase);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
