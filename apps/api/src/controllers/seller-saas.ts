import { ensureUserFromClerkApi } from "./workspaces";

const MAX_NAME_LEN = 200;
const MAX_URL_LEN = 500;
const MAX_CATEGORIES = 3;
const MAX_PACKAGES = 12;
const MAX_PACKAGE_NAME_LEN = 80;
const MAX_AMOUNT_CENTS = 100_000_000;
const MAX_CUSTOM_CATEGORY_LEN = 40;

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

const CATEGORY_LABEL_TO_SLUG = new Map<string, string>([
  ["engineering", "engineering"],
  ["collaboration", "collaboration"],
  ["design", "design"],
  ["productivity", "productivity"],
  ["finance", "finance"],
  ["marketing", "marketing"],
  ["infrastructure", "infrastructure"],
  ["security", "security"],
]);

export type SellerPackage = {
  name: string;
  amountCents: number;
  currency: string;
  billingInterval: "monthly" | "yearly";
};

export type ListingStatus = "review" | "published";

export type SellerSaas = {
  id: string;
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string[];
  status: ListingStatus;
  packages: SellerPackage[];
  createdAt: string;
  subscribers: number;
  monthlyRevenueCents: number;
  creatorId: string | null;
  creatorEmail: string | null;
};

export type SellerSaasInput = {
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string[];
  packages: SellerPackage[];
};

type SellerSaasDbRow = {
  id: string;
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string;
  status: string;
  createdAt: string;
  subscribers: number;
  monthlyRevenueCents: number;
  creatorId: string | null;
  creatorEmail: string | null;
};

type PackageDbRow = {
  saasId: string;
  name: string;
  amountCents: number;
  currency: string;
  billingInterval: string;
};

