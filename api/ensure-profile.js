const { createSupabaseAdminClient } = require("./_shared/payments");

function getBearerToken(req) {
  const header = String(req.headers?.authorization || "");
  if (!header.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}

function normalizeRole(value) {
  return ["author", "publisher", "admin"].includes(value) ? value : "author";
}

function parseBody(req) {
  if (!req?.body) return {};

  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }

  return req.body;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const accessToken = getBearerToken(req);
    const body = parseBody(req);
    if (!accessToken) {
      return res.status(401).json({ error: "Missing access token" });
    }

    const supabase = createSupabaseAdminClient();
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError) {
      throw authError;
    }

    const user = authData?.user;
    if (!user?.id || !user?.email) {
      return res.status(401).json({ error: "Authenticated user not found" });
    }

    const profilePayload = {
      id: user.id,
      full_name: String(body?.name || user.user_metadata?.full_name || user.email.split("@")[0] || "").trim(),
      email: String(user.email).trim().toLowerCase(),
      role: normalizeRole(String(body?.role || user.user_metadata?.role || "author").trim().toLowerCase())
    };

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" })
      .select("id, full_name, email, role, created_at")
      .single();

    if (profileError) {
      throw profileError;
    }

    return res.status(200).json({
      success: true,
      profile
    });
  } catch (error) {
    console.error("ENSURE PROFILE ERROR:", error);
    return res.status(500).json({
      error: error.message || "Profile restore failed"
    });
  }
};
