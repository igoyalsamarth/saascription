export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
};

export async function getUserById(
  db: D1Database,
  id: string,
): Promise<UserRow | null> {
  const row = await db
    .prepare(
      `SELECT id, email, name, image_url FROM users WHERE id = ? LIMIT 1`,
    )
    .bind(id)
    .first<UserRow>();
  return row ?? null;
}
