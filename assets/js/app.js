(function () {
  function qs(name) {
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

  function renderEmptyState(container, title, description) {
    if (!container) return;

    container.innerHTML = `
      <article class="empty-state fade-up">
        <strong>${escapeHTML(title)}</strong>
        <p>${escapeHTML(description)}</p>
      </article>
    `;
  }

  function renderLoadingState(container, message) {
    if (!container) return;

    container.innerHTML = `
      <article class="loading-state fade-up">
        <strong>${escapeHTML(message)}</strong>
      </article>
    `;
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      return null;
    }
  }

  window.AppUtils = {
    qs,
    formatPrice,
    escapeHTML,
    renderEmptyState,
    renderLoadingState,
    getCurrentUser
  };

  async function renderLibrary() {
    const grid = document.getElementById("booksGrid");
    if (!grid) return;

    const searchInput = document.getElementById("searchBooks");
    const genreFilter = document.getElementById("filterGenre");

    renderLoadingState(grid, "წიგნების ჩატვირთვა...");

    try {
      const books = await Api.getBooks();

      const draw = () => {
        const search = String(searchInput?.value || "").trim().toLowerCase();
        const genre = genreFilter?.value || "all";

        const filtered = books.filter((book) => {
          const haystack = [book.title, book.author, book.genre, book.description].join(" ").toLowerCase();
          const matchesSearch = !search || haystack.includes(search);
          const matchesGenre = genre === "all" || book.genre === genre;
          return matchesSearch && matchesGenre;
        });

        if (!filtered.length) {
          renderEmptyState(grid, "შედეგი ვერ მოიძებნა", "სცადე სხვა საძიებო სიტყვა ან ჟანრი.");
          return;
        }

        grid.innerHTML = filtered.map((book, index) => `
          <article class="book-card glass fade-up" style="animation-delay:${index * 45}ms">
            <div class="book-cover">${escapeHTML(book.title)}</div>
            <div class="book-meta">
              <h3>${escapeHTML(book.title)}</h3>
              <p>${escapeHTML(book.description)}</p>
              <div class="badges">
                <span class="badge">${escapeHTML(book.author)}</span>
                <span class="badge">${escapeHTML(book.genre)}</span>
                <span class="badge">${formatPrice(book.price)}</span>
              </div>
              <div class="card-actions">
                <a class="mini-btn" href="book.html?id=${encodeURIComponent(book.id)}">ნახვა</a>
                <a class="mini-btn" href="payments.html?id=${encodeURIComponent(book.id)}">ყიდვა</a>
              </div>
            </div>
          </article>
        `).join("");
      };

      searchInput?.addEventListener("input", draw);
      genreFilter?.addEventListener("change", draw);
      draw();
    } catch (error) {
      renderEmptyState(grid, "ბიბლიოთეკა ვერ ჩაიტვირთა", error.message || "გთხოვ სცადო მოგვიანებით.");
    }
  }

  async function renderBookDetail() {
    const container = document.getElementById("bookDetail");
    if (!container) return;

    renderLoadingState(container, "წიგნის ჩატვირთვა...");

    try {
      const id = qs("id") || "b1";
      const book = await Api.getBook(id);

      if (!book) {
        renderEmptyState(container, "წიგნი ვერ მოიძებნა", "აირჩიე სხვა წიგნი ბიბლიოთეკიდან.");
        return;
      }

      container.innerHTML = `
        <article class="book-focus fade-up">
          <div class="book-cover-large">${escapeHTML(book.title)}</div>

          <div class="book-focus-copy">
            <span class="eyebrow">${escapeHTML(book.genre)}</span>
            <h2>${escapeHTML(book.title)}</h2>

            <div class="badges">
              <span class="badge">${escapeHTML(book.author)}</span>
              <span class="badge">Instant access</span>
              <span class="badge">Mobile reading ready</span>
            </div>

            <div class="detail-card detail-copy">
              <p>${escapeHTML(book.description)}</p>
            </div>

            <div class="info-grid">
              <div class="detail-card">
                <strong>ფორმატები</strong>
                <p>PDF / EPUB / MOBI</p>
              </div>
              <div class="detail-card">
                <strong>მიწოდება</strong>
                <p>Digital delivery after payment</p>
              </div>
            </div>

            <div class="detail-price">
              <div>
                <span>ფასი</span>
                <strong>${formatPrice(book.price)}</strong>
              </div>
              <a class="primary-btn" href="payments.html?id=${encodeURIComponent(book.id)}">ახლავე ყიდვა</a>
            </div>
          </div>
        </article>
      `;
    } catch (error) {
      renderEmptyState(container, "დეტალი ვერ ჩაიტვირთა", error.message || "გთხოვ სცადო მოგვიანებით.");
    }
  }

  function init() {
    renderLibrary();
    renderBookDetail();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
