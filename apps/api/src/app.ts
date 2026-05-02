import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import {
  createWorkspaceForOwner,
  ensureUserFromClerkApi,
  getWorkspaceForOwner,
} from "./controllers/workspaces";
import { pingDb } from "./db";
import { webhookRouter } from "./routes/wh/webhook";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/wh", webhookRouter);

app.get("/health", async (c) => {
  const dbOk = await pingDb(c.env.DB);
  return c.json({ ok: true, db: dbOk ? "up" : "down" });
});

app.get("/", (c) => {
  return c.json({ ok: true, service: "api" });
});

app.post("/queue", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    body = { sentAt: new Date().toISOString() };
  }
  await c.env.QUEUE.send(body);
  return c.json({ ok: true, enqueued: true });
});

app.use("*", clerkMiddleware());

app.get("/workspaces/me", async (c) => {
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

app.post("/workspaces", async (c) => {
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

app.notFound((c) => c.json({ error: "Not Found" }, 404));

app.onError((err, c) => {
  console.error("[api]", err);
  return c.json(
    {
      error: "Internal Server Error",
      message: err.message,
    },
    500,
  );
});

export { app };
