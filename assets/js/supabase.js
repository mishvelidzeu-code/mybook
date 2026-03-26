(function () {
  let client = null;

  function getConfig() {
    return window.APP_CONFIG || {};
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

  function normalizeProfileRow(row, fallbackUser) {
    return {
      id: row?.id || fallbackUser?.id || null,
      name: row?.full_name || fallbackUser?.user_metadata?.full_name || fallbackUser?.email || "",
      email: row?.email || fallbackUser?.email || "",
      role: row?.role || fallbackUser?.user_metadata?.role || "author",
      createdAt: row?.created_at || fallbackUser?.created_at || new Date().toISOString()
    };
  }

  function getPublicCoverUrl(path) {
    if (!path) return "";

    const supabase = getClient();
    const bucket = getConfig().SUPABASE_COVERS_BUCKET;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data?.publicUrl || "";
  }

  function mapBookRow(row) {
    return {
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
      coverUrl: getPublicCoverUrl(row.cover_path),
      filePath: row.file_path || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
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
    const profile = await getCurrentProfile();

    return {
      token: data.session?.access_token || "",
      user: profile
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

    const profile = await getCurrentProfile();

    return {
      success: true,
      message: "რეგისტრაცია დასრულდა, შეგიძლია ატვირთვა დაიწყო",
      token: data.session?.access_token || "",
      user: profile
    };
  }

  async function getBooks() {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(mapBookRow);
  }

  async function getBook(id) {
    const supabase = getClient();
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data ? mapBookRow(data) : null;
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
      throw error;
    }

    return path;
  }

  async function uploadBook(payload) {
    const supabase = getClient();
    const profile = await getCurrentProfile();

    if (!profile || !["author", "publisher", "admin"].includes(profile.role)) {
      throw new Error("ატვირთვისთვის საჭიროა ავტორის ან გამომცემლის ანგარიში");
    }

    const config = getConfig();
    const filePath = await uploadFile(config.SUPABASE_BOOKS_BUCKET, profile.id, payload.ebook, "book");
    const coverPath = await uploadFile(config.SUPABASE_COVERS_BUCKET, profile.id, payload.cover, "cover");

    const { data, error } = await supabase
      .from("books")
      .insert({
        uploader_id: profile.id,
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
      .select("*")
      .single();

    if (error) {
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
      users: usersResult.count || 0,
      sales: salesResult.count || 0
    };
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

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(mapProfileRow);
  }

  async function getSales() {
    const supabase = getClient();
    const profile = await getCurrentProfile();
    if (!profile) {
      throw new Error("პანელის სანახავად ჯერ შედი ავტორის ანგარიშით");
    }

    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return (data || []).map(mapSaleRow);
  }

  async function createPaymentIntent(payload) {
    const supabase = getClient();
    const book = await getBook(payload.bookId);

    if (!book) {
      throw new Error("არჩეული წიგნი ვერ მოიძებნა");
    }

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
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        clearCachedSession();
        return;
      }

      cacheToken(session);
      await syncSessionUser();
    });

    syncSessionUser();
  }

  window.SupabaseService = {
    isConfigured,
    isEnabled,
    getClient,
    syncSessionUser,
    clearCachedSession,
    signIn,
    signUp,
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
