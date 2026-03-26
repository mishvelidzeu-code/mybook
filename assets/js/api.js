(function () {
  const DEMO_STORE_KEY = "noirleaf-demo-store";

  const defaultDemoStore = {
    users: [
      {
        id: 1,
        name: "Admin User",
        email: "admin@noirleaf.com",
        password: "admin123",
        role: "admin",
        createdAt: "2026-03-20T10:00:00.000Z"
      },
      {
        id: 2,
        name: "Ucha Mishvelidze",
        email: "ucha@example.com",
        password: "author123",
        role: "author",
        createdAt: "2026-03-21T11:30:00.000Z"
      }
    ],
    books: [
      {
        id: "b1",
        title: "შენ არ ხარ შემთხვევითი",
        author: "Ucha Studio",
        genre: "მოტივაცია",
        price: 19.99,
        description: "მოკლე, ძლიერი და გაყიდვადი წიგნი ციფრული თაობისთვის.",
        createdAt: "2026-03-22T08:00:00.000Z"
      },
      {
        id: "b2",
        title: "დისციპლინის ძალა",
        author: "NoirLeaf Originals",
        genre: "ბიზნესი",
        price: 24.0,
        description: "პრაქტიკული სისტემა მაღალი შედეგებისთვის.",
        createdAt: "2026-03-23T08:00:00.000Z"
      },
      {
        id: "b3",
        title: "ფსიქოლოგია გამარჯვებისთვის",
        author: "N. Atelier",
        genre: "ფსიქოლოგია",
        price: 29.0,
        description: "გონებრივი ფოკუსის და თვითკონტროლის პრემიუმ გზამკვლევი.",
        createdAt: "2026-03-24T08:00:00.000Z"
      }
    ],
    sales: [
      {
        id: "s1",
        bookId: "b1",
        book: "შენ არ ხარ შემთხვევითი",
        buyer: "reader1@mail.com",
        amount: 19.99,
        createdAt: "2026-03-24T15:10:00.000Z"
      },
      {
        id: "s2",
        bookId: "b2",
        book: "დისციპლინის ძალა",
        buyer: "reader2@mail.com",
        amount: 24.0,
        createdAt: "2026-03-25T16:40:00.000Z"
      }
    ],
    counters: {
      user: 3,
      book: 4,
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

  function getCurrentUser() {
    return readJson("user");
  }

  function sanitizeUser(user) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  function ensureDemoStore() {
    const store = readJson(DEMO_STORE_KEY);
    if (store && Array.isArray(store.users) && Array.isArray(store.books) && Array.isArray(store.sales)) {
      return store;
    }

    const seeded = clone(defaultDemoStore);
    writeJson(DEMO_STORE_KEY, seeded);
    return seeded;
  }

  function saveDemoStore(store) {
    writeJson(DEMO_STORE_KEY, store);
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

  function nextId(store, type, prefix) {
    store.counters[type] += 1;
    return `${prefix}${store.counters[type] - 1}`;
  }

  function requireDemoUser(roles) {
    const user = getCurrentUser();

    if (!user) {
      throw new Error("გთხოვ ჯერ შეხვიდე სისტემაში");
    }

    if (Array.isArray(roles) && !roles.includes(user.role)) {
      throw new Error("ამ მოქმედებისთვის საჭიროა author ან admin ანგარიში");
    }

    return user;
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
          throw new Error("Email ან password არასწორია");
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
          throw new Error("ეს email უკვე გამოყენებულია");
        }

        const newUser = {
          id: store.counters.user,
          name: String(payload.name).trim(),
          email,
          password: String(payload.password),
          role: payload.role === "author" ? "author" : "reader",
          createdAt: new Date().toISOString()
        };

        store.users.push(newUser);
        store.counters.user += 1;
        saveDemoStore(store);

        return {
          success: true,
          message: "ანგარიში წარმატებით შეიქმნა",
          user: sanitizeUser(newUser)
        };
      }

      if (path === "/books" && method === "GET") {
        return clone(store.books).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      if (/^\/books\/[^/]+$/.test(path) && method === "GET") {
        const id = decodeURIComponent(path.split("/").pop());
        const book = store.books.find((entry) => entry.id === id);
        return book ? clone(book) : null;
      }

      if (path === "/books/upload" && method === "POST") {
        const user = requireDemoUser(["author", "admin"]);
        const payload = options.body instanceof FormData ? options.body : null;

        if (!payload) {
          throw new Error("FormData payload ვერ მოიძებნა");
        }

        const title = String(payload.get("title") || "").trim();
        const author = String(payload.get("author") || "").trim();
        const genre = String(payload.get("genre") || "").trim();
        const description = String(payload.get("description") || "").trim();
        const price = Number(payload.get("price") || 0);
        const ebook = payload.get("ebook");
        const cover = payload.get("cover");

        if (
          !title
          || !author
          || !genre
          || !description
          || !Number.isFinite(price)
          || price < 0
          || !ebook
          || !cover
        ) {
          throw new Error("ატვირთვისთვის ყველა ველია სავალდებულო");
        }

        const newBook = {
          id: `b${store.counters.book}`,
          title,
          author,
          genre,
          price,
          description,
          createdAt: new Date().toISOString(),
          uploaderId: user.id,
          fileName: typeof ebook === "object" && "name" in ebook ? ebook.name : "ebook-file",
          coverName: typeof cover === "object" && "name" in cover ? cover.name : "cover-file"
        };

        store.books.unshift(newBook);
        store.counters.book += 1;
        saveDemoStore(store);

        return {
          success: true,
          message: "წიგნი წარმატებით აიტვირთა",
          book: clone(newBook)
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
        const book = store.books.find((entry) => entry.id === payload.bookId);

        if (!book) {
          throw new Error("გადასახდელი წიგნი ვერ მოიძებნა");
        }

        const buyer = getCurrentUser();
        const sale = {
          id: nextId(store, "sale", "s"),
          bookId: book.id,
          book: book.title,
          buyer: buyer?.email || "guest@noirleaf.demo",
          amount: Number(payload.amount) || Number(book.price) || 0,
          createdAt: new Date().toISOString()
        };

        store.sales.unshift(sale);
        saveDemoStore(store);

        return {
          success: true,
          clientSecret: "demo-client-secret",
          message: "გადახდა წარმატებით სიმულირდა demo რეჟიმში"
        };
      }

      throw new Error("Demo route not implemented");
    }
  };

  const Api = {
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
        let errorMessage = "Request failed";

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
      return this.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    register(payload) {
      return this.request("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    },

    getBooks() {
      return this.request("/books");
    },

    getBook(id) {
      return this.request(`/books/${encodeURIComponent(id)}`);
    },

    uploadBook(payload) {
      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value);
      });

      return this.request("/books/upload", {
        method: "POST",
        body: formData
      });
    },

    getAdminStats() {
      return this.request("/admin/stats");
    },

    getUsers() {
      return this.request("/admin/users");
    },

    getSales() {
      return this.request("/admin/sales");
    },

    createPaymentIntent(payload) {
      return this.request("/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
    }
  };

  window.Api = Api;
})();
