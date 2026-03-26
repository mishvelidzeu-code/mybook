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

  const user = getCurrentUser();
  if (user) {
    const authorInput = document.getElementById("bookAuthor");
    if (authorInput && !authorInput.value) {
      authorInput.value = user.name || "";
    }
  }

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentUser = getCurrentUser();
    if (!currentUser || !["author", "publisher", "admin"].includes(currentUser.role)) {
      showUploadMessage("ატვირთვისთვის ჯერ დარეგისტრირდი ან შედი ავტორის ანგარიშით", "error");
      return;
    }

    const ebookFile = document.getElementById("ebookFile").files[0];
    const coverFile = document.getElementById("coverFile").files[0];

    if (!ebookFile || !coverFile) {
      showUploadMessage("გთხოვ ატვირთო ძირითადი ფაილი და ყდა", "error");
      return;
    }

    const submitButton = uploadForm.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      const payload = {
        title: document.getElementById("bookTitle").value.trim(),
        author: document.getElementById("bookAuthor").value.trim(),
        type: document.getElementById("bookType").value,
        genre: document.getElementById("bookGenre").value,
        details: document.getElementById("bookDetails").value.trim(),
        price: document.getElementById("bookPrice").value,
        description: document.getElementById("bookDescription").value.trim(),
        ageRestricted: document.getElementById("bookAdultsOnly").checked,
        ebook: ebookFile,
        cover: coverFile
      };

      const result = await Api.uploadBook(payload);
      showUploadMessage(result.message || "ატვირთვა წარმატებულია", "success");
      uploadForm.reset();

      if (user?.name) {
        document.getElementById("bookAuthor").value = user.name;
      }
    } catch (error) {
      showUploadMessage(error.message || "ატვირთვა ვერ შესრულდა", "error");
    } finally {
      submitButton.disabled = false;
    }
  });
})();
