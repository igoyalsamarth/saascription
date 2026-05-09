const MAX_SAAS_NAME_LEN = 200;
/** Minimum trimmed query length before search runs (aligned with dash combobox). */
export const SAAS_CATALOG_SEARCH_MIN_LEN = 2;
const SAAS_CATALOG_SEARCH_MAX_LEN = 64;
const SAAS_CATALOG_SEARCH_LIMIT = 40;

function normalizeSaasName(raw: string): string {
  return raw.trim();
}

/** Strip characters that would act as LIKE wildcards when bound as a literal fragment. */
function sanitizeLikeLiteralFragment(raw: string): string {
  return raw.replace(/[%_\\]/g, "");
}

/**
 * Prefix/substring search on catalog names (case-insensitive). Empty or short queries return [].
 */
export async function searchSaasCatalogByName(
  db: D1Database,
  rawQuery: string,
): Promise<{ id: string; name: string }[]> {
  const q = sanitizeLikeLiteralFragment(normalizeSaasName(rawQuery));
  if (q.length < SAAS_CATALOG_SEARCH_MIN_LEN) {
    return [];
  }
  if (q.length > SAAS_CATALOG_SEARCH_MAX_LEN) {
    return [];
  }

  const pattern = `%${q}%`;
  const { results } = await db
    .prepare(
      `SELECT id, name FROM saas
       WHERE LOWER(name) LIKE LOWER(?)
       ORDER BY
         CASE WHEN LOWER(name) = LOWER(?) THEN 0 ELSE 1 END,
         LENGTH(name),
         name COLLATE NOCASE
       LIMIT ?`,
    )
    .bind(pattern, q, SAAS_CATALOG_SEARCH_LIMIT)
    .all<{ id: string; name: string }>();

  return results ?? [];
}

/**
 * Case-insensitive match on trimmed name; creates a new catalog row when missing.
 */
export async function findOrCreateSaasByName(
  db: D1Database,
  rawName: string,
): Promise<{ id: string; name: string }> {
  const name = normalizeSaasName(rawName);
  if (!name) {
    throw new Error("saas_name_required");
  }
  if (name.length > MAX_SAAS_NAME_LEN) {
    throw new Error("saas_name_too_long");
  }

  const existing = await db
    .prepare(
      `SELECT id, name FROM saas
       WHERE LOWER(TRIM(name)) = LOWER(?)
       LIMIT 1`,
    )
    .bind(name)
    .first<{ id: string; name: string }>();

  if (existing) {
    return existing;
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO saas (id, name, created_at) VALUES (?, ?, datetime('now'))`,
    )
    .bind(id, name)
    .run();

  return { id, name };
}
