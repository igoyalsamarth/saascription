import { clerkMiddleware } from "@hono/clerk-auth";
import { Hono } from "hono";
import { pingDb } from "./db";
import { saasRouter } from "./routes/saas";
import { usersRouter } from "./routes/users";
import { webhookRouter } from "./routes/wh/webhook";
import { workspacesRouter } from "./routes/workspaces";

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

app.route("/saas", saasRouter);
app.route("/users", usersRouter);
app.route("/workspaces", workspacesRouter);

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
