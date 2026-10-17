import { ensureUserFromClerkApi } from "./workspaces";

const MAX_NAME_LEN = 200;
const MAX_URL_LEN = 500;
const MAX_CATEGORIES = 3;

const CATEGORY_SLUGS = new Set([
  "engineering",
  "collaboration",
  "design",
  "productivity",
  "finance",
  "marketing",
  "infrastructure",
  "security",
]);

export type SellerSaas = {
  id: string;
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string[];
  createdAt: string;
  subscribers: number;
  monthlyRevenueCents: number;
};

export type CreateSellerSaasInput = {
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string[];
};

type SellerSaasDbRow = {
  id: string;
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string;
  createdAt: string;
  subscribers: number;
  monthlyRevenueCents: number;
};

const SELLER_SAAS_SELECT = `
  SELECT
    s.id,
    s.name,
    s.website_url AS websiteUrl,
    s.icon_url AS iconUrl,
    s.categories,
    s.created_at AS createdAt,
    (
      SELECT COUNT(*)
      FROM subscriptions sub
      WHERE sub.saas_id = s.id
        AND sub.status IN ('new', 'old')
    ) AS subscribers,
    (
      SELECT COALESCE(SUM(
        CASE
          WHEN sub.billing_interval = 'yearly'
            THEN CAST(ROUND(COALESCE(sub.cost, 0) / 12.0) AS INTEGER)
          ELSE COALESCE(sub.cost, 0)
        END
      ), 0)
      FROM subscriptions sub
      WHERE sub.saas_id = s.id
        AND sub.status IN ('new', 'old')
    ) AS monthlyRevenueCents
  FROM saas s
`;

function fail(status: number, message: string): never {
  const err = new Error(message);
  (err as Error & { status: number }).status = status;
  throw err;
}

function toIsoUtc(createdAt: string): string {
  if (createdAt.includes("T")) {
    return createdAt;
  }
  return `${createdAt.replace(" ", "T")}Z`;
}

function parseStoredCategories(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function mapRow(row: SellerSaasDbRow): SellerSaas {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.websiteUrl,
    iconUrl: row.iconUrl,
    categories: parseStoredCategories(row.categories),
    createdAt: toIsoUtc(row.createdAt),
    subscribers: Number(row.subscribers) || 0,
    monthlyRevenueCents: Number(row.monthlyRevenueCents) || 0,
  };
}

function optionalUrl(value: unknown, label: string): string | null {
  if (value == null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    fail(400, `${label} must be a URL.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length > MAX_URL_LEN) {
    fail(400, `${label} is too long.`);
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    fail(400, `${label} must start with http:// or https://.`);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    fail(400, `${label} must start with http:// or https://.`);
  }
  return trimmed;
}

function parseCategories(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  if (!Array.isArray(value)) {
    fail(400, "Categories must be a list.");
  }
  if (value.length > MAX_CATEGORIES) {
    fail(400, "Choose at most 3 categories.");
  }
  const slugs: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !CATEGORY_SLUGS.has(item)) {
      fail(400, "Unknown category.");
    }
    if (!slugs.includes(item)) {
      slugs.push(item);
    }
  }
  return slugs;
}

export function parseCreateSellerSaasBody(
  body: unknown,
): CreateSellerSaasInput {
  if (!body || typeof body !== "object") {
    fail(400, "Expected a JSON object.");
  }
  const record = body as Record<string, unknown>;
  const name = typeof record.name === "string" ? record.name.trim() : "";
  if (name.length < 2 || name.length > MAX_NAME_LEN) {
    fail(400, `Name must be between 2 and ${MAX_NAME_LEN} characters.`);
  }
  return {
    name,
    websiteUrl: optionalUrl(record.websiteUrl, "Website"),
    iconUrl: optionalUrl(record.iconUrl, "Icon URL"),
    categories: parseCategories(record.categories),
  };
}

type ClerkUserLike = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  primaryEmailAddressId: string | null;
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
    verification?: { status: string } | null;
  }>;
};

