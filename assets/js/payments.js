(function () {
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
      const result = await Api.createPaymentIntent({
        bookId: currentBook.id,
        amount: currentBook.price,
        buyerName: document.getElementById("buyerName").value.trim(),
        buyerEmail: document.getElementById("buyerEmail").value.trim(),
        buyerPhone: document.getElementById("buyerPhone").value.trim(),
        paymentMethod: document.getElementById("paymentMethod").value
      });

      showPaymentMessage(result.message || "შეძენა წარმატებით დასრულდა", "success");
      paymentForm.reset();
    } catch (error) {
      showPaymentMessage(error.message || "შეძენა ვერ შესრულდა", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
})();
