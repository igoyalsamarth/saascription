import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import {
  buildOAuthUrlForWorkspace,
  connectGmailForWorkspace,
  getOAuthRedirectUri,
  getSyncJobForWorkspace,
  getSyncStatus,
  startSyncForWorkspace,
} from "../../controllers/sync";
import { getWorkspaceByIdForOwner } from "../../controllers/workspaces";

const syncRouter = new Hono<{ Bindings: CloudflareBindings }>();

function requireWorkspaceId(c: {
  req: { param: (k: string) => string | undefined };
}): string | null {
  const workspaceId = c.req.param("workspaceId");
  return workspaceId || null;
}

syncRouter.get("/status", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const workspaceId = requireWorkspaceId(c);
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const ws = await getWorkspaceByIdForOwner(c.env.DB, workspaceId, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  const status = await getSyncStatus(c.env.DB, workspaceId);
  return c.json(status);
});

syncRouter.get("/oauth-url", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const workspaceId = requireWorkspaceId(c);
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const ws = await getWorkspaceByIdForOwner(c.env.DB, workspaceId, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  const origin = c.req.header("Origin") ?? undefined;
  const redirectUri = getOAuthRedirectUri(origin);
  const { url, state } = await buildOAuthUrlForWorkspace(
    c.env,
    workspaceId,
    userId,
    redirectUri,
  );

  return c.json({ url, state, redirectUri });
});

syncRouter.post("/gmail/connect", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const workspaceId = requireWorkspaceId(c);
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const ws = await getWorkspaceByIdForOwner(c.env.DB, workspaceId, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  let body: { code?: string; state?: string; redirectUri?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.code || !body.state) {
    return c.json({ error: "code and state are required" }, 400);
  }

  const origin = c.req.header("Origin") ?? undefined;
  const redirectUri = body.redirectUri ?? getOAuthRedirectUri(origin);

  try {
    const result = await connectGmailForWorkspace(
      c.env.DB,
      c.env,
      workspaceId,
      userId,
      body.code,
      body.state,
      redirectUri,
    );
    return c.json({ ok: true, email: result.email });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Connect failed";
    return c.json({ error: message }, status as 401 | 500);
  }
});

syncRouter.post("/start", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const workspaceId = requireWorkspaceId(c);
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const ws = await getWorkspaceByIdForOwner(c.env.DB, workspaceId, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  try {
    const result = await startSyncForWorkspace(
      c.env.DB,
      c.env,
      workspaceId,
      userId,
    );
    return c.json({ ok: true, jobId: result.jobId }, 202);
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Start failed";
    return c.json({ error: message }, status as 404 | 409 | 422 | 500);
  }
});

syncRouter.get("/jobs/:jobId", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const workspaceId = requireWorkspaceId(c);
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const jobId = c.req.param("jobId");
  if (!jobId) {
    return c.json({ error: "Missing jobId" }, 400);
  }
  const ws = await getWorkspaceByIdForOwner(c.env.DB, workspaceId, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }

  const job = await getSyncJobForWorkspace(c.env.DB, workspaceId, jobId);
  if (!job) {
    return c.json({ error: "Job not found" }, 404);
  }

  return c.json({ job });
});

export { syncRouter };