/** Sellers may not have a `users` row yet if the Clerk webhook has not landed. */
export async function ensureUserRow(
  db: D1Database,
  userId: string,
  loadClerkUser: () => Promise<ClerkUserLike>,
): Promise<void> {
  const existing = await db
    .prepare(`SELECT id FROM users WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first<{ id: string }>();
  if (existing) {
    return;
  }

  let clerkUser: ClerkUserLike;
  try {
    clerkUser = await loadClerkUser();
  } catch {
    fail(422, "Your account needs an email before you can list a product.");
  }

  try {
    await ensureUserFromClerkApi(db, {
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      username: clerkUser.username,
      imageUrl: clerkUser.imageUrl,
      primaryEmailAddressId: clerkUser.primaryEmailAddressId,
      emailAddresses: clerkUser.emailAddresses.map((email) => ({
        id: email.id,
        emailAddress: email.emailAddress,
        verification: email.verification?.status
          ? { status: email.verification.status }
          : null,
      })),
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    if (status === 422) {
      fail(422, "Your account needs an email before you can list a product.");
    }
    throw error;
  }
}

export async function listSaasForCreator(
  db: D1Database,
  userId: string,
): Promise<SellerSaas[]> {
  const { results } = await db
    .prepare(
      `${SELLER_SAAS_SELECT}
       WHERE s.created_by = ?
       ORDER BY s.created_at DESC`,
    )
    .bind(userId)
    .all<SellerSaasDbRow>();

  return (results ?? []).map(mapRow);
}

export async function getSaasForCreator(
  db: D1Database,
  userId: string,
  saasId: string,
): Promise<SellerSaas | null> {
  const row = await db
    .prepare(
      `${SELLER_SAAS_SELECT}
       WHERE s.created_by = ? AND s.id = ?
       LIMIT 1`,
    )
    .bind(userId, saasId)
    .first<SellerSaasDbRow>();

  return row ? mapRow(row) : null;
}

export async function createSaasForUser(
  db: D1Database,
  userId: string,
  input: CreateSellerSaasInput,
): Promise<SellerSaas> {
  const existing = await db
    .prepare(
      `SELECT id, created_by, website_url, icon_url, categories
       FROM saas
       WHERE LOWER(TRIM(name)) = LOWER(?)
       LIMIT 1`,
    )
    .bind(input.name)
    .first<{
      id: string;
      created_by: string | null;
      website_url: string | null;
      icon_url: string | null;
      categories: string;
    }>();

  if (existing?.created_by === userId) {
    fail(409, "You already list a product with this name.");
  }
  if (existing?.created_by) {
    fail(409, "Another seller already lists this product.");
  }

  const categoriesJson = JSON.stringify(
    input.categories.length > 0
      ? input.categories
      : existing
        ? parseStoredCategories(existing.categories)
        : [],
  );
  const websiteUrl = input.websiteUrl ?? existing?.website_url ?? null;
  const iconUrl = input.iconUrl ?? existing?.icon_url ?? null;

  if (existing) {
    const updated = await db
      .prepare(
        `UPDATE saas
         SET created_by = ?, website_url = ?, icon_url = ?, categories = ?
         WHERE id = ? AND created_by IS NULL`,
      )
      .bind(userId, websiteUrl, iconUrl, categoriesJson, existing.id)
      .run();
    if ((updated.meta.changes ?? 0) === 0) {
      fail(409, "Another seller already lists this product.");
    }
    const claimed = await getSaasForCreator(db, userId, existing.id);
    if (!claimed) {
      fail(500, "Could not load the product after saving it.");
    }
    return claimed;
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO saas (id, name, website_url, icon_url, categories, created_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(id, input.name, websiteUrl, iconUrl, categoriesJson, userId)
    .run();

  const created = await getSaasForCreator(db, userId, id);
  if (!created) {
    fail(500, "Could not load the product after saving it.");
  }
  return created;
}
