(function () {
  let client = null;
  const TEMP_SALES_KEY = "lurji-taro-temp-sales";

  function getConfig() {
    return window.APP_CONFIG || {};
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function withTimeout(promise, timeoutMs = 6000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => {
        window.setTimeout(() => {
          reject(new Error("Supabase request timed out"));
        }, timeoutMs);
      })
    ]);
  }

  function isConfigured() {
    const config = getConfig();
    return Boolean(window.supabase && config.SUPABASE_URL && config.SUPABASE_ANON_KEY);
  }

  function isEnabled() {
    return isConfigured();
  }

  function getClient() {
    if (!isConfigured()) {
      return null;
    }

    if (!client) {
      const config = getConfig();
      client = window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
    }

    return client;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getForcedBookPrice() {
    const rawValue = Number(getConfig().FORCED_BOOK_PRICE);
    return Number.isFinite(rawValue) && rawValue > 0 ? rawValue : null;
  }

  function resolveBookPrice(value) {
    const forcedPrice = getForcedBookPrice();
    if (forcedPrice !== null) {
      return forcedPrice;
    }

    const amount = Number(value || 0);
    return Number.isFinite(amount) ? amount : 0;
  }

  function applyBookPrice(book) {
    if (!book) return book;

    return {
      ...book,
      price: resolveBookPrice(book.price)
    };
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\u10a0-\u10ff]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file";
  }

  function createStoragePath(userId, file, prefix) {
    const fileName = file?.name || `${prefix}.bin`;
    const dotIndex = fileName.lastIndexOf(".");
    const ext = dotIndex >= 0 ? fileName.slice(dotIndex) : "";
    const base = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
    return `${userId}/${Date.now()}-${prefix}-${slugify(base)}${ext}`;
  }

  function cacheUser(profile) {
    if (!profile) {
      localStorage.removeItem("user");
      return;
    }

    localStorage.setItem("user", JSON.stringify(profile));
  }

  function cacheToken(session) {
    const token = session?.access_token || "";
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }

  function clearCachedSession() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }

  function readCachedUser() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch (error) {
      return null;
    }
  }

  function hasRecoveryParams() {
    const locationState = `${window.location.search || ""}${window.location.hash || ""}`;
    return /type=recovery|access_token=|refresh_token=|token_hash=|code=/.test(locationState);
  }

  function buildResetRedirectUrl() {
    const configuredUrl = String(getConfig().PASSWORD_RESET_REDIRECT_URL || "").trim();
    if (configuredUrl) {
      return configuredUrl;
    }

    try {
      return new URL("reset-password.html", window.location.href).toString();
    } catch (error) {
      return "reset-password.html";
    }
  }

  function normalizeProfileRow(row, fallbackUser) {
    return {
      id: row?.id || fallbackUser?.id || null,
      name: row?.full_name || fallbackUser?.user_metadata?.full_name || fallbackUser?.email || "",
      email: row?.email || fallbackUser?.email || "",
      role: row?.role || fallbackUser?.user_metadata?.role || "author",
      createdAt: row?.created_at || fallbackUser?.created_at || new Date().toISOString()
    };
  }

  function getAccessTokenFromSession(session) {
    return session?.access_token || localStorage.getItem("token") || "";
  }

  async function ensureProfileRecord(user, session) {
    const accessToken = getAccessTokenFromSession(session);
    if (!user?.id || !accessToken) {
      return null;
    }

    const response = await fetch("/api/ensure-profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        name: user?.name || user?.user_metadata?.full_name || "",
        role: user?.role || user?.user_metadata?.role || "author"
      })
    });

    if (!response.ok) {
      let errorMessage = "პროფილის აღდგენა ვერ შესრულდა";

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (error) {
        errorMessage = response.statusText || errorMessage;
      }

      throw new Error(errorMessage);
    }

    const result = await response.json().catch(() => ({}));
    return normalizeProfileRow(result?.profile, user);
  }

  function escapeXml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function wrapTitleLines(title, maxLength) {
    const words = String(title || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";

    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length <= maxLength) {
        current = candidate;
      } else {
        if (current) {
          lines.push(current);
        }
        current = word;
      }
    });

    if (current) {
      lines.push(current);
    }

    return lines.slice(0, 3);
  }

  function createTempCoverUrl(options) {
    const lines = wrapTitleLines(options.title, 15);
    const lineMarkup = lines
      .map((line, index) => {
        const y = 360 + (index * 66);
        return `<text x="90" y="${y}" fill="#ffffff" font-family="Georgia, serif" font-size="56" font-weight="700">${escapeXml(line)}</text>`;
      })
      .join("");

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${options.colors[0]}"/>
            <stop offset="55%" stop-color="${options.colors[1]}"/>
            <stop offset="100%" stop-color="${options.colors[2]}"/>
          </linearGradient>
          <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
            <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
          </linearGradient>
        </defs>
        <rect width="1000" height="1500" rx="48" fill="url(#bg)"/>
        <circle cx="820" cy="220" r="170" fill="rgba(255,255,255,0.12)"/>
        <path d="M 0 1160 C 180 1050, 350 1100, 540 1010 C 710 930, 830 760, 1000 700 L 1000 1500 L 0 1500 Z" fill="rgba(255,255,255,0.10)"/>
        <rect x="64" y="64" width="872" height="1372" rx="36" fill="none" stroke="rgba(255,255,255,0.24)" stroke-width="2"/>
        <text x="90" y="120" fill="rgba(255,255,255,0.92)" font-family="Arial, sans-serif" font-size="34" font-weight="700">${escapeXml(options.typeLabel)}</text>
        <text x="90" y="190" fill="rgba(255,255,255,0.78)" font-family="Arial, sans-serif" font-size="28">${escapeXml(options.genre)}</text>
        ${lineMarkup}
        <text x="90" y="1315" fill="rgba(255,255,255,0.92)" font-family="Arial, sans-serif" font-size="36" font-weight="700">${escapeXml(options.author)}</text>
        <text x="90" y="1375" fill="rgba(255,255,255,0.78)" font-family="Arial, sans-serif" font-size="24">1000 × 1500 დროებითი ყდა</text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  const TEMP_BOOKS = [
    {
      id: "temp-b1",
      title: "ღრმა ფოკუსი",
      author: "ნინო კობახიძე",
      genre: "ბიზნესი",
      type: "ebook",
      details: "PDF / EPUB",
      price: 18.9,
      description: "პრაქტიკული წიგნი კონცენტრაციის, დროის მართვის და ღრმა მუშაობის ჩვევებზე.",
      topPick: true,
      ageRestricted: false,
      uploaderId: "temp-author-1",
      fileName: "ghrma-fokusi.pdf",
      coverName: "ghrma-fokusi.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "ღრმა ფოკუსი",
        author: "ნინო კობახიძე",
        genre: "ბიზნესი",
        typeLabel: "ელექტრონული წიგნი",
        colors: ["#0f4c81", "#2e7cc4", "#b8d9ff"]
      }),
      createdAt: "2026-03-18T09:00:00.000Z",
      updatedAt: "2026-03-18T09:00:00.000Z"
    },
    {
      id: "temp-b2",
      title: "ფინანსური სიმშვიდე",
      author: "თამარ ბურდული",
      genre: "ბიზნესი",
      type: "ebook",
      details: "PDF / EPUB",
      price: 22,
      description: "მარტივად ახსნილი პირადი ფინანსები, დაგეგმვა და ფულის მართვის ყოველდღიური წესები.",
      topPick: false,
      ageRestricted: false,
      uploaderId: "temp-author-2",
      fileName: "finansuri-simshvide.pdf",
      coverName: "finansuri-simshvide.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "ფინანსური სიმშვიდე",
        author: "თამარ ბურდული",
        genre: "ბიზნესი",
        typeLabel: "ელექტრონული წიგნი",
        colors: ["#14466b", "#4e9dcf", "#d7f0ff"]
      }),
      createdAt: "2026-03-19T10:30:00.000Z",
      updatedAt: "2026-03-19T10:30:00.000Z"
    },
    {
      id: "temp-b3",
      title: "მშვიდი გონების პრაქტიკა",
      author: "მარიამ ჯაფარიძე",
      genre: "ფსიქოლოგია",
      type: "ebook",
      details: "PDF / EPUB / MOBI",
      price: 21.5,
      description: "სტრესის შემცირების, ემოციური ბალანსის და შინაგანი სიმშვიდის პრაქტიკული სახელმძღვანელო.",
      topPick: true,
      ageRestricted: false,
      uploaderId: "temp-author-3",
      fileName: "mshvidi-gonebis-praqtika.epub",
      coverName: "mshvidi-gonebis-praqtika.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "მშვიდი გონების პრაქტიკა",
        author: "მარიამ ჯაფარიძე",
        genre: "ფსიქოლოგია",
        typeLabel: "ელექტრონული წიგნი",
        colors: ["#2c5f7f", "#75b7d3", "#e2f7ff"]
      }),
      createdAt: "2026-03-21T08:45:00.000Z",
      updatedAt: "2026-03-21T08:45:00.000Z"
    },
    {
      id: "temp-b4",
      title: "ქალაქი წვიმის შემდეგ",
      author: "ლიკა ბერიძე",
      genre: "რომანი",
      type: "ebook",
      details: "PDF / EPUB",
      price: 16.4,
      description: "თანამედროვე რომანი სიყვარულზე, დაკარგვაზე და ქალაქის სიჩუმეში საკუთარ თავთან შეხვედრაზე.",
      topPick: false,
      ageRestricted: false,
      uploaderId: "temp-author-4",
      fileName: "qalaqi-wvimi-shemdeg.pdf",
      coverName: "qalaqi-wvimi-shemdeg.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "ქალაქი წვიმის შემდეგ",
        author: "ლიკა ბერიძე",
        genre: "რომანი",
        typeLabel: "ელექტრონული წიგნი",
        colors: ["#3e4f88", "#7d9ee0", "#eef4ff"]
      }),
      createdAt: "2026-03-24T12:20:00.000Z",
      updatedAt: "2026-03-24T12:20:00.000Z"
    },
    {
      id: "temp-b5",
      title: "გზაში მოსასმენი მოტივაცია",
      author: "პოდკასტ სტუდიო",
      genre: "მოტივაცია",
      type: "audio",
      details: "4სთ 20წთ",
      price: 17,
      description: "მოკლე აუდიო თავები ყოველდღიური ენერგიის, მოტივაციის და პროდუქტიულობისთვის.",
      topPick: true,
      ageRestricted: false,
      uploaderId: "temp-author-5",
      fileName: "gzashi-motivacia.mp3",
      coverName: "gzashi-motivacia.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "გზაში მოსასმენი მოტივაცია",
        author: "პოდკასტ სტუდიო",
        genre: "მოტივაცია",
        typeLabel: "აუდიო წიგნი",
        colors: ["#0b6b7c", "#2cb0c5", "#dbfdff"]
      }),
      createdAt: "2026-03-22T07:40:00.000Z",
      updatedAt: "2026-03-22T07:40:00.000Z"
    },
    {
      id: "temp-b6",
      title: "დილის აუდიო რუტინა",
      author: "გიორგი თაბაგარი",
      genre: "მოტივაცია",
      type: "audio",
      details: "2სთ 45წთ",
      price: 13.9,
      description: "მოსასმენი აუდიო პროგრამა დილის ჩვევების, ფოკუსის და სიმშვიდისთვის.",
      topPick: false,
      ageRestricted: false,
      uploaderId: "temp-author-6",
      fileName: "dilis-audio-rutina.mp3",
      coverName: "dilis-audio-rutina.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "დილის აუდიო რუტინა",
        author: "გიორგი თაბაგარი",
        genre: "მოტივაცია",
        typeLabel: "აუდიო წიგნი",
        colors: ["#1b6a67", "#50c8b8", "#ebfffb"]
      }),
      createdAt: "2026-03-23T06:10:00.000Z",
      updatedAt: "2026-03-23T06:10:00.000Z"
    },
    {
      id: "temp-b7",
      title: "ფსიქოლოგია ხმაში",
      author: "მარიამ ჯაფარიძე",
      genre: "ფსიქოლოგია",
      type: "audio",
      details: "3სთ 30წთ",
      price: 18.5,
      description: "ფსიქოლოგიური აუდიოწიგნი თვითშეფასებაზე, საზღვრებზე და ემოციურ გამძლეობაზე.",
      topPick: false,
      ageRestricted: false,
      uploaderId: "temp-author-3",
      fileName: "fsiqologia-khmashi.mp3",
      coverName: "fsiqologia-khmashi.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "ფსიქოლოგია ხმაში",
        author: "მარიამ ჯაფარიძე",
        genre: "ფსიქოლოგია",
        typeLabel: "აუდიო წიგნი",
        colors: ["#24606d", "#62b1be", "#ecffff"]
      }),
      createdAt: "2026-03-25T18:20:00.000Z",
      updatedAt: "2026-03-25T18:20:00.000Z"
    },
    {
      id: "temp-b8",
      title: "შუაღამის წერილები",
      author: "ანა დვალიშვილი",
      genre: "რომანი",
      type: "ebook",
      details: "PDF / EPUB",
      price: 17.8,
      description: "ემოციური ისტორია დაკარგულ ურთიერთობებზე და ახალ დასაწყისებზე.",
      topPick: true,
      ageRestricted: false,
      uploaderId: "temp-author-7",
      fileName: "shuaghmis-werilebi.pdf",
      coverName: "shuaghmis-werilebi.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "შუაღამის წერილები",
        author: "ანა დვალიშვილი",
        genre: "რომანი",
        typeLabel: "ელექტრონული წიგნი",
        colors: ["#243b73", "#5f83d8", "#eff3ff"]
      }),
      createdAt: "2026-03-26T10:10:00.000Z",
      updatedAt: "2026-03-26T10:10:00.000Z"
    },
    {
      id: "temp-b9",
      title: "კონფიდენციალური რომანი 18+",
      author: "დ. ქავთარაძე",
      genre: "რომანი",
      type: "ebook",
      details: "PDF / EPUB",
      price: 23.9,
      description: "ზრდასრულ აუდიტორიაზე გათვლილი მხატვრული ტექსტი ურთიერთობების, დაძაბულობის და ინტიმური თემებით.",
      topPick: false,
      ageRestricted: true,
      uploaderId: "temp-author-8",
      fileName: "konfidencialuri-romani.pdf",
      coverName: "konfidencialuri-romani.svg",
      coverPath: "",
      filePath: "",
      coverUrl: createTempCoverUrl({
        title: "კონფიდენციალური რომანი 18+",
        author: "დ. ქავთარაძე",
        genre: "რომანი",
        typeLabel: "ელექტრონული წიგნი",
        colors: ["#5a2d68", "#a064b8", "#f5e8ff"]
      }),
      createdAt: "2026-03-27T11:05:00.000Z",
      updatedAt: "2026-03-27T11:05:00.000Z"
    }
  ];

  const TEMP_SALES_BASE = [
    {
      id: "temp-s1",
      bookId: "temp-b1",
      book: "ღრმა ფოკუსი",
      buyer: "reader1@example.com",
      amount: 18.9,
      createdAt: "2026-03-22T11:10:00.000Z"
    },
    {
      id: "temp-s2",
      bookId: "temp-b5",
      book: "გზაში მოსასმენი მოტივაცია",
      buyer: "reader2@example.com",
      amount: 17,
      createdAt: "2026-03-24T15:30:00.000Z"
    },
    {
      id: "temp-s3",
      bookId: "temp-b8",
      book: "შუაღამის წერილები",
      buyer: "reader3@example.com",
      amount: 17.8,
      createdAt: "2026-03-26T19:20:00.000Z"
    }
  ];

  function getTempBooks() {
    return [];
  }

  function getTempBook(id) {
    return null;
  }

  function readTempSales() {
    return [];
  }

  function writeTempSales(sales) {
    localStorage.removeItem(TEMP_SALES_KEY);
  }

  function createTempSale(payload, book) {
    throw new Error("დროებითი კატალოგი გამორთულია. გამოიყენე მხოლოდ Supabase-ში დამატებული რეალური პროდუქტები.");
  }

  function getPublicCoverUrl(path) {
    if (!path) return "";

    const supabase = getClient();
    const bucket = getConfig().SUPABASE_COVERS_BUCKET;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || "";
  }

  function mapBookRow(row) {
    const externalCoverUrl = String(row.coverUrl || row.cover_url || "").trim();
    return applyBookPrice({
      id: row.id,
      title: row.title,
      author: row.author,
      genre: row.genre,
      type: row.type,
      details: row.details,
      price: Number(row.price || 0),
      description: row.description,
      topPick: Boolean(row.top_pick),
      ageRestricted: Boolean(row.age_restricted),
      uploaderId: row.uploader_id,
      fileName: row.file_path ? row.file_path.split("/").pop() : "",
      coverName: row.cover_path ? row.cover_path.split("/").pop() : "",
      coverPath: row.cover_path || "",
      coverUrl: externalCoverUrl || getPublicCoverUrl(row.cover_path),
      filePath: row.file_path || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  }

  function mapSaleRow(row) {
    return {
      id: row.id,
      bookId: row.book_id,
      book: row.book_title,
      buyer: row.buyer_email,
      amount: Number(row.amount || 0),
      createdAt: row.created_at
    };
  }

  function mapProfileRow(row) {
    return {
      id: row.id,
      name: row.full_name,
      email: row.email,
      role: row.role,
      createdAt: row.created_at
    };
  }

  async function getCurrentAuthUser() {
    const supabase = getClient();
    if (!supabase) return null;

    const session = await getCurrentSession();
    if (session?.user) {
      return session.user;
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
      throw error;
    }

    return data.user || null;
  }

  async function getCurrentSession() {
    const supabase = getClient();
    if (!supabase) return null;

    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }

    return data.session || null;
  }

  async function getCurrentProfile() {
    const supabase = getClient();
    if (!supabase) return null;

    const user = await getCurrentAuthUser();
    if (!user) {
      const cachedUser = readCachedUser();
      if (cachedUser) {
        return cachedUser;
      }

      clearCachedSession();
      return null;
    }

    const session = await getCurrentSession();
    cacheToken(session);

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      const fallbackProfile = normalizeProfileRow(null, user);
      cacheUser(fallbackProfile);

      ensureProfileRecord(user, session)
        .then((ensuredProfile) => {
          if (ensuredProfile) {
            cacheUser(ensuredProfile);
          }
        })
        .catch(() => null);

      return fallbackProfile;
    }

    const profile = normalizeProfileRow(data, user);
    cacheUser(profile);
    return profile;
  }

  async function signIn(payload) {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password
    });

    if (error) {
      throw error;
    }

    cacheToken(data.session);

    const fallbackProfile = normalizeProfileRow(null, data.user);
    cacheUser(fallbackProfile);
    syncSessionUser().catch(() => null);

    return {
      token: data.session?.access_token || "",
      user: fallbackProfile
    };
  }

  async function signUp(payload) {
    const supabase = getClient();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.name,
          role: payload.role
        }
      }
    });

    if (error) {
      throw error;
    }

    cacheToken(data.session);

    if (!data.session) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: "რეგისტრაცია დასრულდა. გადაამოწმე ელფოსტა და დაადასტურე ანგარიში."
      };
    }

    try {
      const profile = await getCurrentProfile();
      return {
        success: true,
        message: "რეგისტრაცია დასრულდა, შეგიძლია ატვირთვა დაიწყო",
        token: data.session?.access_token || "",
        user: profile
      };
    } catch (profileError) {
      const fallbackProfile = normalizeProfileRow(null, data.user);
      cacheUser(fallbackProfile);
      return {
        success: true,
        message: "რეგისტრაცია დასრულდა, შეგიძლია ატვირთვა დაიწყო",
        token: data.session?.access_token || "",
        user: fallbackProfile
      };
    }
  }

  async function requestPasswordReset(payload) {
    const supabase = getClient();
    const email = String(payload?.email || "").trim();

    if (!email) {
      throw new Error("გთხოვ შეიყვანო ელფოსტა");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildResetRedirectUrl()
    });

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "თუ ეს ელფოსტა არსებობს, პაროლის აღდგენის ბმული გამოგზავნილია."
    };
  }

  async function waitForPasswordSession(timeoutMs = 2800) {
    const supabase = getClient();
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        throw error;
      }

      if (data.session) {
        return data.session;
      }

      if (!hasRecoveryParams()) {
        break;
      }

      await sleep(160);
    }

    return null;
  }

  async function updatePassword(payload) {
    const supabase = getClient();
    const nextPassword = String(payload?.password || "");

    if (!nextPassword) {
      throw new Error("გთხოვ შეიყვანო ახალი პაროლი");
    }

    const session = await waitForPasswordSession();
    if (!session) {
      throw new Error("ახალი პაროლის დასაყენებლად ამ გვერდზე ელფოსტიდან მიღებული ბმულით უნდა შემოხვიდე");
    }

    const { data, error } = await supabase.auth.updateUser({
      password: nextPassword
    });

    if (error) {
      throw error;
    }

    cacheToken(await getCurrentSession());

    try {
      await syncSessionUser();
    } catch (profileError) {
      cacheUser(normalizeProfileRow(null, data.user));
    }

    return {
      success: true,
      message: "პაროლი წარმატებით განახლდა"
    };
  }

  async function getBooks() {
    const supabase = getClient();

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("books")
          .select("*")
          .order("created_at", { ascending: false })
      );

      if (error) {
        throw error;
      }

      const books = (data || []).map(mapBookRow);
      return books;
    } catch (error) {
      return [];
    }
  }

  async function getBook(id) {
    const supabase = getClient();

    try {
      const { data, error } = await withTimeout(
        supabase
          .from("books")
          .select("*")
          .eq("id", id)
          .maybeSingle()
      );

      if (error) {
        throw error;
      }

      return data ? mapBookRow(data) : null;
    } catch (error) {
      return null;
    }
  }

  async function getMyBooks() {
    const supabase = getClient();
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new Error("პანელის გამოსაყენებლად ჯერ შედი ავტორის ანგარიშით");
    }

    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("uploader_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(mapBookRow);
  }

  async function uploadFile(bucket, userId, file, prefix) {
    const supabase = getClient();
    const path = createStoragePath(userId, file, prefix);
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      upsert: false
    });

    if (error) {
      throw new Error(error.message || "ფაილის ატვირთვა ვერ შესრულდა");
    }

    return path;
  }

  async function uploadBook(payload) {
    const supabase = getClient();
    const profile = await getCurrentProfile();

    if (!profile || !["author", "publisher", "admin"].includes(profile.role)) {
      throw new Error("ატვირთვისთვის საჭიროა ავტორის ან გამომცემლის ანგარიში");
    }

    const session = await getCurrentSession();
    let activeProfile = profile;

    try {
      const ensuredProfile = await ensureProfileRecord(profile, session);
      if (ensuredProfile?.id) {
        activeProfile = ensuredProfile;
      }
    } catch (error) {
      activeProfile = profile;
    }

    const config = getConfig();
    const filePath = await uploadFile(config.SUPABASE_BOOKS_BUCKET, activeProfile.id, payload.ebook, "book");
    const coverPath = await uploadFile(config.SUPABASE_COVERS_BUCKET, activeProfile.id, payload.cover, "cover");

    const insertPayload = {
      uploader_id: activeProfile.id,
      title: payload.title,
      author: payload.author,
      genre: payload.genre,
      type: payload.type,
      details: payload.details,
      price: Number(payload.price || 0),
      description: payload.description,
      top_pick: Boolean(payload.topPick),
      age_restricted: Boolean(payload.ageRestricted),
      file_path: filePath,
      cover_path: coverPath
    };

    let data;
    let error;
    ({ data, error } = await supabase
      .from("books")
      .insert(insertPayload)
      .select("*")
      .single());

    if (error && /profiles|foreign key/i.test(String(error.message || ""))) {
      const restoredProfile = await ensureProfileRecord(activeProfile, session);
      if (restoredProfile?.id) {
        insertPayload.uploader_id = restoredProfile.id;
        ({ data, error } = await supabase
          .from("books")
          .insert(insertPayload)
          .select("*")
          .single());
      }
    }

    if (error) {
      if (/profiles|foreign key/i.test(String(error.message || ""))) {
        throw new Error("ავტორის პროფილი ბოლომდე არ იყო გამზადებული. გთხოვ თავიდან შეხვიდე ანგარიშში და მერე ისევ სცადო ატვირთვა.");
      }

      throw error;
    }

    return {
      success: true,
      message: "გამოცემა წარმატებით დაემატა კატალოგს",
      book: mapBookRow(data)
    };
  }

  async function updateBook(id, payload) {
    const supabase = getClient();
    const profile = await getCurrentProfile();

    if (!profile) {
      throw new Error("რედაქტირებისთვის ჯერ შედი ანგარიშში");
    }

    const existing = await getBook(id);
    if (!existing) {
      throw new Error("რედაქტირებისთვის წიგნი ვერ მოიძებნა");
    }

    if (String(existing.id).startsWith("temp-")) {
      throw new Error("დროებითი სატესტო წიგნის რედაქტირება ვერ მოხერხდება. ჯერ ატვირთე რეალური წიგნი.");
    }

    if (!(profile.role === "admin" || profile.id === existing.uploaderId)) {
      throw new Error("ამ წიგნის რედაქტირების უფლება არ გაქვს");
    }

    const config = getConfig();
    let filePath = existing.filePath || "";
    let coverPath = existing.coverPath || "";

    if (payload.ebook) {
      filePath = await uploadFile(config.SUPABASE_BOOKS_BUCKET, profile.id, payload.ebook, "book");
    }

    if (payload.cover) {
      coverPath = await uploadFile(config.SUPABASE_COVERS_BUCKET, profile.id, payload.cover, "cover");
    }

    const { data, error } = await supabase
      .from("books")
      .update({
        title: payload.title,
        author: payload.author,
        genre: payload.genre,
        type: payload.type,
        details: payload.details,
        price: Number(payload.price || 0),
        description: payload.description,
        top_pick: Boolean(payload.topPick),
        age_restricted: Boolean(payload.ageRestricted),
        file_path: filePath,
        cover_path: coverPath
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    return {
      success: true,
      message: "წიგნის მონაცემები განახლდა",
      book: mapBookRow(data)
    };
  }

  async function getAdminStats() {
    const supabase = getClient();
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new Error("პანელის სანახავად ჯერ შედი ავტორის ანგარიშით");
    }

    try {
      const [booksResult, usersResult, salesResult] = await Promise.all([
        supabase.from("books").select("id", { count: "exact", head: true }),
        profile.role === "admin"
          ? supabase.from("profiles").select("id", { count: "exact", head: true })
          : supabase.from("profiles").select("id", { count: "exact", head: true }).eq("id", profile.id),
        supabase.from("sales").select("id", { count: "exact", head: true })
      ]);

      if (booksResult.error) throw booksResult.error;
      if (usersResult.error) throw usersResult.error;
      if (salesResult.error) throw salesResult.error;

      return {
        books: booksResult.count || 0,
        users: usersResult.count || 1,
        sales: salesResult.count || 0
      };
    } catch (error) {
      return {
        books: 0,
        users: 1,
        sales: 0
      };
    }
  }

  async function getUsers() {
    const supabase = getClient();
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new Error("პანელის სანახავად ჯერ შედი ავტორის ანგარიშით");
    }

    if (profile.role !== "admin") {
      return [profile];
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []).map(mapProfileRow);
    } catch (error) {
      return [profile];
    }
  }

  async function getSales() {
    const supabase = getClient();
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new Error("პანელის სანახავად ჯერ შედი ავტორის ანგარიშით");
    }

    try {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      const sales = (data || []).map(mapSaleRow);
      return sales;
    } catch (error) {
      return [];
    }
  }

  async function createPaymentIntent(payload) {
    const supabase = getClient();
    const book = await getBook(payload.bookId);

    if (!book) {
      throw new Error("არჩეული წიგნი ვერ მოიძებნა");
    }

    if (String(book.id).startsWith("temp-")) {
      createTempSale(payload, book);
      return {
        success: true,
        clientSecret: "temp-sale-recorded",
        message: "დროებითი სატესტო შეძენა შესრულდა"
      };
    }

    try {
      const { error } = await supabase
        .from("sales")
        .insert({
          book_id: book.id,
          book_title: book.title,
          buyer_name: payload.buyerName || "მყიდველი",
          buyer_email: payload.buyerEmail || "guest@example.com",
          buyer_phone: payload.buyerPhone || "",
          payment_method: payload.paymentMethod || "card",
          amount: Number(payload.amount || book.price || 0)
        });

      if (error) {
        throw error;
      }

      return {
        success: true,
        clientSecret: "supabase-sale-recorded",
        message: "შეძენა დადასტურდა და ჩანაწერი შეინახა Supabase-ში"
      };
    } catch (error) {
      createTempSale(payload, book);
      return {
        success: true,
        clientSecret: "temp-sale-recorded",
        message: "შეძენა დროებით სატესტო რეჟიმში შეინახა"
      };
    }
  }

  async function syncSessionUser() {
    if (!isEnabled()) return null;

    try {
      return await getCurrentProfile();
    } catch (error) {
      return null;
    }
  }

  if (isConfigured()) {
    const supabase = getClient();
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (!session?.user) {
        if (event === "SIGNED_OUT" || event === "USER_DELETED") {
          clearCachedSession();
          return;
        }

        const cachedUser = readCachedUser();
        if (cachedUser) {
          return;
        }

        try {
          const latestSession = await getCurrentSession();
          if (latestSession?.user) {
            cacheToken(latestSession);
            await syncSessionUser();
            return;
          }
        } catch (error) {
          // Ignore transient auth restore issues.
        }

        return;
      }

      cacheToken(session);
      await syncSessionUser();
    });
  }

  window.SupabaseService = {
    isConfigured,
    isEnabled,
    getClient,
    syncSessionUser,
    clearCachedSession,
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    getBooks,
    getBook,
    getMyBooks,
    uploadBook,
    updateBook,
    getAdminStats,
    getUsers,
    getSales,
    createPaymentIntent
  };
})();
