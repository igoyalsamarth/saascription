import { buildDisplayName, pickImageUrl, resolvePrimaryEmail } from "../lib/clerk-user";
import type { ClerkUserData } from "../types/clerk";

export async function upsertUserFromClerk(db: D1Database, data: ClerkUserData): Promise<void> {
  const email = resolvePrimaryEmail(data);
  if (!email) {
    const err = new Error("missing_email");
    (err as Error & { status: number }).status = 422;
    throw err;
  }
  const name = buildDisplayName(data);
  const imageUrl = pickImageUrl(data);

  await db
    .prepare(
      `INSERT INTO users (id, email, name, image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
       ON CONFLICT(id) DO UPDATE SET
         email = excluded.email,
         name = excluded.name,
         image_url = excluded.image_url,
         updated_at = datetime('now')`,
    )
    .bind(data.id, email, name, imageUrl)
    .run();
}

export async function deleteUserByClerkId(db: D1Database, clerkUserId: string): Promise<void> {
  await db.prepare("DELETE FROM users WHERE id = ?").bind(clerkUserId).run();
}