const SELLER_SAAS_SELECT = `
  SELECT
    s.id,
    s.name,
    s.website_url AS websiteUrl,
    s.icon_url AS iconUrl,
    s.categories,
    s.status,
    s.created_at AS createdAt,
    s.created_by AS creatorId,
    (SELECT u.email FROM users u WHERE u.id = s.created_by) AS creatorEmail,
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

export function isAdminFlag(value: unknown): boolean {
  return value === 1 || value === true;
}

export async function userIsAdmin(
  db: D1Database,
  userId: string,
): Promise<boolean> {
  const row = await db
    .prepare(`SELECT admin FROM users WHERE id = ? LIMIT 1`)
    .bind(userId)
    .first<{ admin: number }>();
  return isAdminFlag(row?.admin);
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

function parseStatus(value: string): ListingStatus {
  return value === "review" ? "review" : "published";
}

function mapRow(row: SellerSaasDbRow, packages: SellerPackage[]): SellerSaas {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.websiteUrl,
    iconUrl: row.iconUrl,
    categories: parseStoredCategories(row.categories),
    status: parseStatus(row.status),
    packages,
    createdAt: toIsoUtc(row.createdAt),
    subscribers: Number(row.subscribers) || 0,
    monthlyRevenueCents: Number(row.monthlyRevenueCents) || 0,
    creatorId: row.creatorId,
    creatorEmail: row.creatorEmail,
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

function isCustomCategory(value: string): boolean {
  if (value.length < 2 || value.length > MAX_CUSTOM_CATEGORY_LEN) {
    return false;
  }
  return /^[\p{L}\p{N}][\p{L}\p{N}&+.' -]*$/u.test(value);
}

function canonicalCategory(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  const known = CATEGORY_LABEL_TO_SLUG.get(trimmed.toLowerCase());
  return known ?? trimmed;
}

function parseCategories(value: unknown): string[] {
  if (value == null) {
    return [];
  }
  if (!Array.isArray(value)) {
    fail(400, "Categories must be a list.");
  }
  const slugs: string[] = [];
  let custom: string | null = null;
  for (const item of value) {
    if (typeof item !== "string") {
      fail(400, "Enter a category using letters and numbers.");
    }
    const canonical = canonicalCategory(item);
    if (!canonical) {
      continue;
    }
    if (CATEGORY_SLUGS.has(canonical)) {
      if (!slugs.includes(canonical)) {
        slugs.push(canonical);
      }
      continue;
    }
    if (!isCustomCategory(canonical)) {
      fail(
        400,
        "Enter a category using letters, numbers, and spaces (2–40 characters).",
      );
    }
    if (custom && custom.toLowerCase() !== canonical.toLowerCase()) {
      fail(400, "Add at most one custom category.");
    }
    if (!custom) {
      custom = canonical;
      slugs.push(canonical);
    }
  }
  if (slugs.length > MAX_CATEGORIES) {
    fail(400, "Choose at most 3 categories.");
  }
  return slugs;
}

function parsePackages(value: unknown): SellerPackage[] {
  if (value == null) {
    return [];
  }
  if (!Array.isArray(value)) {
    fail(400, "Prices must be a list.");
  }
  if (value.length > MAX_PACKAGES) {
    fail(400, `Add at most ${MAX_PACKAGES} prices.`);
  }
  const packages: SellerPackage[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      fail(400, "Each price needs a package name and an amount.");
    }
    const record = item as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (name.length < 1 || name.length > MAX_PACKAGE_NAME_LEN) {
      fail(400, "Each package needs a name.");
    }
    const amount = record.amountCents;
    if (
      typeof amount !== "number" ||
      !Number.isInteger(amount) ||
      amount < 0 ||
      amount > MAX_AMOUNT_CENTS
    ) {
      fail(400, "Each price must be zero or a positive amount in cents.");
    }
    const billingInterval =
      record.billingInterval === "yearly"
        ? "yearly"
        : record.billingInterval === "monthly"
          ? "monthly"
          : null;
    if (!billingInterval) {
      fail(400, "Each price needs a monthly or yearly interval.");
    }
    packages.push({
      name,
      amountCents: amount,
      currency: "USD",
      billingInterval,
    });
  }
  return packages;
}

export function parseSellerSaasBody(body: unknown): SellerSaasInput {
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
    packages: parsePackages(record.packages),
  };
}

/** @deprecated Use parseSellerSaasBody. Kept so existing imports keep working. */
export const parseCreateSellerSaasBody = parseSellerSaasBody;

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

async function loadPackageMap(
  db: D1Database,
  saasIds: string[],
): Promise<Map<string, SellerPackage[]>> {
  const map = new Map<string, SellerPackage[]>();
  if (saasIds.length === 0) {
    return map;
  }
  const placeholders = saasIds.map(() => "?").join(", ");
  const { results } = await db
    .prepare(
      `SELECT
         saas_id AS saasId,
         name,
         amount_cents AS amountCents,
         currency,
         billing_interval AS billingInterval
       FROM saas_packages
       WHERE saas_id IN (${placeholders})
       ORDER BY sort_order ASC, name COLLATE NOCASE ASC`,
    )
    .bind(...saasIds)
    .all<PackageDbRow>();

  for (const row of results ?? []) {
    const interval = row.billingInterval === "yearly" ? "yearly" : "monthly";
    const list = map.get(row.saasId) ?? [];
    list.push({
      name: row.name,
      amountCents: Number(row.amountCents) || 0,
      currency: row.currency || "USD",
      billingInterval: interval,
    });
    map.set(row.saasId, list);
  }
  return map;
}

async function mapRows(
  db: D1Database,
  rows: SellerSaasDbRow[],
): Promise<SellerSaas[]> {
  const packages = await loadPackageMap(
    db,
    rows.map((row) => row.id),
  );
  return rows.map((row) => mapRow(row, packages.get(row.id) ?? []));
}

async function runStatements(
  db: D1Database,
  statements: D1PreparedStatement[],
): Promise<void> {
  if (statements.length === 0) {
    return;
  }
  if (statements.length === 1) {
    await statements[0]?.run();
    return;
  }
  await db.batch(statements);
}

function packageInserts(
  db: D1Database,
  saasId: string,
  packages: SellerPackage[],
) {
  return packages.map((pkg, index) =>
    db
      .prepare(
        `INSERT INTO saas_packages (
           id, saas_id, name, amount_cents, currency, billing_interval, sort_order
         ) VALUES (?, ?, ?, ?, 'USD', ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        saasId,
        pkg.name,
        pkg.amountCents,
        pkg.billingInterval,
        index,
      ),
  );
}

async function replacePackages(
  db: D1Database,
  saasId: string,
  packages: SellerPackage[],
): Promise<void> {
  await runStatements(db, [
    db.prepare(`DELETE FROM saas_packages WHERE saas_id = ?`).bind(saasId),
    ...packageInserts(db, saasId, packages),
  ]);
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

  return mapRows(db, results ?? []);
}

export async function listSaasInReview(db: D1Database): Promise<SellerSaas[]> {
  const { results } = await db
    .prepare(
      `${SELLER_SAAS_SELECT}
       WHERE s.status = 'review' AND s.created_by IS NOT NULL
       ORDER BY s.created_at ASC`,
    )
    .all<SellerSaasDbRow>();

  return mapRows(db, results ?? []);
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

  if (!row) {
    return null;
  }
  const [mapped] = await mapRows(db, [row]);
  return mapped ?? null;
}

async function getSaasById(
  db: D1Database,
  saasId: string,
): Promise<SellerSaas | null> {
  const row = await db
    .prepare(
      `${SELLER_SAAS_SELECT}
       WHERE s.id = ?
       LIMIT 1`,
    )
    .bind(saasId)
    .first<SellerSaasDbRow>();

  if (!row) {
    return null;
  }
  const [mapped] = await mapRows(db, [row]);
  return mapped ?? null;
}

