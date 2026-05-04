import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import {
  cancelSubscriptionForWorkspace,
  createSubscriptionForWorkspace,
  deleteSubscriptionForWorkspace,
  listSubscriptionsForWorkspace,
  parseSubscriptionFieldsBody,
  parseSubscriptionPayload,
  updateSubscriptionForWorkspace,
} from "../../../controllers/subscriptions";
import { getWorkspaceForOwner } from "../../../controllers/workspaces";

const subscriptionsRouter = new Hono<{ Bindings: CloudflareBindings }>();

subscriptionsRouter.get("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const ws = await getWorkspaceForOwner(c.env.DB, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }
  const list = await listSubscriptionsForWorkspace(c.env.DB, ws.id);
  return c.json({ subscriptions: list });
});

subscriptionsRouter.post("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const ws = await getWorkspaceForOwner(c.env.DB, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = parseSubscriptionPayload(body, { requireId: false });
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }
  const saved = await createSubscriptionForWorkspace(
    c.env.DB,
    ws.id,
    userId,
    parsed.row,
  );
  if (saved === "no_user_email") {
    return c.json(
      {
        error:
          "Your account needs an email before subscriptions can be saved.",
      },
      422,
    );
  }
  if (saved === "limit_reached") {
    return c.json({ error: "Maximum number of subscriptions reached" }, 400);
  }
  return c.json({ ok: true, subscription: saved });
});

subscriptionsRouter.patch("/:id", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const ws = await getWorkspaceForOwner(c.env.DB, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = parseSubscriptionFieldsBody(body);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }
  const updated = await updateSubscriptionForWorkspace(
    c.env.DB,
    ws.id,
    id,
    parsed.fields,
  );
  if (updated === "not_found") {
    return c.json({ error: "Subscription not found" }, 404);
  }
  if (updated === "cannot_edit_cancelled") {
    return c.json(
      { error: "Cancelled subscriptions cannot be edited." },
      409,
    );
  }
  return c.json({ ok: true, subscription: updated });
});

subscriptionsRouter.post("/:id/cancel", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const ws = await getWorkspaceForOwner(c.env.DB, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  const result = await cancelSubscriptionForWorkspace(c.env.DB, ws.id, id);
  if (result === "not_found") {
    return c.json({ error: "Subscription not found" }, 404);
  }
  return c.json({ ok: true, subscription: result });
});

subscriptionsRouter.delete("/:id", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const ws = await getWorkspaceForOwner(c.env.DB, userId);
  if (!ws) {
    return c.json({ error: "Workspace not found" }, 404);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  const deleted = await deleteSubscriptionForWorkspace(c.env.DB, ws.id, id);
  if (!deleted) {
    return c.json({ error: "Subscription not found" }, 404);
  }
  return c.json({ ok: true });
});

export { subscriptionsRouter };
