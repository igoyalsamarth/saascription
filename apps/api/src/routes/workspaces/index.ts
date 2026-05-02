import { getAuth } from "@clerk/hono";
import { Hono } from "hono";
import {
  createWorkspaceForOwner,
  ensureUserFromClerkApi,
  getWorkspaceForOwner,
} from "../../controllers/workspaces";

const workspacesRouter = new Hono<{ Bindings: CloudflareBindings }>();

workspacesRouter.get("/me", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const row = await getWorkspaceForOwner(c.env.DB, userId);
  return c.json({
    hasWorkspace: !!row,
    workspace: row ? { id: row.id, name: row.name } : null,
  });
});

workspacesRouter.post("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const clerkClient = c.get("clerk");
  let body: { workspaceName?: unknown; displayName?: unknown };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const workspaceName =
    typeof body.workspaceName === "string" ? body.workspaceName.trim() : "";
  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  if (!workspaceName || !displayName) {
    return c.json({ error: "workspaceName and displayName are required" }, 400);
  }
  if (workspaceName.length > 120 || displayName.length > 120) {
    return c.json({ error: "Fields too long" }, 400);
  }

  const existingUser = await c.env.DB.prepare(
    "SELECT id FROM users WHERE id = ?",
  )
    .bind(userId)
    .first();
  if (!existingUser) {
    try {
      const user = await clerkClient.users.getUser(userId);
      await ensureUserFromClerkApi(c.env.DB, user);
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      if (status === 422) {
        return c.json(
          {
            error:
              "Account email is not available yet; wait a moment or ensure your Clerk profile has an email.",
          },
          422,
        );
      }
      throw e;
    }
  }

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
    if (status === 409) {
      return c.json({ error: "Workspace already exists" }, 409);
    }
    throw e;
  }
});

export { workspacesRouter };