export async function createSaasForUser(
  db: D1Database,
  userId: string,
  input: SellerSaasInput,
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
         SET created_by = ?, website_url = ?, icon_url = ?, categories = ?, status = 'review'
         WHERE id = ? AND created_by IS NULL`,
      )
      .bind(userId, websiteUrl, iconUrl, categoriesJson, existing.id)
      .run();
    if ((updated.meta.changes ?? 0) === 0) {
      fail(409, "Another seller already lists this product.");
    }
    await replacePackages(db, existing.id, input.packages);
    const claimed = await getSaasForCreator(db, userId, existing.id);
    if (!claimed) {
      fail(500, "Could not load the product after saving it.");
    }
    return claimed;
  }

  const id = crypto.randomUUID();
  await runStatements(db, [
    db
      .prepare(
        `INSERT INTO saas (
           id, name, website_url, icon_url, categories, created_by, status, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'review', datetime('now'))`,
      )
      .bind(id, input.name, websiteUrl, iconUrl, categoriesJson, userId),
    ...packageInserts(db, id, input.packages),
  ]);

  const created = await getSaasForCreator(db, userId, id);
  if (!created) {
    fail(500, "Could not load the product after saving it.");
  }
  return created;
}

export async function updateSaasForCreator(
  db: D1Database,
  userId: string,
  saasId: string,
  input: SellerSaasInput,
): Promise<SellerSaas> {
  const owned = await db
    .prepare(`SELECT id FROM saas WHERE id = ? AND created_by = ? LIMIT 1`)
    .bind(saasId, userId)
    .first<{ id: string }>();
  if (!owned) {
    fail(404, "Product not found.");
  }

  const clash = await db
    .prepare(
      `SELECT id FROM saas
       WHERE LOWER(TRIM(name)) = LOWER(?) AND id != ?
       LIMIT 1`,
    )
    .bind(input.name, saasId)
    .first<{ id: string }>();
  if (clash) {
    fail(409, "Another product already uses this name.");
  }

  await db
    .prepare(
      `UPDATE saas
       SET name = ?, website_url = ?, icon_url = ?, categories = ?, status = 'review'
       WHERE id = ? AND created_by = ?`,
    )
    .bind(
      input.name,
      input.websiteUrl,
      input.iconUrl,
      JSON.stringify(input.categories),
      saasId,
      userId,
    )
    .run();

  await replacePackages(db, saasId, input.packages);
  const saved = await getSaasForCreator(db, userId, saasId);
  if (!saved) {
    fail(500, "Could not load the product after saving it.");
  }
  return saved;
}

export async function deleteSaasForCreator(
  db: D1Database,
  userId: string,
  saasId: string,
): Promise<void> {
  const owned = await db
    .prepare(`SELECT id FROM saas WHERE id = ? AND created_by = ? LIMIT 1`)
    .bind(saasId, userId)
    .first<{ id: string }>();
  if (!owned) {
    fail(404, "Product not found.");
  }

  const subscription = await db
    .prepare(`SELECT COUNT(*) AS total FROM subscriptions WHERE saas_id = ?`)
    .bind(saasId)
    .first<{ total: number }>();
  const inUse = Number(subscription?.total ?? 0) > 0;

  if (inUse) {
    await runStatements(db, [
      db.prepare(`DELETE FROM saas_packages WHERE saas_id = ?`).bind(saasId),
      db
        .prepare(
          `UPDATE saas
           SET created_by = NULL,
               website_url = NULL,
               icon_url = NULL,
               categories = '[]',
               status = 'published'
           WHERE id = ? AND created_by = ?`,
        )
        .bind(saasId, userId),
    ]);
    return;
  }

  await runStatements(db, [
    db.prepare(`DELETE FROM saas_packages WHERE saas_id = ?`).bind(saasId),
    db
      .prepare(`DELETE FROM saas WHERE id = ? AND created_by = ?`)
      .bind(saasId, userId),
  ]);
}

export async function publishSaasListing(
  db: D1Database,
  saasId: string,
): Promise<SellerSaas> {
  const existing = await db
    .prepare(
      `SELECT id, created_by AS creatorId, status
       FROM saas
       WHERE id = ?
       LIMIT 1`,
    )
    .bind(saasId)
    .first<{ id: string; creatorId: string | null; status: string }>();

  if (!existing?.creatorId) {
    fail(404, "Listing not found.");
  }

  if (existing.status !== "published") {
    await db
      .prepare(
        `UPDATE saas
         SET status = 'published'
         WHERE id = ? AND created_by IS NOT NULL`,
      )
      .bind(saasId)
      .run();
  }

  const published = await getSaasById(db, saasId);
  if (!published) {
    fail(500, "Could not load the product after publishing it.");
  }
  return published;
}
