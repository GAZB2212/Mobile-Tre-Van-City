import { pool } from "./db.js";

const SAGE_CLIENT_ID = process.env.SAGE_CLIENT_ID ?? "";
const SAGE_CLIENT_SECRET = process.env.SAGE_CLIENT_SECRET ?? "";
const SAGE_AUTH_BASE = "https://www.sageone.com/oauth2/auth/central";
const SAGE_TOKEN_URL = "https://oauth.accounting.sage.com/token";
const SAGE_API_BASE = "https://api.accounting.sage.com/v3.1";

function getRedirectUri(): string {
  const domains = process.env.REPLIT_DOMAINS;
  if (domains) {
    const primary = domains.split(",")[0].trim();
    return `https://${primary}/api/sage/callback`;
  }
  return `http://localhost:${process.env.PORT ?? 5000}/api/sage/callback`;
}

export function getSageAuthUrl(): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: SAGE_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    scope: "full_access",
  });
  return `${SAGE_AUTH_BASE}?filter=apiv3.1&${params.toString()}`;
}

async function getSetting(key: string): Promise<string | null> {
  const result = await pool.query(
    "SELECT value FROM site_settings WHERE key = $1",
    [key]
  );
  return result.rows[0]?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await pool.query(
    `INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, value]
  );
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(),
    client_id: SAGE_CLIENT_ID,
    client_secret: SAGE_CLIENT_SECRET,
  });
  const res = await fetch(SAGE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sage token exchange failed (${res.status}): ${text}`);
  }
  const data: any = await res.json();
  await setSetting("sage_access_token", data.access_token);
  await setSetting("sage_refresh_token", data.refresh_token);
  const expiresAt = Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000;
  await setSetting("sage_token_expires_at", String(expiresAt));
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await getSetting("sage_refresh_token");
  if (!refreshToken) throw new Error("Sage not connected — no refresh token stored.");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: SAGE_CLIENT_ID,
    client_secret: SAGE_CLIENT_SECRET,
  });
  const res = await fetch(SAGE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sage token refresh failed (${res.status}): ${text}`);
  }
  const data: any = await res.json();
  await setSetting("sage_access_token", data.access_token);
  await setSetting("sage_refresh_token", data.refresh_token);
  const expiresAt = Date.now() + (parseInt(data.expires_in, 10) - 60) * 1000;
  await setSetting("sage_token_expires_at", String(expiresAt));
  return data.access_token;
}

export async function getValidAccessToken(): Promise<string> {
  const expiresAtStr = await getSetting("sage_token_expires_at");
  const accessToken = await getSetting("sage_access_token");
  if (!accessToken) throw new Error("Sage is not connected. Please connect via Settings.");
  const expiresAt = expiresAtStr ? parseInt(expiresAtStr, 10) : 0;
  if (Date.now() >= expiresAt) {
    return refreshAccessToken();
  }
  return accessToken;
}

export async function isSageConnected(): Promise<boolean> {
  const token = await getSetting("sage_access_token");
  return !!token && token.length > 0;
}

export async function disconnectSage(): Promise<void> {
  await setSetting("sage_access_token", "");
  await setSetting("sage_refresh_token", "");
  await setSetting("sage_token_expires_at", "");
}

async function sageRequest<T = any>(
  token: string,
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${SAGE_API_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sage API ${method} ${path} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

async function findOrCreateContact(
  token: string,
  name: string,
  email: string,
  phone?: string | null
): Promise<string> {
  const search = await sageRequest<any>(
    token,
    "GET",
    `/contacts?email=${encodeURIComponent(email)}&items_per_page=1`
  );
  if (search?.$items?.length > 0) {
    return search.$items[0].id;
  }
  const created = await sageRequest<any>(token, "POST", "/contacts", {
    contact: {
      name,
      email,
      telephone: phone ?? undefined,
      contact_type_ids: ["CUSTOMER"],
    },
  });
  return created.id;
}

async function getUkStandardVatRateId(token: string): Promise<string | null> {
  try {
    const res = await sageRequest<any>(token, "GET", "/tax_rates?items_per_page=100");
    const items: any[] = res?.$items ?? [];
    const standard = items.find(
      (r: any) =>
        r.percentage === 20 ||
        r.name?.toLowerCase().includes("standard") ||
        r.id?.toLowerCase().includes("standard")
    );
    return standard?.id ?? null;
  } catch {
    return null;
  }
}

async function getDefaultSalesLedgerAccountId(token: string): Promise<string | null> {
  try {
    const res = await sageRequest<any>(
      token,
      "GET",
      "/ledger_accounts?visible_in=sales&items_per_page=50"
    );
    const items: any[] = res?.$items ?? [];
    const sales = items.find(
      (a: any) =>
        a.nominal_code === "4000" ||
        a.name?.toLowerCase() === "sales" ||
        a.name?.toLowerCase().includes("general sales")
    );
    return sales?.id ?? items[0]?.id ?? null;
  } catch {
    return null;
  }
}

export async function pushQuoteToSage(
  quoteId: string
): Promise<{ invoiceNumber: string; invoiceId: string }> {
  const token = await getValidAccessToken();

  const quoteRes = await pool.query(
    `SELECT q.*,
       v.title AS van_title, v.make AS van_make, v.model AS van_model, v.year AS van_year,
       k.name AS kit_name, k.price AS kit_price
     FROM quotes q
     LEFT JOIN vans v ON v.id = q.van_id
     LEFT JOIN kits k ON k.id = q.kit_id
     WHERE q.id = $1`,
    [quoteId]
  );

  if (!quoteRes.rows.length) throw new Error("Quote not found");
  const q = quoteRes.rows[0];

  const selectedUpgradeIds: string[] = Array.isArray(q.selected_upgrade_ids)
    ? q.selected_upgrade_ids
    : JSON.parse(q.selected_upgrade_ids ?? "[]");

  const selectedUpgrades: Record<string, number> =
    q.selected_upgrades && typeof q.selected_upgrades === "object"
      ? q.selected_upgrades
      : JSON.parse(q.selected_upgrades ?? "{}");

  const customExtras: Array<{ id: string; description: string; pricePence: number }> =
    Array.isArray(q.custom_extras)
      ? q.custom_extras
      : JSON.parse(q.custom_extras ?? "[]");

  let upgradeRows: Array<{ id: string; name: string; price: number }> = [];
  if (selectedUpgradeIds.length > 0) {
    const ur = await pool.query(
      "SELECT id, name, price FROM upgrades WHERE id = ANY($1::text[])",
      [selectedUpgradeIds]
    );
    upgradeRows = ur.rows;
  }

  const [contactId, vatRateId, ledgerAccountId] = await Promise.all([
    findOrCreateContact(token, q.user_name, q.email, q.phone),
    getUkStandardVatRateId(token),
    getDefaultSalesLedgerAccountId(token),
  ]);

  const buildLine = (description: string, unitPricePence: number, qty = 1): any => ({
    description,
    quantity: `${qty}.0`,
    unit_price: (unitPricePence / 100).toFixed(2),
    ...(vatRateId ? { tax_rate_id: vatRateId } : {}),
    ...(ledgerAccountId ? { ledger_account_id: ledgerAccountId } : {}),
  });

  const invoiceLines: any[] = [];

  if (q.kit_name && q.kit_price) {
    invoiceLines.push(buildLine(q.kit_name, q.kit_price));
  }

  for (const upg of upgradeRows) {
    const qty = selectedUpgrades[upg.id] ?? 1;
    invoiceLines.push(buildLine(upg.name, upg.price, qty));
  }

  for (const extra of customExtras) {
    if (extra.pricePence > 0) {
      invoiceLines.push(buildLine(extra.description, extra.pricePence));
    }
  }

  const discountPence = q.est_discount ?? 0;
  if (discountPence > 0) {
    invoiceLines.push(buildLine("Discount", -discountPence));
  }

  if (invoiceLines.length === 0) {
    invoiceLines.push(buildLine("Mobile Tyre Van Conversion", q.est_subtotal ?? 0));
  }

  const today = new Date().toISOString().split("T")[0];
  const reference = `MTVC-${quoteId.slice(0, 8).toUpperCase()}`;

  const vanDesc = q.van_title
    ? `${q.van_year} ${q.van_make} ${q.van_model} – ${q.van_title}`
    : q.custom_van_description ?? null;

  const notes = [
    vanDesc ? `Vehicle: ${vanDesc}` : null,
    q.company ? `Company: ${q.company}` : null,
    q.phone ? `Phone: ${q.phone}` : null,
    q.notes ?? null,
  ]
    .filter(Boolean)
    .join(" | ");

  const invoiceRes = await sageRequest<any>(token, "POST", "/sales_invoices", {
    sales_invoice: {
      contact_id: contactId,
      date: today,
      reference,
      notes,
      invoice_lines: invoiceLines,
    },
  });

  const invoiceId: string = invoiceRes.id;
  const invoiceNumber: string =
    invoiceRes.displayed_as ?? invoiceRes.invoice_number ?? reference;

  await pool.query(
    "UPDATE quotes SET sage_invoice_id = $1, sage_pushed_at = NOW() WHERE id = $2",
    [invoiceId, quoteId]
  );

  return { invoiceNumber, invoiceId };
}
