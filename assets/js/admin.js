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
            <small>${window.AppUtils.escapeHTML(book.author)} • ${window.AppUtils.escapeHTML(book.genre)}</small>
          </div>
          <div class="admin-row-actions">
            <span>${window.AppUtils.formatPrice(book.price)}</span>
            <a class="mini-btn" href="book.html?id=${encodeURIComponent(book.id)}">Open</a>
          </div>
        </div>
      `),
      "წიგნები არ მოიძებნა",
      "ატვირთვის შემდეგ აქ გამოჩნდება სრული კატალოგი."
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
            <span>${window.AppUtils.escapeHTML(user.role)}</span>
          </div>
        </div>
      `),
      "მომხმარებლები არ მოიძებნა",
      "რეგისტრაციის შემდეგ ახალი ანგარიშები აქ გამოჩნდება."
    );

    renderRows(
      document.getElementById("adminSalesList"),
      sales.map((sale) => `
        <div class="admin-row fade-up">
          <div>
            <strong>${window.AppUtils.escapeHTML(sale.book)}</strong>
            <small>${window.AppUtils.escapeHTML(sale.buyer)}</small>
          </div>
          <div class="admin-row-actions">
            <span>${window.AppUtils.formatPrice(sale.amount)}</span>
          </div>
        </div>
      `),
      "გაყიდვები არ მოიძებნა",
      "checkout flow-ის შესრულების შემდეგ ტრანზაქციები აქ დაგროვდება."
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
            <strong>Admin მონაცემები ვერ ჩაიტვირთა</strong>
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
