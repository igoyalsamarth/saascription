import { Hono } from "hono";
import { pingDb } from "./db";
import { webhookRouter } from "./routes/wh/webhook";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.route("/wh", webhookRouter);

app.get("/", (c) => {
  return c.json({ ok: true, service: "api" });
});

app.get("/health", async (c) => {
  const dbOk = await pingDb(c.env.DB);
  return c.json({ ok: true, db: dbOk ? "up" : "down" });
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

export { app };
