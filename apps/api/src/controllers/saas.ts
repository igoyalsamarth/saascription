const MAX_SAAS_NAME_LEN = 200;

function normalizeSaasName(raw: string): string {
  return raw.trim();
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
