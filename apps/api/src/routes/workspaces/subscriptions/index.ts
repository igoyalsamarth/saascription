import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import {
  cancelSubscriptionForWorkspace,
  createSubscriptionForWorkspace,
  deleteSubscriptionForWorkspace,
  listSubscriptionsForWorkspace,
  updateSubscriptionForWorkspace,
} from "../../../controllers/subscriptions";
import { getWorkspaceByIdForOwner } from "../../../controllers/workspaces";

const subscriptionsRouter = new Hono<{ Bindings: CloudflareBindings }>();

subscriptionsRouter.get("/", async (c) => {
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
  const list = await listSubscriptionsForWorkspace(c.env.DB, workspaceId);
  return c.json({ subscriptions: list });
});

subscriptionsRouter.post("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const workspaceId = c.req.param("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const body = await c.req.json<{ id: string; name: string; amount: string; interval: string; nextBillingAt: string }>();
  
  await createSubscriptionForWorkspace(c.env.DB, workspaceId, userId, body);
  return c.json({ ok: true });
});

subscriptionsRouter.patch("/:id", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const workspaceId = c.req.param("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  const body = await c.req.json<{ name: string; amount: string; interval: string; nextBillingAt: string }>();

  await updateSubscriptionForWorkspace(c.env.DB, workspaceId, id, body);
  return c.json({ ok: true });
});

subscriptionsRouter.post("/:id/cancel", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const workspaceId = c.req.param("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  await cancelSubscriptionForWorkspace(c.env.DB, workspaceId, id);

  return c.json({ ok: true });
});

subscriptionsRouter.delete("/:id", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const workspaceId = c.req.param("workspaceId");
  if (!workspaceId) {
    return c.json({ error: "Missing workspaceId" }, 400);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  await deleteSubscriptionForWorkspace(c.env.DB, workspaceId, id);
  return c.json({ ok: true });
});

export { subscriptionsRouter };
