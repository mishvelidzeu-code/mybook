(function () {
  const DEMO_STORE_KEY = "lurji-taro-demo-store";
  const DEMO_STORE_VERSION = 2;

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
        createdAt: "2026-03-24T08:00:00.000Z"
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
        createdAt: "2026-03-25T08:00:00.000Z"
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
        createdAt: "2026-03-26T07:50:00.000Z"
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
        createdAt: "2026-03-23T13:10:00.000Z"
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
        createdAt: "2026-03-26T09:00:00.000Z"
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
        createdAt: "2026-03-26T11:20:00.000Z"
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
        createdAt: "2026-03-25T16:40:00.000Z"
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

  function ensureDemoStore() {
    const store = readJson(DEMO_STORE_KEY);

    if (
      store
      && store.version === DEMO_STORE_VERSION
      && Array.isArray(store.users)
      && Array.isArray(store.books)
      && Array.isArray(store.sales)
    ) {
      return store;
    }

    clearSession();
    const seeded = clone(defaultDemoStore);
    writeJson(DEMO_STORE_KEY, seeded);
    return seeded;
  }

  function saveDemoStore(store) {
    store.version = DEMO_STORE_VERSION;
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

      if (/^\/books\/[^/]+$/.test(path) && method === "GET") {
        const id = decodeURIComponent(path.split("/").pop());
        const book = store.books.find((entry) => entry.id === id);
        return book ? clone(book) : null;
      }

      if (path === "/books/upload" && method === "POST") {
        const user = requireDemoUser(["author", "publisher", "admin"]);
        const payload = options.body instanceof FormData ? options.body : null;

        if (!payload) {
          throw new Error("ატვირთვის მონაცემები ვერ მოიძებნა");
        }

        const title = String(payload.get("title") || "").trim();
        const author = String(payload.get("author") || "").trim();
        const type = String(payload.get("type") || "").trim();
        const genre = String(payload.get("genre") || "").trim();
        const details = String(payload.get("details") || "").trim();
        const description = String(payload.get("description") || "").trim();
        const price = Number(payload.get("price") || 0);
        const ebook = payload.get("ebook");
        const cover = payload.get("cover");

        if (
          !title
          || !author
          || !["ebook", "audio"].includes(type)
          || !genre
          || !details
          || !description
          || !Number.isFinite(price)
          || price < 0
          || !ebook
          || !cover
        ) {
          throw new Error("გთხოვ შეავსო ყველა ველი და ატვირთო ფაილებიც");
        }

        const newBook = {
          id: `b${store.counters.book}`,
          title,
          author,
          genre,
          type,
          details,
          price,
          description,
          topPick: false,
          createdAt: new Date().toISOString(),
          uploaderId: user.id,
          fileName: typeof ebook === "object" && "name" in ebook ? ebook.name : "book-file",
          coverName: typeof cover === "object" && "name" in cover ? cover.name : "cover-file"
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
