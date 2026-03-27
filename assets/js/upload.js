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

  async function resolveCurrentUser() {
    const cachedUser = getCurrentUser();
    if (cachedUser) {
      return cachedUser;
    }

    if (window.SupabaseService?.isEnabled?.() && typeof window.SupabaseService.syncSessionUser === "function") {
      try {
        const syncedUser = await window.SupabaseService.syncSessionUser();
        if (syncedUser) {
          return syncedUser;
        }
      } catch (error) {
        return getCurrentUser();
      }
    }

    return getCurrentUser();
  }

  function prefillAuthor(user) {
    const authorInput = document.getElementById("bookAuthor");
    if (!authorInput || authorInput.value) {
      return;
    }

    authorInput.value = user?.name || "";
  }

  const uploadForm = document.getElementById("uploadForm");
  if (!uploadForm) return;

  (async () => {
    const user = await resolveCurrentUser();
    if (user) {
      prefillAuthor(user);
    }
  })();

  uploadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentUser = await resolveCurrentUser();
    if (!currentUser || !["author", "publisher", "admin"].includes(currentUser.role)) {
      showUploadMessage("ატვირთვისთვის ჯერ შედი ავტორის ან გამომცემლის ანგარიშით", "error");
      return;
    }

    const ebookFile = document.getElementById("ebookFile").files[0];
    const coverFile = document.getElementById("coverFile").files[0];

    if (!ebookFile || !coverFile) {
      showUploadMessage("გთხოვ ატვირთო ძირითადი ფაილი და ყდა", "error");
      return;
    }

    const submitButton = uploadForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
    }

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
      prefillAuthor(currentUser);
    } catch (error) {
      showUploadMessage(error.message || "ატვირთვა ვერ შესრულდა", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
})();
