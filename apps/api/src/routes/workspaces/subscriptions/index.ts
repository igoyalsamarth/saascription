import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import {
  listSubscriptionsForOwner,
  parseSubscriptionsBody,
  replaceSubscriptionsForOwner,
} from "../../../controllers/subscriptions";

const subscriptionsRouter = new Hono<{ Bindings: CloudflareBindings }>();

subscriptionsRouter.get("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const list = await listSubscriptionsForOwner(c.env.DB, userId);
  if (list === "no_workspace") {
    return c.json({ error: "Workspace not found" }, 404);
  }
  return c.json({ subscriptions: list });
});

subscriptionsRouter.put("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const parsed = parseSubscriptionsBody(body);
  if (!parsed.ok) {
    return c.json({ error: parsed.error }, 400);
  }
  const saved = await replaceSubscriptionsForOwner(
    c.env.DB,
    userId,
    parsed.rows,
  );
  if (saved === "no_workspace") {
    return c.json({ error: "Workspace not found" }, 404);
  }
  if (saved === "no_user_email") {
    return c.json(
      { error: "Your account needs an email before subscriptions can be saved." },
      422,
    );
  }
  return c.json({ ok: true, subscriptions: saved });
});

export { subscriptionsRouter };
