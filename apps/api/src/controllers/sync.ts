import { getWorkspaceByIdForOwner } from "../controllers/workspaces";
import {
  buildGoogleAuthUrl,
  createOAuthState,
  exchangeCodeForTokens,
  parseOAuthState,
} from "../gmail/oauth";
import {
  getGmailConnection,
  upsertGmailConnection,
} from "../gmail/token-store";
import type { SyncJobPublic } from "../sync/jobs";
import {
  createSyncJob,
  getLatestSyncJobForWorkspace,
  getSyncJob,
  hasRunningSyncJob,
  mapSyncJobRow,
} from "../sync/jobs";

export type SyncStatusResponse = {
  connected: boolean;
  email: string | null;
  syncCompleted: boolean;
  latestJob: SyncJobPublic | null;
};

export function getOAuthRedirectUri(requestOrigin?: string): string {
  if (requestOrigin?.includes("dash.saascription.app")) {
    return "https://dash.saascription.app/api/auth/google/callback";
  }
  return "http://localhost:5173/api/auth/google/callback";
}

export async function getSyncStatus(
  db: D1Database,
  workspaceId: string,
): Promise<SyncStatusResponse> {
  const conn = await getGmailConnection(db, workspaceId);
  const latest = await getLatestSyncJobForWorkspace(db, workspaceId);

  return {
    connected: Boolean(conn),
    email: conn?.email ?? null,
    syncCompleted: Boolean(conn?.sync_completed_at),
    latestJob: latest ? mapSyncJobRow(latest) : null,
  };
}

export async function buildOAuthUrlForWorkspace(
  env: CloudflareBindings,
  workspaceId: string,
  userId: string,
  redirectUri: string,
): Promise<{ url: string; state: string }> {
  const state = await createOAuthState(env, workspaceId, userId);
  const url = buildGoogleAuthUrl(env, redirectUri, state);
  return { url, state };
}

export async function connectGmailForWorkspace(
  db: D1Database,
  env: CloudflareBindings,
  workspaceId: string,
  userId: string,
  code: string,
  state: string,
  redirectUri: string,
): Promise<{ email: string }> {
  const parsed = await parseOAuthState(env, state);
  if (
    !parsed ||
    parsed.workspaceId !== workspaceId ||
    parsed.userId !== userId
  ) {
    throw Object.assign(new Error("Invalid OAuth state"), { status: 401 });
  }

  const tokens = await exchangeCodeForTokens(env, code, redirectUri);
  const conn = await upsertGmailConnection(db, env, workspaceId, tokens);
  return { email: conn.email };
}

export async function startSyncForWorkspace(
  db: D1Database,
  env: CloudflareBindings,
  workspaceId: string,
  userId: string,
): Promise<{ jobId: string }> {
  const ws = await getWorkspaceByIdForOwner(db, workspaceId, userId);
  if (!ws) {
    throw Object.assign(new Error("Workspace not found"), { status: 404 });
  }

  const conn = await getGmailConnection(db, workspaceId);
  if (!conn) {
    throw Object.assign(new Error("Gmail not connected"), { status: 422 });
  }
  if (conn.sync_completed_at) {
    throw Object.assign(
      new Error("Sync already completed for this workspace"),
      {
        status: 409,
      },
    );
  }
  if (await hasRunningSyncJob(db, workspaceId)) {
    throw Object.assign(new Error("A sync is already in progress"), {
      status: 409,
    });
  }

  const job = await createSyncJob(db, workspaceId);
  const instance = await env.GMAIL_SYNC_WORKFLOW.create({
    id: job.id,
    params: {
      jobId: job.id,
      workspaceId,
      ownerUserId: userId,
    },
  });

  await db
    .prepare(
      `UPDATE sync_jobs SET workflow_instance_id = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(instance.id, job.id)
    .run();

  return { jobId: job.id };
}

export async function getSyncJobForWorkspace(
  db: D1Database,
  workspaceId: string,
  jobId: string,
): Promise<SyncJobPublic | null> {
  const job = await getSyncJob(db, jobId);
  if (!job || job.workspace_id !== workspaceId) {
    return null;
  }
  return mapSyncJobRow(job);
}
