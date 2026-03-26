const nodemailer = require("nodemailer");
const { createClient } = require("@supabase/supabase-js");

function escapeHtml(value) {
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

function createOrderId(prefix = "BOOK") {
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${Date.now()}-${randomPart}`;
}

function normalizeSiteUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function getSiteUrl() {
  const explicitSiteUrl = normalizeSiteUrl(process.env.SITE_URL || process.env.PUBLIC_SITE_URL);
  if (explicitSiteUrl) {
    return explicitSiteUrl;
  }

  if (process.env.VERCEL_URL) {
    return normalizeSiteUrl(`https://${process.env.VERCEL_URL}`);
  }

  throw new Error("SITE_URL env is required for BOG redirect and callback URLs");
}

function createSupabaseAdminClient() {
  const supabaseServerKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!process.env.SUPABASE_URL || !supabaseServerKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SECRET_KEY is missing");
  }

  return createClient(process.env.SUPABASE_URL, supabaseServerKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

async function getBogAccessToken() {
  if (!process.env.BOG_CLIENT_ID || !process.env.BOG_CLIENT_SECRET) {
    throw new Error("BOG_CLIENT_ID or BOG_CLIENT_SECRET is missing");
  }

  const response = await fetch(
    "https://oauth2.bog.ge/auth/realms/bog/protocol/openid-connect/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${process.env.BOG_CLIENT_ID}:${process.env.BOG_CLIENT_SECRET}`
        ).toString("base64")}`
      },
      body: "grant_type=client_credentials"
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) {
    throw new Error(data.error_description || data.error || "BOG token request failed");
  }

  return data.access_token;
}

function mapBogStatus(orderStatusKey) {
  const normalizedStatus = String(orderStatusKey || "").trim().toLowerCase();

  if (normalizedStatus === "completed") {
    return "paid";
  }

  if (["rejected", "declined", "failed", "expired", "canceled", "cancelled", "blocked"].includes(normalizedStatus)) {
    return "failed";
  }

  return "pending";
}

function getBogReference(payload) {
  return String(
    payload?.body?.order_id
    || payload?.body?.id
    || payload?.body?.payment_id
    || payload?.body?.transaction_id
    || ""
  );
}

function createMailerTransport() {
  if (process.env.SMTP_HOST && process.env.SMTP_PORT && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || "").toLowerCase() === "true" || Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  if (process.env.GMAIL_USER && process.env.GMAIL_PASS) {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });
  }

  return null;
}

function getMailerFromAddress() {
  return process.env.SMTP_FROM_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER || "";
}

function getAdminNotificationEmail() {
  return process.env.ADMIN_NOTIFICATION_EMAIL || process.env.GMAIL_USER || process.env.SMTP_USER || "";
}

async function createSignedBookUrl(supabase, filePath) {
  if (!filePath) {
    return "";
  }

  const bucket = process.env.SUPABASE_BOOKS_BUCKET || "books";
  const expiresInSeconds = Number(process.env.BOOK_DOWNLOAD_EXPIRES_SECONDS || 172800);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data?.signedUrl || "";
}

module.exports = {
  escapeHtml,
  parseBody,
  createOrderId,
  normalizeSiteUrl,
  getSiteUrl,
  createSupabaseAdminClient,
  getBogAccessToken,
  mapBogStatus,
  getBogReference,
  createMailerTransport,
  getMailerFromAddress,
  getAdminNotificationEmail,
  createSignedBookUrl
};
