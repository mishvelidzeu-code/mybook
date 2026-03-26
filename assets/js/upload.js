(function () {
  function showUploadMessage(message, type = "success") {
    const box = document.getElementById("uploadMessage");
    if (!box) return;

    box.textContent = message;
    box.className = `form-message show ${type}`;
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      return null;
    }
  }

  const uploadForm = document.getElementById("uploadForm");
  if (!uploadForm) return;

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = getCurrentUser();
    if (!user || !["author", "admin"].includes(user.role)) {
      showUploadMessage("ატვირთვისთვის შედი author ან admin ანგარიშით", "error");
      return;
    }

    const ebookFile = document.getElementById("ebookFile").files[0];
    const coverFile = document.getElementById("coverFile").files[0];

    if (!ebookFile || !coverFile) {
      showUploadMessage("გთხოვ ატვირთო წიგნის ფაილი და ყდა", "error");
      return;
    }

    const submitButton = uploadForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const payload = {
        title: document.getElementById("bookTitle").value.trim(),
        author: document.getElementById("bookAuthor").value.trim(),
        genre: document.getElementById("bookGenre").value,
        price: document.getElementById("bookPrice").value,
        description: document.getElementById("bookDescription").value.trim(),
        ebook: ebookFile,
        cover: coverFile
      };

      const result = await Api.uploadBook(payload);
      showUploadMessage(result.message || "წიგნი წარმატებით აიტვირთა", "success");
      uploadForm.reset();
    } catch (error) {
      showUploadMessage(error.message || "ატვირთვა ვერ შესრულდა", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
})();
