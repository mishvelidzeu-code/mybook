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
    const visual = book.coverUrl
      ? `
        <img class="cover-image" src="${escapeHTML(book.coverUrl)}" alt="${escapeHTML(book.title)}" loading="lazy" />
        <div class="cover-overlay">
          <div class="cover-top">
            <span class="cover-type">${escapeHTML(formatTypeLabel(book.type))}</span>
            <strong class="cover-title">${escapeHTML(book.title)}</strong>
          </div>
          <div class="cover-bottom">
            <div class="cover-size">1000 × 1500</div>
            <div class="cover-author">${escapeHTML(book.author)}</div>
          </div>
        </div>
      `
      : `
        <div class="cover-top">
          <span class="cover-type">${escapeHTML(formatTypeLabel(book.type))}</span>
          <strong class="cover-title">${escapeHTML(book.title)}</strong>
        </div>
        <div class="cover-bottom">
          <div class="cover-size">1000 × 1500</div>
          <div class="cover-author">${escapeHTML(book.author)}</div>
        </div>
      `;

    return `
      <div class="${coverClass}">
        ${visual}
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
            ${book.ageRestricted ? '<span class="badge badge-danger">18+</span>' : ""}
          </div>
          <div class="price-row">
            <div class="price-label">
              <span>ფასი</span>
              <strong>${formatPrice(book.price)}</strong>
            </div>
          </div>
          <div class="button-row">
            <a class="ghost-btn" href="book.html?id=${encodeURIComponent(book.id)}">ნახვა</a>
            <a class="primary-btn" href="payments.html?id=${encodeURIComponent(book.id)}">ყიდვა</a>
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

  function resolvePublicCoverUrl(path) {
    if (!path) return "";

    const bucket = window.APP_CONFIG?.SUPABASE_COVERS_BUCKET;
    const client = window.SupabaseService?.getClient?.();
    if (!bucket || !client) return "";

    try {
      const { data } = client.storage.from(bucket).getPublicUrl(path);
      return data?.publicUrl || "";
    } catch (error) {
      return "";
    }
  }

  function normalizeViewBook(book) {
    if (!book) return null;

    const type = book.type === "audio" ? "audio" : "ebook";
    const details = String(book.details || (type === "audio" ? "MP3" : "PDF / EPUB")).trim();
    const coverPath = book.coverPath || book.cover_path || "";

    return {
      id: String(book.id || ""),
      title: String(book.title || "").trim(),
      author: String(book.author || "").trim(),
      genre: String(book.genre || "").trim(),
      type,
      details,
      price: Number(book.price || 0),
      description: String(book.description || "").trim(),
      topPick: Boolean(book.topPick ?? book.top_pick),
      ageRestricted: Boolean(book.ageRestricted ?? book.age_restricted),
      uploaderId: book.uploaderId || book.uploader_id || "",
      filePath: book.filePath || book.file_path || "",
      coverPath,
      coverUrl: book.coverUrl || resolvePublicCoverUrl(coverPath),
      createdAt: book.createdAt || book.created_at || new Date().toISOString(),
      updatedAt: book.updatedAt || book.updated_at || book.createdAt || book.created_at || new Date().toISOString()
    };
  }

  async function fetchBooksFromSupabaseRest() {
    const config = window.APP_CONFIG || {};
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
      return [];
    }

    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/books?select=*&order=created_at.desc`,
      {
        headers: {
          apikey: config.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase REST ${response.status}`);
    }

    const rows = await response.json();
    return Array.isArray(rows) ? rows.map(normalizeViewBook).filter(Boolean) : [];
  }

  async function fetchBookFromSupabaseRest(id) {
    const config = window.APP_CONFIG || {};
    if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY || !id) {
      return null;
    }

    const response = await fetch(
      `${config.SUPABASE_URL}/rest/v1/books?id=eq.${encodeURIComponent(id)}&select=*`,
      {
        headers: {
          apikey: config.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${config.SUPABASE_ANON_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase REST ${response.status}`);
    }

    const rows = await response.json();
    return Array.isArray(rows) && rows.length ? normalizeViewBook(rows[0]) : null;
  }

  async function loadBooksForView() {
    try {
      const books = await Api.getBooks();
      if (Array.isArray(books) && books.length) {
        return books.map(normalizeViewBook).filter(Boolean);
      }
    } catch (error) {
      // Fall through to direct REST fetch.
    }

    return fetchBooksFromSupabaseRest();
  }

  async function loadBookForView(id) {
    if (!id) {
      const books = await loadBooksForView();
      return books[0] || null;
    }

    try {
      const book = await Api.getBook(id);
      if (book) {
        return normalizeViewBook(book);
      }
    } catch (error) {
      // Fall through to direct REST fetch.
    }

    return fetchBookFromSupabaseRest(id);
  }

  function renderSectionGrid(container, books, emptyTitle, emptyDescription) {
    if (!container) return;

    if (!books.length) {
      renderEmptyState(container, emptyTitle, emptyDescription);
      return;
    }

    container.innerHTML = books.map((book, index) => buildBookCard(book, index)).join("");
  }

  function renderAuthors(container, books, searchValue = "") {
    if (!container) return;

    const normalizedSearch = String(searchValue || "").trim().toLowerCase();
    const authorMap = books.reduce((accumulator, book) => {
      const current = accumulator.get(book.author) || { name: book.author, count: 0 };
      current.count += 1;
      accumulator.set(book.author, current);
      return accumulator;
    }, new Map());

    const authors = [...authorMap.values()]
      .filter((author) => !normalizedSearch || author.name.toLowerCase().includes(normalizedSearch))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name, "ka"));

    if (!authors.length) {
      renderEmptyState(container, "ავტორი ვერ მოიძებნა", "სცადე სხვა სახელი ან გაასუფთავე ძებნა.");
      return;
    }

    container.innerHTML = authors.map((author) => `
      <article class="author-card author-card--slide fade-up">
        <strong>${escapeHTML(author.name)}</strong>
        <small>${author.count} წიგნი კატალოგში</small>
        <a class="mini-link author-link" href="library.html?author=${encodeURIComponent(author.name)}">ამ ავტორის ნახვა</a>
      </article>
    `).join("");
  }

  async function renderStorefront() {
    const ebookBooksGrid = document.getElementById("ebookBooksGrid");
    if (!ebookBooksGrid) return;

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchBooks");
    const formatFilter = document.getElementById("filterFormat");
    const genreFilter = document.getElementById("filterGenre");
    const authorSearch = document.getElementById("authorSearch");
    const audioBooksGrid = document.getElementById("audioBooksGrid");
    const topBooksGrid = document.getElementById("topBooksGrid");
    const authorsGrid = document.getElementById("authorsGrid");
    const newBooksGrid = document.getElementById("newBooksGrid");

    renderLoadingState(ebookBooksGrid, "კატალოგი იტვირთება...");
    renderLoadingState(audioBooksGrid, "აუდიო კატალოგი იტვირთება...");
    renderLoadingState(topBooksGrid, "ტოპ წიგნები იტვირთება...");
    renderLoadingState(authorsGrid, "ავტორები იტვირთება...");
    renderLoadingState(newBooksGrid, "ახალი დამატებულები იტვირთება...");

    try {
      const books = await loadBooksForView();
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
      const drawAuthors = () => {
        renderAuthors(authorsGrid, books, authorSearch?.value || "");
      };

      searchForm?.addEventListener("submit", (event) => {
        event.preventDefault();

        const params = new URLSearchParams();
        const searchValue = String(searchInput?.value || "").trim();
        const formatValue = formatFilter?.value || "all";
        const genreValue = genreFilter?.value || "all";

        if (searchValue) {
          params.set("q", searchValue);
        }
        if (formatValue !== "all") {
          params.set("format", formatValue);
        }
        if (genreValue !== "all") {
          params.set("genre", genreValue);
        }

        const targetUrl = params.toString() ? `library.html?${params.toString()}` : "library.html";
        window.location.href = targetUrl;
      });

      authorSearch?.addEventListener("input", drawAuthors);
      drawAuthors();
    } catch (error) {
      renderEmptyState(ebookBooksGrid, "კატალოგი ვერ ჩაიტვირთა", error.message || "გთხოვ სცადო მოგვიანებით.");
      renderEmptyState(audioBooksGrid, "აუდიო კატალოგი ვერ ჩაიტვირთა", "გთხოვ სცადო მოგვიანებით.");
      renderEmptyState(topBooksGrid, "ტოპ სია ვერ ჩაიტვირთა", "გთხოვ სცადო მოგვიანებით.");
      renderEmptyState(authorsGrid, "ავტორები ვერ ჩაიტვირთა", "გთხოვ სცადო მოგვიანებით.");
      renderEmptyState(newBooksGrid, "ახალი დამატებულები ვერ ჩაიტვირთა", "გთხოვ სცადო მოგვიანებით.");
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
      const books = await loadBooksForView();
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
      const id = query("id");
      const book = await loadBookForView(id);

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
              ${book.ageRestricted ? '<span class="badge badge-danger">18+</span>' : ""}
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
              <div class="detail-card">
                <strong>ასაკობრივი მონიშვნა</strong>
                <p>${book.ageRestricted ? "მხოლოდ 18+ მკითხველისთვის" : "შეზღუდვის გარეშე"}</p>
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
