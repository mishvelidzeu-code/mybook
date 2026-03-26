(function () {
  const DEMO_STORE_KEY = "lurji-taro-demo-store";
  const DEMO_STORE_VERSION = 3;

  const defaultDemoStore = {
    version: DEMO_STORE_VERSION,
    users: [
      {
        id: 1,
        name: "ადმინისტრატორი",
        email: "admin@lurjitaro.ge",
        password: "admin123",
        role: "admin",
        createdAt: "2026-03-20T10:00:00.000Z"
      },
      {
        id: 2,
        name: "ნინო კობახიძე",
        email: "nino@author.ge",
        password: "author123",
        role: "author",
        createdAt: "2026-03-21T11:30:00.000Z"
      },
      {
        id: 3,
        name: "პოდკასტ სტუდიო",
        email: "studio@audio.ge",
        password: "publisher123",
        role: "publisher",
        createdAt: "2026-03-22T09:10:00.000Z"
      }
    ],
    books: [
      {
        id: "b1",
        title: "ღრმა ფოკუსი",
        author: "ნინო კობახიძე",
        genre: "ბიზნესი",
        type: "ebook",
        details: "PDF / EPUB",
        price: 18.9,
        description: "პრაქტიკული წიგნი მათთვის, ვინც სამუშაოს და სწავლას ერთიან რიტმში აწყობს.",
        topPick: true,
        ageRestricted: false,
        uploaderId: 2,
        fileName: "ghrma-fokusi.pdf",
        coverName: "ghrma-fokusi-cover.jpg",
        createdAt: "2026-03-24T08:00:00.000Z",
        updatedAt: "2026-03-24T08:00:00.000Z"
      },
      {
        id: "b2",
        title: "დილის პატარა ჩვევა",
        author: "თამარ ბურდული",
        genre: "მოტივაცია",
        type: "ebook",
        details: "PDF / EPUB",
        price: 14.5,
        description: "მოკლე და სასიამოვნო გზამკვლევი დილის რუტინის შესაქმნელად.",
        topPick: false,
        ageRestricted: false,
        uploaderId: 1,
        fileName: "dilis-patara-chveva.pdf",
        coverName: "dilis-patara-chveva-cover.jpg",
        createdAt: "2026-03-25T08:00:00.000Z",
        updatedAt: "2026-03-25T08:00:00.000Z"
      },
      {
        id: "b3",
        title: "ფსიქოლოგია მშვიდი გონებისთვის",
        author: "მარიამ ჯაფარიძე",
        genre: "ფსიქოლოგია",
        type: "ebook",
        details: "PDF / EPUB / MOBI",
        price: 21.0,
        description: "დაძაბული დღის ფონზე ყურადღების, ემოციის და ენერგიის მართვის წიგნი.",
        topPick: true,
        ageRestricted: false,
        uploaderId: 1,
        fileName: "fsiqologia-mshvidi-gonebistvis.epub",
        coverName: "fsiqologia-mshvidi-gonebistvis-cover.jpg",
        createdAt: "2026-03-26T07:50:00.000Z",
        updatedAt: "2026-03-26T07:50:00.000Z"
      },
      {
        id: "b4",
        title: "გზაში მოსასმენი მოტივაცია",
        author: "პოდკასტ სტუდიო",
        genre: "მოტივაცია",
        type: "audio",
        details: "4სთ 20წთ",
        price: 17.0,
        description: "მოკლე აუდიო ეპიზოდებად დაყოფილი მოტივაციური ჩანაწერები ყოველდღიური ტემპისთვის.",
        topPick: true,
        ageRestricted: false,
        uploaderId: 3,
        fileName: "gzashi-mosasmeni-motivacia.mp3",
        coverName: "gzashi-mosasmeni-motivacia-cover.jpg",
        createdAt: "2026-03-23T13:10:00.000Z",
        updatedAt: "2026-03-23T13:10:00.000Z"
      },
      {
        id: "b5",
        title: "რომანი ზღვის პირას",
        author: "ლიკა ბერიძე",
        genre: "რომანი",
        type: "audio",
        details: "6სთ 05წთ",
        price: 24.0,
        description: "სასიამოვნო აუდიო რომანი თბილი ტემპით, მოგზაურობისა და დასვენებისთვის.",
        topPick: false,
        ageRestricted: true,
        uploaderId: 1,
        fileName: "romani-zgvis-piras.mp3",
        coverName: "romani-zgvis-piras-cover.jpg",
        createdAt: "2026-03-26T09:00:00.000Z",
        updatedAt: "2026-03-26T09:00:00.000Z"
      },
      {
        id: "b6",
        title: "საკუთარი ტემპის პოვნა",
        author: "ნინო კობახიძე",
        genre: "თვითგანვითარება",
        type: "ebook",
        details: "PDF / EPUB",
        price: 19.0,
        description: "რბილი, პრაქტიკული და მკითხველზე მორგებული ტექსტი შინაგანი რიტმის შესაქმნელად.",
        topPick: false,
        ageRestricted: false,
        uploaderId: 2,
        fileName: "sakutari-tempis-povna.pdf",
        coverName: "sakutari-tempis-povna-cover.jpg",
        createdAt: "2026-03-26T11:20:00.000Z",
        updatedAt: "2026-03-26T11:20:00.000Z"
      },
      {
        id: "b7",
        title: "აუდიო ბლოკნოტი წარმატებისთვის",
        author: "გიორგი თაბაგარი",
        genre: "ბიზნესი",
        type: "audio",
        details: "3სთ 40წთ",
        price: 16.5,
        description: "ხმის ჩანაწერების ფორმატში შედგენილი კონცენტრირებული იდეები შედეგიანობისთვის.",
        topPick: false,
        ageRestricted: false,
        uploaderId: 1,
        fileName: "audio-bloknoti-warmatebistvis.mp3",
        coverName: "audio-bloknoti-warmatebistvis-cover.jpg",
        createdAt: "2026-03-25T16:40:00.000Z",
        updatedAt: "2026-03-25T16:40:00.000Z"
      }
    ],
    sales: [
      {
        id: "s1",
        bookId: "b1",
        book: "ღრმა ფოკუსი",
        buyer: "reader1@mail.com",
        amount: 18.9,
        createdAt: "2026-03-25T12:10:00.000Z"
      },
      {
        id: "s2",
        bookId: "b4",
        book: "გზაში მოსასმენი მოტივაცია",
        buyer: "reader2@mail.com",
        amount: 17.0,
        createdAt: "2026-03-25T16:40:00.000Z"
      }
    ],
    counters: {
      user: 4,
      book: 8,
      sale: 3
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readJson(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function clearSession() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  function getCurrentUser() {
    return readJson("user");
  }

  function sanitizeUser(user) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  function parseJsonBody(body) {
    if (!body) return {};
    if (typeof body === "string") {
      try {
        return JSON.parse(body);
      } catch (error) {
        return {};
      }
    }
    return body;
  }

  function boolFromValue(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      return normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes";
    }
    return Boolean(value);
  }

  function normalizeBook(book, users) {
    const matchedUser = users.find((user) => user.name === book.author);
    const type = book.type === "audio" ? "audio" : "ebook";
    const createdAt = book.createdAt || new Date().toISOString();

    return {
      id: String(book.id || ""),
      title: String(book.title || "").trim(),
      author: String(book.author || "").trim(),
      genre: String(book.genre || "").trim(),
      type,
      details: String(book.details || (type === "audio" ? "MP3" : "PDF / EPUB")).trim(),
      price: Number(book.price || 0),
      description: String(book.description || "").trim(),
      topPick: Boolean(book.topPick),
      ageRestricted: Boolean(book.ageRestricted),
      uploaderId: Number(book.uploaderId || matchedUser?.id || 1),
      fileName: String(book.fileName || `${book.id || "book"}.${type === "audio" ? "mp3" : "pdf"}`),
      coverName: String(book.coverName || `${book.id || "book"}-cover.jpg`),
      createdAt,
      updatedAt: book.updatedAt || createdAt
    };
  }

  function normalizeStore(store) {
    const users = Array.isArray(store?.users) ? store.users : [];
    const books = Array.isArray(store?.books) ? store.books.map((book) => normalizeBook(book, users)) : [];
    const sales = Array.isArray(store?.sales) ? store.sales : [];

    return {
      version: DEMO_STORE_VERSION,
      users,
      books,
      sales,
      counters: {
        user: Math.max(Number(store?.counters?.user || 1), users.length + 1),
        book: Math.max(Number(store?.counters?.book || 1), books.length + 1),
        sale: Math.max(Number(store?.counters?.sale || 1), sales.length + 1)
      }
    };
  }

  function ensureDemoStore() {
    const store = readJson(DEMO_STORE_KEY);

    if (!store) {
      const seeded = clone(defaultDemoStore);
      writeJson(DEMO_STORE_KEY, seeded);
      return seeded;
    }

    const normalized = normalizeStore(store);

    if (store.version !== DEMO_STORE_VERSION || JSON.stringify(store) !== JSON.stringify(normalized)) {
      writeJson(DEMO_STORE_KEY, normalized);
    }

    return normalized;
  }

  function saveDemoStore(store) {
    const normalized = normalizeStore(store);
    writeJson(DEMO_STORE_KEY, normalized);
  }

  function nextId(store, type, prefix) {
    const nextValue = store.counters[type];
    store.counters[type] += 1;
    return `${prefix}${nextValue}`;
  }

  function requireDemoUser(roles) {
    const user = getCurrentUser();

    if (!user) {
      throw new Error("ატვირთვისთვის ან პანელისთვის საჭიროა ავტორის ანგარიშით შესვლა");
    }

    if (Array.isArray(roles) && !roles.includes(user.role)) {
      throw new Error("ამ მოქმედებისთვის საჭიროა ავტორი, გამომცემლობა ან ადმინისტრატორი");
    }

    return user;
  }

  function findBookById(store, id) {
    return store.books.find((entry) => entry.id === id);
  }

  function canEditBook(user, book) {
    return user?.role === "admin" || user?.id === book.uploaderId;
  }

  function validateBookPayload(fields, options = {}) {
    const isUpdate = Boolean(options.isUpdate);

    if (
      !fields.title
      || !fields.author
      || !["ebook", "audio"].includes(fields.type)
      || !fields.genre
      || !fields.details
      || !fields.description
      || !Number.isFinite(fields.price)
      || fields.price < 0
    ) {
      throw new Error("გთხოვ შეავსო ყველა აუცილებელი ველი");
    }

    if (!isUpdate && (!fields.ebookFile || !fields.coverFile)) {
      throw new Error("გთხოვ ატვირთო წიგნის ფაილი და ყდა");
    }
  }

  function extractFormFields(payload) {
    return {
      title: String(payload.get("title") || "").trim(),
      author: String(payload.get("author") || "").trim(),
      type: String(payload.get("type") || "").trim(),
      genre: String(payload.get("genre") || "").trim(),
      details: String(payload.get("details") || "").trim(),
      price: Number(payload.get("price") || 0),
      description: String(payload.get("description") || "").trim(),
      ageRestricted: boolFromValue(payload.get("ageRestricted")),
      topPick: boolFromValue(payload.get("topPick")),
      ebookFile: payload.get("ebook"),
      coverFile: payload.get("cover")
    };
  }

  const DemoApi = {
    async handle(path, options = {}) {
      const method = (options.method || "GET").toUpperCase();
      await new Promise((resolve) => setTimeout(resolve, 220));

      const store = ensureDemoStore();

      if (path === "/auth/login" && method === "POST") {
        const payload = parseJsonBody(options.body);
        const user = store.users.find((entry) => {
          return entry.email.toLowerCase() === String(payload.email || "").trim().toLowerCase()
            && entry.password === String(payload.password || "");
        });

        if (!user) {
          throw new Error("ელფოსტა ან პაროლი არასწორია");
        }

        return {
          token: `demo-token-${user.id}`,
          user: sanitizeUser(user)
        };
      }

      if (path === "/auth/register" && method === "POST") {
        const payload = parseJsonBody(options.body);
        const email = String(payload.email || "").trim().toLowerCase();

        if (!payload.name || !email || !payload.password) {
          throw new Error("გთხოვ შეავსო ყველა აუცილებელი ველი");
        }

        if (store.users.some((entry) => entry.email.toLowerCase() === email)) {
          throw new Error("ეს ელფოსტა უკვე გამოყენებულია");
        }

        const role = payload.role === "publisher" ? "publisher" : "author";
        const newUser = {
          id: store.counters.user,
          name: String(payload.name).trim(),
          email,
          password: String(payload.password),
          role,
          createdAt: new Date().toISOString()
        };

        store.users.push(newUser);
        store.counters.user += 1;
        saveDemoStore(store);

        return {
          success: true,
          message: "რეგისტრაცია დასრულდა, შეგიძლია ატვირთვა დაიწყო",
          token: `demo-token-${newUser.id}`,
          user: sanitizeUser(newUser)
        };
      }

      if (path === "/books" && method === "GET") {
        return clone(store.books).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (path === "/books/mine" && method === "GET") {
        const user = requireDemoUser(["author", "publisher", "admin"]);
        return clone(store.books)
          .filter((book) => book.uploaderId === user.id)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (/^\/books\/[^/]+$/.test(path) && method === "GET") {
        const id = decodeURIComponent(path.split("/").pop());
        const book = findBookById(store, id);
        return book ? clone(book) : null;
      }

      if (path === "/books/upload" && method === "POST") {
        const user = requireDemoUser(["author", "publisher", "admin"]);
        const payload = options.body instanceof FormData ? options.body : null;

        if (!payload) {
          throw new Error("ატვირთვის მონაცემები ვერ მოიძებნა");
        }

        const fields = extractFormFields(payload);
        validateBookPayload(fields);

        const newBook = {
          id: `b${store.counters.book}`,
          title: fields.title,
          author: fields.author,
          genre: fields.genre,
          type: fields.type,
          details: fields.details,
          price: fields.price,
          description: fields.description,
          topPick: fields.topPick,
          ageRestricted: fields.ageRestricted,
          uploaderId: user.id,
          fileName: typeof fields.ebookFile === "object" && "name" in fields.ebookFile ? fields.ebookFile.name : "book-file",
          coverName: typeof fields.coverFile === "object" && "name" in fields.coverFile ? fields.coverFile.name : "cover-file",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        store.books.unshift(newBook);
        store.counters.book += 1;
        saveDemoStore(store);

        return {
          success: true,
          message: "გამოცემა წარმატებით დაემატა კატალოგს",
          book: clone(newBook)
        };
      }

      if (/^\/books\/[^/]+$/.test(path) && method === "PUT") {
        const user = requireDemoUser(["author", "publisher", "admin"]);
        const id = decodeURIComponent(path.split("/").pop());
        const book = findBookById(store, id);

        if (!book) {
          throw new Error("რედაქტირებისთვის წიგნი ვერ მოიძებნა");
        }

        if (!canEditBook(user, book)) {
          throw new Error("ამ წიგნის რედაქტირების უფლება არ გაქვს");
        }

        const payload = options.body instanceof FormData ? options.body : null;
        if (!payload) {
          throw new Error("რედაქტირების მონაცემები ვერ მოიძებნა");
        }

        const fields = extractFormFields(payload);
        validateBookPayload(fields, { isUpdate: true });

        book.title = fields.title;
        book.author = fields.author;
        book.genre = fields.genre;
        book.type = fields.type;
        book.details = fields.details;
        book.price = fields.price;
        book.description = fields.description;
        book.ageRestricted = fields.ageRestricted;
        book.topPick = fields.topPick;
        book.updatedAt = new Date().toISOString();

        if (fields.ebookFile && typeof fields.ebookFile === "object" && "name" in fields.ebookFile && fields.ebookFile.name) {
          book.fileName = fields.ebookFile.name;
        }

        if (fields.coverFile && typeof fields.coverFile === "object" && "name" in fields.coverFile && fields.coverFile.name) {
          book.coverName = fields.coverFile.name;
        }

        saveDemoStore(store);

        return {
          success: true,
          message: "წიგნის მონაცემები განახლდა",
          book: clone(book)
        };
      }

      if (path === "/admin/stats" && method === "GET") {
        return {
          books: store.books.length,
          users: store.users.length,
          sales: store.sales.length
        };
      }

      if (path === "/admin/users" && method === "GET") {
        return store.users.map((user) => sanitizeUser(user));
      }

      if (path === "/admin/sales" && method === "GET") {
        return clone(store.sales).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (path === "/payments/create-intent" && method === "POST") {
        const payload = parseJsonBody(options.body);
        const book = findBookById(store, payload.bookId);

        if (!book) {
          throw new Error("არჩეული წიგნი ვერ მოიძებნა");
        }

        const buyerEmail = String(payload.buyerEmail || "").trim().toLowerCase() || "guest@lurjitaro.demo";
        const sale = {
          id: nextId(store, "sale", "s"),
          bookId: book.id,
          book: book.title,
          buyer: buyerEmail,
          amount: Number(payload.amount) || Number(book.price) || 0,
          createdAt: new Date().toISOString()
        };

        store.sales.unshift(sale);
        saveDemoStore(store);

        return {
          success: true,
          clientSecret: "demo-client-secret",
          message: "შეძენა დადასტურდა, წიგნის ბმული გაიგზავნება მითითებულ ელფოსტაზე"
        };
      }

      throw new Error("მითითებული სატესტო მისამართი ვერ დამუშავდა");
    }
  };

  const Api = {
    getSupabaseMethod(name) {
      const service = window.SupabaseService;

      if (!service || typeof service.isEnabled !== "function" || !service.isEnabled()) {
        return null;
      }

      const method = service[name];
      return typeof method === "function" ? method.bind(service) : null;
    },

    async request(path, options = {}) {
      if (window.APP_CONFIG?.DEMO_MODE) {
        return DemoApi.handle(path, options);
      }

      const token = localStorage.getItem("token");
      const headers = {
        ...(options.headers || {})
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}${path}`, {
        ...options,
        headers
      });

      if (!response.ok) {
        let errorMessage = "მოთხოვნა ვერ შესრულდა";

        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (error) {
          errorMessage = response.statusText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      if (response.status === 204) {
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return response.json();
      }

      return response.text();
    },

    login(payload) {
      const supabaseMethod = this.getSupabaseMethod("signIn");
      if (supabaseMethod) {
        return supabaseMethod(payload);
      }

      return this.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    register(payload) {
      const supabaseMethod = this.getSupabaseMethod("signUp");
      if (supabaseMethod) {
        return supabaseMethod(payload);
      }

      return this.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    getBooks() {
      const supabaseMethod = this.getSupabaseMethod("getBooks");
      if (supabaseMethod) {
        return supabaseMethod();
      }

      return this.request("/books");
    },

    getMyBooks() {
      const supabaseMethod = this.getSupabaseMethod("getMyBooks");
      if (supabaseMethod) {
        return supabaseMethod();
      }

      return this.request("/books/mine");
    },

    getBook(id) {
      const supabaseMethod = this.getSupabaseMethod("getBook");
      if (supabaseMethod) {
        return supabaseMethod(id);
      }

      return this.request(`/books/${encodeURIComponent(id)}`);
    },

    uploadBook(payload) {
      const supabaseMethod = this.getSupabaseMethod("uploadBook");
      if (supabaseMethod) {
        return supabaseMethod(payload);
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });

      return this.request("/books/upload", {
        method: "POST",
        body: formData
      });
    },

    updateBook(id, payload) {
      const supabaseMethod = this.getSupabaseMethod("updateBook");
      if (supabaseMethod) {
        return supabaseMethod(id, payload);
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, value);
        }
      });

      return this.request(`/books/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: formData
      });
    },

    getAdminStats() {
      const supabaseMethod = this.getSupabaseMethod("getAdminStats");
      if (supabaseMethod) {
        return supabaseMethod();
      }

      return this.request("/admin/stats");
    },

    getUsers() {
      const supabaseMethod = this.getSupabaseMethod("getUsers");
      if (supabaseMethod) {
        return supabaseMethod();
      }

      return this.request("/admin/users");
    },

    getSales() {
      const supabaseMethod = this.getSupabaseMethod("getSales");
      if (supabaseMethod) {
        return supabaseMethod();
      }

      return this.request("/admin/sales");
    },

    createPaymentIntent(payload) {
      const supabaseMethod = this.getSupabaseMethod("createPaymentIntent");
      if (supabaseMethod) {
        return supabaseMethod(payload);
      }

      return this.request("/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
  };

  window.Api = Api;
})();
