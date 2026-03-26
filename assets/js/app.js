(function () {
  function query(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function formatPrice(value) {
    const amount = Number(value);
    return `₾${Number.isFinite(amount) ? amount.toFixed(2) : "0.00"}`;
  }

  function formatTypeLabel(type) {
    return type === "audio" ? "აუდიო წიგნი" : "ელექტრონული წიგნი";
  }

  function formatRoleLabel(role) {
    const labels = {
      admin: "ადმინისტრატორი",
      author: "ავტორი",
      publisher: "გამომცემლობა"
    };
    return labels[role] || role;
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

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("ka-GE", {
        day: "numeric",
        month: "long"
      }).format(new Date(value));
    } catch (error) {
      return value;
    }
  }

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      return null;
    }
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

  function buildCover(book, large = false) {
    const coverClass = large ? "book-cover-large" : "book-cover";

    return `
      <div class="${coverClass}">
        <div class="cover-top">
          <span class="cover-type">${escapeHTML(formatTypeLabel(book.type))}</span>
          <strong class="cover-title">${escapeHTML(book.title)}</strong>
        </div>
        <div class="cover-bottom">
          <div class="cover-size">1000 × 1500</div>
          <div class="cover-author">${escapeHTML(book.author)}</div>
        </div>
      </div>
    `;
  }

  function buildBookCard(book, index = 0) {
    return `
      <article class="book-card surface fade-up" style="animation-delay:${index * 40}ms">
        ${buildCover(book)}
        <div class="book-meta">
          <h3>${escapeHTML(book.title)}</h3>
          <p>${escapeHTML(book.description)}</p>
          <div class="badges">
            <span class="badge">${escapeHTML(book.author)}</span>
            <span class="badge">${escapeHTML(book.genre)}</span>
            <span class="badge">${escapeHTML(book.details)}</span>
          </div>
          <div class="price-row">
            <div class="price-label">
              <span>ფასი</span>
              <strong>${formatPrice(book.price)}</strong>
            </div>
          </div>
          <div class="button-row">
            <a class="ghost-btn" href="book.html?id=${encodeURIComponent(book.id)}">დეტალურად</a>
            <a class="primary-btn" href="payments.html?id=${encodeURIComponent(book.id)}">1 კლიკით ყიდვა</a>
          </div>
        </div>
      </article>
    `;
  }

  function filterBooks(books, search, format, genre) {
    const searchValue = String(search || "").trim().toLowerCase();
    const formatValue = format || "all";
    const genreValue = genre || "all";

    return books.filter((book) => {
      const haystack = [book.title, book.author, book.genre, book.description, book.details].join(" ").toLowerCase();
      const matchesSearch = !searchValue || haystack.includes(searchValue);
      const matchesFormat = formatValue === "all" || book.type === formatValue;
      const matchesGenre = genreValue === "all" || book.genre === genreValue;
      return matchesSearch && matchesFormat && matchesGenre;
    });
  }

  function renderSectionGrid(container, books, emptyTitle, emptyDescription) {
    if (!container) return;

    if (!books.length) {
      renderEmptyState(container, emptyTitle, emptyDescription);
      return;
    }

    container.innerHTML = books.map((book, index) => buildBookCard(book, index)).join("");
  }

  function renderAuthors(container, books) {
    if (!container) return;

    const authorMap = books.reduce((accumulator, book) => {
      const current = accumulator.get(book.author) || { name: book.author, count: 0 };
      current.count += 1;
      accumulator.set(book.author, current);
      return accumulator;
    }, new Map());

    const authors = [...authorMap.values()].sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "ka"));

    if (!authors.length) {
      renderEmptyState(container, "ავტორები ვერ მოიძებნა", "კატალოგის შევსების შემდეგ ავტორები აქ გამოჩნდება.");
      return;
    }

    container.innerHTML = authors.map((author) => `
      <article class="author-card fade-up">
        <strong>${escapeHTML(author.name)}</strong>
        <small>${author.count} გამოცემა კატალოგში</small>
        <a class="mini-link author-link" href="library.html?author=${encodeURIComponent(author.name)}">ამ ავტორის ნახვა</a>
      </article>
    `).join("");
  }

  async function renderStorefront() {
    const searchResultsGrid = document.getElementById("searchResultsGrid");
    if (!searchResultsGrid) return;

    const searchInput = document.getElementById("searchBooks");
    const formatFilter = document.getElementById("filterFormat");
    const genreFilter = document.getElementById("filterGenre");
    const searchHint = document.getElementById("searchHint");
    const ebookBooksGrid = document.getElementById("ebookBooksGrid");
    const audioBooksGrid = document.getElementById("audioBooksGrid");
    const topBooksGrid = document.getElementById("topBooksGrid");
    const authorsGrid = document.getElementById("authorsGrid");
    const newBooksGrid = document.getElementById("newBooksGrid");

    renderLoadingState(searchResultsGrid, "ძებნის სივრცე მზადდება...");
    renderLoadingState(ebookBooksGrid, "კატალოგი იტვირთება...");
    renderLoadingState(audioBooksGrid, "აუდიო კატალოგი იტვირთება...");
    renderLoadingState(topBooksGrid, "ტოპ წიგნები იტვირთება...");
    renderLoadingState(newBooksGrid, "ახალი დამატებულები იტვირთება...");

    try {
      const books = await Api.getBooks();
      const newestBooks = [...books].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const topBooks = books.filter((book) => book.topPick);

      renderSectionGrid(
        ebookBooksGrid,
        books.filter((book) => book.type === "ebook").slice(0, 4),
        "ელწიგნები ვერ მოიძებნა",
        "ელექტრონული წიგნები აქ გამოჩნდება."
      );
      renderSectionGrid(
        audioBooksGrid,
        books.filter((book) => book.type === "audio").slice(0, 4),
        "აუდიოწიგნები ვერ მოიძებნა",
        "აუდიო კატალოგი აქ გამოჩნდება."
      );
      renderSectionGrid(
        topBooksGrid,
        topBooks.slice(0, 4),
        "ტოპ სია ჯერ ცარიელია",
        "გაყიდვების დაგროვების შემდეგ აქ გამოჩნდება მოთხოვნადი წიგნები."
      );
      renderSectionGrid(
        newBooksGrid,
        newestBooks.slice(0, 4),
        "ახალი დამატებულები ვერ მოიძებნა",
        "ახალი ატვირთვები აქ გამოჩნდება."
      );
      renderAuthors(authorsGrid, books);

      const drawSearch = () => {
        const search = searchInput?.value || "";
        const format = formatFilter?.value || "all";
        const genre = genreFilter?.value || "all";
        const filtered = filterBooks(books, search, format, genre);
        const hasQuery = search.trim() || format !== "all" || genre !== "all";

        if (!hasQuery) {
          renderEmptyState(
            searchResultsGrid,
            "ძებნა დაიწყე აქედან",
            "აკრიფე სათაური, აირჩიე ჟანრი ან ფორმატი და შედეგები მაშინვე გამოჩნდება."
          );
          if (searchHint) {
            searchHint.textContent = "ძებნის შედეგები აქ გამოჩნდება.";
          }
          return;
        }

        if (searchHint) {
          searchHint.textContent = `ნაპოვნია ${filtered.length} შედეგი.`;
        }

        renderSectionGrid(
          searchResultsGrid,
          filtered,
          "შედეგი ვერ მოიძებნა",
          "სცადე სხვა სიტყვა, ჟანრი ან ფორმატი."
        );
      };

      searchInput?.addEventListener("input", drawSearch);
      formatFilter?.addEventListener("change", drawSearch);
      genreFilter?.addEventListener("change", drawSearch);
      drawSearch();
    } catch (error) {
      renderEmptyState(searchResultsGrid, "კატალოგი ვერ ჩაიტვირთა", error.message || "გთხოვ სცადო მოგვიანებით.");
    }
  }

  async function renderCatalog() {
    const booksGrid = document.getElementById("booksGrid");
    if (!booksGrid) return;

    const searchInput = document.getElementById("searchBooks");
    const formatFilter = document.getElementById("filterFormat");
    const genreFilter = document.getElementById("filterGenre");
    const catalogMeta = document.getElementById("catalogMeta");

    renderLoadingState(booksGrid, "სრული ბიბლიოთეკა იტვირთება...");

    try {
      const books = await Api.getBooks();
      const queryAuthor = query("author");
      const queryFormat = query("format");
      const queryGenre = query("genre");
      const querySearch = query("q");

      if (searchInput) {
        searchInput.value = queryAuthor || querySearch || "";
      }
      if (formatFilter && queryFormat) {
        formatFilter.value = queryFormat;
      }
      if (genreFilter && queryGenre) {
        genreFilter.value = queryGenre;
      }

      const drawCatalog = () => {
        const search = searchInput?.value || "";
        const format = formatFilter?.value || "all";
        const genre = genreFilter?.value || "all";
        const filtered = filterBooks(books, search, format, genre);

        if (catalogMeta) {
          catalogMeta.textContent = `კატალოგში ჩანს ${filtered.length} გამოცემა.`;
        }

        renderSectionGrid(
          booksGrid,
          filtered,
          "წიგნი ვერ მოიძებნა",
          "შეცვალე საძიებო სიტყვა ან ფილტრი."
        );
      };

      searchInput?.addEventListener("input", drawCatalog);
      formatFilter?.addEventListener("change", drawCatalog);
      genreFilter?.addEventListener("change", drawCatalog);
      drawCatalog();
    } catch (error) {
      renderEmptyState(booksGrid, "ბიბლიოთეკა ვერ ჩაიტვირთა", error.message || "გთხოვ სცადო მოგვიანებით.");
    }
  }

  async function renderBookDetail() {
    const container = document.getElementById("bookDetail");
    if (!container) return;

    renderLoadingState(container, "წიგნის დეტალი იტვირთება...");

    try {
      const id = query("id") || "b1";
      const book = await Api.getBook(id);

      if (!book) {
        renderEmptyState(container, "წიგნი ვერ მოიძებნა", "აირჩიე სხვა წიგნი ბიბლიოთეკიდან.");
        return;
      }

      container.innerHTML = `
        <article class="book-focus fade-up">
          ${buildCover(book, true)}

          <div class="book-focus-copy">
            <span class="eyebrow">${escapeHTML(formatTypeLabel(book.type))}</span>
            <h2>${escapeHTML(book.title)}</h2>
            <p>${escapeHTML(book.description)}</p>

            <div class="badges">
              <span class="badge">${escapeHTML(book.author)}</span>
              <span class="badge">${escapeHTML(book.genre)}</span>
              <span class="badge">${escapeHTML(book.details)}</span>
            </div>

            <div class="info-grid">
              <div class="detail-card">
                <strong>ფორმატი / ხანგრძლივობა</strong>
                <p>${escapeHTML(book.details)}</p>
              </div>
              <div class="detail-card">
                <strong>დამატების თარიღი</strong>
                <p>${escapeHTML(formatDate(book.createdAt))}</p>
              </div>
              <div class="detail-card">
                <strong>ყდის პროპორცია</strong>
                <p>1000 × 1500 სიმეტრიული გამოსატანად</p>
              </div>
            </div>

            <div class="detail-price">
              <div>
                <span>ფასი</span>
                <strong>${formatPrice(book.price)}</strong>
              </div>
              <a class="primary-btn" href="payments.html?id=${encodeURIComponent(book.id)}">1 კლიკით ყიდვა</a>
            </div>
          </div>
        </article>
      `;
    } catch (error) {
      renderEmptyState(container, "დეტალი ვერ ჩაიტვირთა", error.message || "გთხოვ სცადო მოგვიანებით.");
    }
  }

  window.AppUtils = {
    query,
    formatPrice,
    formatTypeLabel,
    formatRoleLabel,
    escapeHTML,
    formatDate,
    getCurrentUser,
    renderEmptyState,
    renderLoadingState
  };

  function init() {
    renderStorefront();
    renderCatalog();
    renderBookDetail();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
