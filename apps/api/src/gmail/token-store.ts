import {
  decryptRefreshToken,
  encryptRefreshToken,
  fetchGoogleUserEmail,
  type GoogleTokenResponse,
  refreshAccessToken,
} from "./oauth";

export type GmailConnectionRow = {
  id: string;
  workspace_id: string;
  email: string;
  refresh_token_enc: string;
  access_token: string | null;
  token_expires_at: string | null;
  scopes: string;
  connected_at: string;
  sync_completed_at: string | null;
};

export async function getGmailConnection(
  db: D1Database,
  workspaceId: string,
): Promise<GmailConnectionRow | null> {
  const row = await db
    .prepare(`SELECT * FROM gmail_connections WHERE workspace_id = ? LIMIT 1`)
    .bind(workspaceId)
    .first<GmailConnectionRow>();
  return row ?? null;
}

export async function upsertGmailConnection(
  db: D1Database,
  env: CloudflareBindings,
  workspaceId: string,
  tokens: GoogleTokenResponse,
): Promise<GmailConnectionRow> {
  if (!tokens.refresh_token && !tokens.access_token) {
    throw new Error("Google did not return tokens");
  }

  const existing = await getGmailConnection(db, workspaceId);
  const accessToken = tokens.access_token;
  const email = await fetchGoogleUserEmail(accessToken);
  const expiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();

  if (existing) {
    const refreshEnc = tokens.refresh_token
      ? await encryptRefreshToken(env, tokens.refresh_token)
      : existing.refresh_token_enc;

    await db
      .prepare(
        `UPDATE gmail_connections SET
           email = ?,
           refresh_token_enc = ?,
           access_token = ?,
           token_expires_at = ?,
           scopes = ?,
           updated_at = datetime('now')
         WHERE workspace_id = ?`,
      )
      .bind(
        email,
        refreshEnc,
        accessToken,
        expiresAt,
        JSON.stringify(tokens.scope.split(" ")),
        workspaceId,
      )
      .run();

    const updated = await getGmailConnection(db, workspaceId);
    if (!updated) {
      throw new Error("Failed to load gmail connection after update");
    }
    return updated;
  }

  if (!tokens.refresh_token) {
    throw new Error(
      "Google did not return a refresh token; revoke app access and try again",
    );
  }

  const id = crypto.randomUUID();
  const refreshEnc = await encryptRefreshToken(env, tokens.refresh_token);

  await db
    .prepare(
      `INSERT INTO gmail_connections (
         id, workspace_id, email, refresh_token_enc, access_token,
         token_expires_at, scopes, connected_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    )
    .bind(
      id,
      workspaceId,
      email,
      refreshEnc,
      accessToken,
      expiresAt,
      JSON.stringify(tokens.scope.split(" ")),
    )
    .run();

  const created = await getGmailConnection(db, workspaceId);
  if (!created) {
    throw new Error("Failed to load gmail connection after insert");
  }
  return created;
}

export async function getValidAccessToken(
  db: D1Database,
  env: CloudflareBindings,
  workspaceId: string,
): Promise<{ accessToken: string; email: string }> {
  const conn = await getGmailConnection(db, workspaceId);
  if (!conn) {
    throw new Error("Gmail not connected");
  }

  const expiresAt = conn.token_expires_at
    ? new Date(conn.token_expires_at).getTime()
    : 0;
  const stillValid = conn.access_token && Date.now() < expiresAt - 60_000;

  if (stillValid && conn.access_token) {
    return { accessToken: conn.access_token, email: conn.email };
  }

  const refreshToken = await decryptRefreshToken(env, conn.refresh_token_enc);
  const tokens = await refreshAccessToken(env, refreshToken);
  const newExpiresAt = new Date(
    Date.now() + tokens.expires_in * 1000,
  ).toISOString();

  await db
    .prepare(
      `UPDATE gmail_connections SET
         access_token = ?,
         token_expires_at = ?,
         updated_at = datetime('now')
       WHERE workspace_id = ?`,
    )
    .bind(tokens.access_token, newExpiresAt, workspaceId)
    .run();

  return { accessToken: tokens.access_token, email: conn.email };
}

export async function markSyncCompleted(
  db: D1Database,
  workspaceId: string,
): Promise<void> {
  await db
    .prepare(
      `UPDATE gmail_connections SET
         sync_completed_at = datetime('now'),
         updated_at = datetime('now')
       WHERE workspace_id = ?`,
    )
    .bind(workspaceId)
    .run();
}
