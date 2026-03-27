(function () {
  const TAB_NAMES = ["dashboard", "books", "my-books", "users", "sales"];

  function getCurrentUser() {
    return window.AppUtils.getCurrentUser();
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

  function adminTab(tab) {
    document.querySelectorAll(".admin-nav-link").forEach((button) => {
      button.classList.toggle("active", button.dataset.adminTab === tab);
    });

    TAB_NAMES.forEach((name) => {
      document.getElementById(`admin-${name}`)?.classList.toggle("hidden", name !== tab);
    });
  }

  function showMessage(element, message, type = "success") {
    if (!element) return;
    element.textContent = message;
    element.className = `form-message show ${type}`;
  }

  function clearMessage(element) {
    if (!element) return;
    element.textContent = "";
    element.className = "form-message";
  }

  function renderRows(container, rows, emptyTitle, emptyDescription) {
    if (!container) return;

    if (!rows.length) {
      container.innerHTML = `
        <article class="empty-state">
          <strong>${window.AppUtils.escapeHTML(emptyTitle)}</strong>
          <p>${window.AppUtils.escapeHTML(emptyDescription)}</p>
        </article>
      `;
      return;
    }

    container.innerHTML = rows.join("");
  }

  function canEditBook(currentUser, book) {
    return currentUser && (currentUser.role === "admin" || currentUser.id === book.uploaderId);
  }

  function buildBookTags(book, currentUser) {
    const tags = [
      `<span class="admin-tag">${window.AppUtils.escapeHTML(window.AppUtils.formatTypeLabel(book.type))}</span>`,
      `<span class="admin-tag">${window.AppUtils.escapeHTML(book.genre)}</span>`,
      `<span class="admin-tag">${window.AppUtils.escapeHTML(book.details)}</span>`
    ];

    if (book.topPick) {
      tags.push('<span class="admin-tag">ტოპ წიგნი</span>');
    }

    if (book.ageRestricted) {
      tags.push('<span class="admin-tag admin-tag-danger">18+</span>');
    }

    if (currentUser && book.uploaderId === currentUser.id) {
      tags.push('<span class="admin-tag">ჩემი ატვირთული</span>');
    }

    return `<div class="admin-meta">${tags.join("")}</div>`;
  }

  function fillEditForm(book) {
    document.getElementById("editBookId").value = book.id;
    document.getElementById("editBookTitle").value = book.title;
    document.getElementById("editBookAuthor").value = book.author;
    document.getElementById("editBookType").value = book.type;
    document.getElementById("editBookGenre").value = book.genre;
    document.getElementById("editBookDetails").value = book.details;
    document.getElementById("editBookPrice").value = book.price;
    document.getElementById("editBookDescription").value = book.description;
    document.getElementById("editBookAdultsOnly").checked = Boolean(book.ageRestricted);
    document.getElementById("editBookTopPick").checked = Boolean(book.topPick);
    document.getElementById("editEbookFile").value = "";
    document.getElementById("editCoverFile").value = "";

    const meta = document.getElementById("editBookMeta");
    if (meta) {
      meta.innerHTML = `
        <strong>${window.AppUtils.escapeHTML(book.title)}</strong><br />
        ძირითადი ფაილი: ${window.AppUtils.escapeHTML(book.fileName || "მითითებული არ არის")}<br />
        ყდა: ${window.AppUtils.escapeHTML(book.coverName || "მითითებული არ არის")}<br />
        ბოლოს განახლდა: ${window.AppUtils.escapeHTML(window.AppUtils.formatDate(book.updatedAt || book.createdAt))}
      `;
    }

    document.getElementById("editBookPanel")?.classList.remove("hidden");
  }

  function hideEditForm() {
    document.getElementById("editBookPanel")?.classList.add("hidden");
    document.getElementById("editBookForm")?.reset();
  }

  async function renderAdmin(currentUser = getCurrentUser()) {
    const stats = await Api.getAdminStats();
    const books = await Api.getBooks();
    const users = await Api.getUsers();
    const sales = await Api.getSales();
    const myBooks = currentUser ? await Api.getMyBooks() : [];

    document.getElementById("adminBookCount").textContent = stats.books;
    document.getElementById("adminUserCount").textContent = stats.users;
    document.getElementById("adminSalesCount").textContent = stats.sales;

    renderRows(
      document.getElementById("adminBooksList"),
      books.map((book) => `
        <div class="admin-row fade-up">
          <div>
            <strong>${window.AppUtils.escapeHTML(book.title)}</strong>
            <small>
              ${window.AppUtils.escapeHTML(book.author)}
              • ${window.AppUtils.escapeHTML(window.AppUtils.formatPrice(book.price))}
            </small>
            ${buildBookTags(book, currentUser)}
          </div>
          <div class="admin-row-actions">
            <a class="mini-btn" href="book.html?id=${encodeURIComponent(book.id)}">ნახვა</a>
            ${canEditBook(currentUser, book) ? `<button class="mini-btn" type="button" data-edit-book-id="${window.AppUtils.escapeHTML(book.id)}">რედაქტირება</button>` : ""}
          </div>
        </div>
      `),
      "კატალოგი ცარიელია",
      "ატვირთული წიგნები და აუდიოწიგნები აქ გამოჩნდება."
    );

    renderRows(
      document.getElementById("myBooksList"),
      myBooks.map((book) => `
        <div class="admin-row fade-up">
          <div>
            <strong>${window.AppUtils.escapeHTML(book.title)}</strong>
            <small>
              ${window.AppUtils.escapeHTML(window.AppUtils.formatTypeLabel(book.type))}
              • ${window.AppUtils.escapeHTML(book.details)}
              • ${window.AppUtils.escapeHTML(window.AppUtils.formatPrice(book.price))}
            </small>
            ${buildBookTags(book, currentUser)}
          </div>
          <div class="admin-row-actions">
            <button class="mini-btn" type="button" data-edit-book-id="${window.AppUtils.escapeHTML(book.id)}">რედაქტირება</button>
          </div>
        </div>
      `),
      "შენი წიგნები ჯერ არ არის",
      "როგორც კი ატვირთავ პირველ წიგნს, აქ გამოჩნდება მხოლოდ შენი კატალოგი."
    );

    renderRows(
      document.getElementById("adminUsersList"),
      users.map((user) => `
        <div class="admin-row fade-up">
          <div>
            <strong>${window.AppUtils.escapeHTML(user.name)}</strong>
            <small>${window.AppUtils.escapeHTML(user.email)}</small>
          </div>
          <div class="admin-row-actions">
            <span>${window.AppUtils.escapeHTML(window.AppUtils.formatRoleLabel(user.role))}</span>
          </div>
        </div>
      `),
      "ავტორები ვერ მოიძებნა",
      "რეგისტრირებული ანგარიშები აქ გამოჩნდება."
    );

    renderRows(
      document.getElementById("adminSalesList"),
      sales.map((sale) => `
        <div class="admin-row fade-up">
          <div>
            <strong>${window.AppUtils.escapeHTML(sale.book)}</strong>
            <small>
              ${window.AppUtils.escapeHTML(sale.buyer)}
              • ${window.AppUtils.escapeHTML(window.AppUtils.formatDate(sale.createdAt))}
            </small>
          </div>
          <div class="admin-row-actions">
            <span>${window.AppUtils.formatPrice(sale.amount)}</span>
          </div>
        </div>
      `),
      "გაყიდვები ჯერ არ არის",
      "1 კლიკით შეძენები აქ დაგროვდება."
    );

    const editButtons = document.querySelectorAll("[data-edit-book-id]");
    editButtons.forEach((button) => {
      button.addEventListener("click", async () => {
        const book = await Api.getBook(button.dataset.editBookId);
        if (book) {
          adminTab("my-books");
          fillEditForm(book);
          clearMessage(document.getElementById("myBooksMessage"));
        }
      });
    });
  }

  function bindEditForm() {
    const form = document.getElementById("editBookForm");
    const cancelButton = document.getElementById("cancelEditBook");
    const messageBox = document.getElementById("myBooksMessage");

    if (cancelButton) {
      cancelButton.addEventListener("click", () => {
        hideEditForm();
        clearMessage(messageBox);
      });
    }

    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const submitButton = form.querySelector('button[type="submit"]');
      submitButton.disabled = true;
      clearMessage(messageBox);

      try {
        const bookId = document.getElementById("editBookId").value;
        const ebookFile = document.getElementById("editEbookFile").files[0];
        const coverFile = document.getElementById("editCoverFile").files[0];

        const payload = {
          title: document.getElementById("editBookTitle").value.trim(),
          author: document.getElementById("editBookAuthor").value.trim(),
          type: document.getElementById("editBookType").value,
          genre: document.getElementById("editBookGenre").value,
          details: document.getElementById("editBookDetails").value.trim(),
          price: document.getElementById("editBookPrice").value,
          description: document.getElementById("editBookDescription").value.trim(),
          ageRestricted: document.getElementById("editBookAdultsOnly").checked,
          topPick: document.getElementById("editBookTopPick").checked,
          ebook: ebookFile || undefined,
          cover: coverFile || undefined
        };

        const result = await Api.updateBook(bookId, payload);
        showMessage(messageBox, result.message || "ცვლილებები შენახულია", "success");
        await renderAdmin();
        if (result.book) {
          fillEditForm(result.book);
        }
      } catch (error) {
        showMessage(messageBox, error.message || "რედაქტირება ვერ შესრულდა", "error");
      } finally {
        submitButton.disabled = false;
      }
    });
  }

  async function initAdmin() {
    const navButtons = document.querySelectorAll(".admin-nav-link");
    if (!navButtons.length) return;

    const currentUser = await resolveCurrentUser();
    if (!currentUser) {
      const dashboard = document.getElementById("admin-dashboard");
      if (dashboard) {
        dashboard.innerHTML = `
          <article class="empty-state">
            <strong>პანელი მხოლოდ ავტორებისთვისაა</strong>
            <p>ატვირთვის, ჩემი წიგნების და რედაქტირების სანახავად ჯერ შედი ავტორის ან გამომცემლის ანგარიშით.</p>
            <div class="button-row">
              <a class="primary-btn" href="login.html">პანელში შესვლა</a>
              <a class="ghost-btn" href="register.html">რეგისტრაცია</a>
            </div>
          </article>
        `;
      }
      return;
    }

    navButtons.forEach((button) => {
      button.addEventListener("click", () => adminTab(button.dataset.adminTab));
    });

    bindEditForm();

    try {
      await renderAdmin(currentUser);
    } catch (error) {
      const dashboard = document.getElementById("admin-dashboard");
      if (dashboard) {
        dashboard.innerHTML = `
          <article class="empty-state">
            <strong>პანელი ვერ ჩაიტვირთა</strong>
            <p>${window.AppUtils.escapeHTML(error.message || "გთხოვ სცადო მოგვიანებით.")}</p>
          </article>
        `;
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdmin, { once: true });
  } else {
    initAdmin();
  }
})();
