import type { ClerkUserData } from "../types/clerk";
import { upsertUserFromClerk } from "./clerk-users";

type ClerkApiUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  primaryEmailAddressId: string | null;
  emailAddresses?: Array<{
    id: string;
    emailAddress: string;
    verification?: { status: string } | null;
  }>;
};

export type WorkspaceRow = {
  id: string;
  name: string | null;
};

export async function getWorkspaceForOwner(
  db: D1Database,
  ownerUserId: string,
): Promise<WorkspaceRow | null> {
  const row = await db
    .prepare(
      `SELECT id, name FROM workspaces WHERE owner_user_id = ? ORDER BY created_at ASC LIMIT 1`,
    )
    .bind(ownerUserId)
    .first<WorkspaceRow>();
  return row ?? null;
}

export async function ensureUserFromClerkApi(
  db: D1Database,
  clerkUser: ClerkApiUser,
): Promise<void> {
  const data = mapToData(clerkUser);
  await upsertUserFromClerk(db, data);
}

function mapToData(user: ClerkApiUser): ClerkUserData {
  return {
    id: user.id,
    first_name: user.firstName,
    last_name: user.lastName,
    username: user.username,
    image_url: user.imageUrl,
    profile_image_url: user.imageUrl,
    primary_email_address_id: user.primaryEmailAddressId,
    email_addresses: user.emailAddresses?.map((ea) => ({
      id: ea.id,
      email_address: ea.emailAddress,
      verification: ea.verification?.status
        ? { status: ea.verification.status }
        : undefined,
    })),
  };
}

export async function createWorkspaceForOwner(
  db: D1Database,
  ownerUserId: string,
  name: string,
  displayName: string,
): Promise<WorkspaceRow> {
  const existing = await getWorkspaceForOwner(db, ownerUserId);
  if (existing) {
    const err = new Error("workspace_exists");
    (err as Error & { status: number }).status = 409;
    throw err;
  }

  const userEmail = await db
    .prepare(`SELECT email FROM users WHERE id = ?`)
    .bind(ownerUserId)
    .first<{ email: string }>();
  if (!userEmail?.email) {
    const err = new Error("user_email_required");
    (err as Error & { status: number }).status = 422;
    throw err;
  }

  const workspaceId = crypto.randomUUID();
  const primaryEmailId = crypto.randomUUID();

  await db.batch([
    db
      .prepare(
        `INSERT INTO workspaces (id, owner_user_id, name, created_at, updated_at)
         VALUES (?, ?, ?, datetime('now'), datetime('now'))`,
      )
      .bind(workspaceId, ownerUserId, name),
    db
      .prepare(
        `UPDATE users SET name = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(displayName, ownerUserId),
    db
      .prepare(
        `INSERT INTO workspace_emails (id, workspace_id, email, is_primary, created_at)
         VALUES (?, ?, ?, 1, datetime('now'))`,
      )
      .bind(primaryEmailId, workspaceId, userEmail.email),
  ]);

  return { id: workspaceId, name };
}
