/** Mailbox row used as `subscriptions.workspace_email_id` (one primary per workspace). */

export async function getPrimaryWorkspaceEmailId(
  db: D1Database,
  workspaceId: string,
): Promise<string | null> {
  const row = await db
    .prepare(
      `SELECT id FROM workspace_emails WHERE workspace_id = ? AND is_primary = 1 LIMIT 1`,
    )
    .bind(workspaceId)
    .first<{ id: string }>();
  return row?.id ?? null;
}

/**
 * Workspaces created before primary email was added at creation time may have no row here.
 * Inserts or promotes a primary mailbox from the owner’s `users.email` when missing.
 */
export async function backfillPrimaryWorkspaceEmailIfMissing(
  db: D1Database,
  workspaceId: string,
  ownerUserId: string,
): Promise<{ ok: true; id: string } | { ok: false; reason: "no_user_email" }> {
  const primary = await db
    .prepare(
      `SELECT id FROM workspace_emails WHERE workspace_id = ? AND is_primary = 1 LIMIT 1`,
    )
    .bind(workspaceId)
    .first<{ id: string }>();
  if (primary) {
    return { ok: true, id: primary.id };
  }

  const anyEmail = await db
    .prepare(`SELECT id FROM workspace_emails WHERE workspace_id = ? LIMIT 1`)
    .bind(workspaceId)
    .first<{ id: string }>();
  if (anyEmail) {
    await db
      .prepare(`UPDATE workspace_emails SET is_primary = 1 WHERE id = ?`)
      .bind(anyEmail.id)
      .run();
    return { ok: true, id: anyEmail.id };
  }

  const user = await db
    .prepare(`SELECT email FROM users WHERE id = ?`)
    .bind(ownerUserId)
    .first<{ email: string }>();
  if (!user?.email) {
    return { ok: false, reason: "no_user_email" };
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO workspace_emails (id, workspace_id, email, is_primary, created_at)
       VALUES (?, ?, ?, 1, datetime('now'))`,
    )
    .bind(id, workspaceId, user.email)
    .run();

  return { ok: true, id };
}
