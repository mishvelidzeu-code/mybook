(function () {
  function adminTab(tab) {
    document.querySelectorAll(".admin-nav-link").forEach((button) => {
      button.classList.toggle("active", button.dataset.adminTab === tab);
    });

    ["dashboard", "books", "users", "sales"].forEach((name) => {
      document.getElementById(`admin-${name}`)?.classList.toggle("hidden", name !== tab);
    });
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

  async function renderAdmin() {
    const stats = await Api.getAdminStats();
    const books = await Api.getBooks();
    const users = await Api.getUsers();
    const sales = await Api.getSales();

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
              • ${window.AppUtils.escapeHTML(window.AppUtils.formatTypeLabel(book.type))}
              • ${window.AppUtils.escapeHTML(book.details)}
            </small>
          </div>
          <div class="admin-row-actions">
            <span>${window.AppUtils.formatPrice(book.price)}</span>
            <a class="mini-btn" href="book.html?id=${encodeURIComponent(book.id)}">ნახვა</a>
          </div>
        </div>
      `),
      "კატალოგი ცარიელია",
      "ატვირთული წიგნები და აუდიოწიგნები აქ გამოჩნდება."
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
  }

  async function initAdmin() {
    const navButtons = document.querySelectorAll(".admin-nav-link");
    if (!navButtons.length) return;

    navButtons.forEach((button) => {
      button.addEventListener("click", () => adminTab(button.dataset.adminTab));
    });

    try {
      await renderAdmin();
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
