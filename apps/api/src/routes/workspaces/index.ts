import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { buildWorkspaceDataBundle } from "../../controllers/workspace-data-bundle";
import {
  createWorkspaceForOwner,
  getWorkspaceByIdForOwner,
  getWorkspaceForOwner,
} from "../../controllers/workspaces";
import { subscriptionsRouter } from "./subscriptions";

const workspacesRouter = new Hono<{ Bindings: CloudflareBindings }>();

workspacesRouter.route("/:workspaceId/subscriptions", subscriptionsRouter);

workspacesRouter.get("/:workspaceId/data", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const workspaceId = c.req.param("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const ws = await getWorkspaceByIdForOwner(c.env.DB, workspaceId, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }
  const result = await buildWorkspaceDataBundle(c.env.DB, workspaceId);
  if (!result.ok) {
    return c.json({ error: result.reason }, 400);
  }
  return c.json(result.payload);
});

workspacesRouter.get("/:workspaceId/me", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const row = await getWorkspaceForOwner(c.env.DB, userId);
  return c.json({
    workspace: row ? { id: row.id, name: row.name } : null,
  });
});

workspacesRouter.post("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const {workspaceName, displayName} = await c.req.json();

  try {
    const ws = await createWorkspaceForOwner(
      c.env.DB,
      userId,
      workspaceName,
      displayName,
    );
    return c.json({ ok: true, workspace: { id: ws.id, name: ws.name } });
  } catch (e) {
    const status = (e as Error & { status?: number }).status;
    if (status === 422) {
      return c.json(
        {
          error:
            "Your account needs an email before a workspace can be created.",
        },
        422,
      );
    }
    if (status === 409) {
      return c.json({ error: "Workspace already exists" }, 409);
    }
    throw e;
  }
});

export { workspacesRouter };
