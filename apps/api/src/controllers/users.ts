import type { WorkspaceRow } from "./workspaces";

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  image_url: string | null;
};

export type UserMeDbBundle = {
  user: UserRow | null;
  workspace: WorkspaceRow | null;
};

/** Single round-trip for `GET /users/me` (user row + primary workspace). */
export async function getUserAndWorkspaceForOwner(
  db: D1Database,
  ownerUserId: string,
): Promise<UserMeDbBundle> {
  const [userRes, workspaceRes] = await db.batch([
    db
      .prepare(
        `SELECT id, email, name, image_url FROM users WHERE id = ? LIMIT 1`,
      )
      .bind(ownerUserId),
    db
      .prepare(
        `SELECT id, name FROM workspaces WHERE owner_user_id = ? ORDER BY created_at ASC LIMIT 1`,
      )
      .bind(ownerUserId),
  ]);
  const user = (userRes.results?.[0] as UserRow | undefined) ?? null;
  const workspace =
    (workspaceRes.results?.[0] as WorkspaceRow | undefined) ?? null;
  return { user, workspace };
}
