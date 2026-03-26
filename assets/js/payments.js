(function () {
  const LAST_PURCHASE_KEY = "lurji-taro-last-purchase";

  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function formatPrice(value) {
    const amount = Number(value);
    return `₾${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
  }

  function showPaymentMessage(message, type = "success") {
    const box = document.getElementById("paymentMessage");
    if (!box) return;

    box.textContent = message;
    box.className = `form-message show ${type}`;
  }

  async function preloadBook() {
    const id = query("id") || "b1";
    const book = await Api.getBook(id);

    if (book) {
      document.getElementById("checkoutBookName").textContent = book.title;
      document.getElementById("checkoutBookPrice").textContent = formatPrice(book.price);
    }

    return book;
  }

  function savePurchaseSummary(payload) {
    sessionStorage.setItem(LAST_PURCHASE_KEY, JSON.stringify(payload));
  }

  let currentBook = null;

  const paymentForm = document.getElementById("paymentForm");
  if (!paymentForm) return;

  preloadBook()
    .then((book) => {
      currentBook = book;

      if (!book) {
        showPaymentMessage("წიგნი ვერ მოიძებნა, გთხოვ აირჩიე სხვა გამოცემა.", "error");
        paymentForm.querySelector('button[type="submit"]').disabled = true;
      }
    })
    .catch((error) => {
      showPaymentMessage(error.message || "შეძენის გვერდი ვერ ჩაიტვირთა", "error");
      paymentForm.querySelector('button[type="submit"]').disabled = true;
    });

  paymentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentBook) {
      showPaymentMessage("არჩეული წიგნი ვერ მოიძებნა", "error");
      return;
    }

    const submitButton = paymentForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const buyerName = document.getElementById("buyerName").value.trim();
      const buyerEmail = document.getElementById("buyerEmail").value.trim();
      const buyerPhone = document.getElementById("buyerPhone").value.trim();
      const paymentMethod = document.getElementById("paymentMethod").value;

      const result = await Api.createPaymentIntent({
        bookId: currentBook.id,
        amount: currentBook.price,
        buyerName,
        buyerEmail,
        buyerPhone,
        paymentMethod
      });

      savePurchaseSummary({
        saleId: result.saleId || "",
        status: result.status || "recorded",
        deliveryMode: result.deliveryMode || "manual",
        isDemo: Boolean(result.isDemo),
        bookId: currentBook.id,
        bookTitle: currentBook.title,
        amount: currentBook.price,
        buyerName,
        buyerEmail,
        buyerPhone,
        paymentMethod,
        message: result.message || "შეძენა წარმატებით დაფიქსირდა",
        createdAt: new Date().toISOString()
      });

      showPaymentMessage(result.message || "შეძენა წარმატებით დასრულდა", "success");

      setTimeout(() => {
        window.location.href = "success.html";
      }, 500);
    } catch (error) {
      showPaymentMessage(error.message || "შეძენა ვერ შესრულდა", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
})();
