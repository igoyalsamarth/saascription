import { Hono } from "hono";
import { cors } from "hono/cors";

import { app } from "./app";
import { handleReminderQueue } from "./reminders/consumer";
import { handleReminderScheduled } from "./reminders/scheduled";

const root = new Hono<{ Bindings: CloudflareBindings }>();

/** Vite dev servers (dash :5173, seller :5174); add deployed origins via wrangler when needed. */
root.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "https://dash.saascription.app",
      "https://seller.saascription.app",
    ],
    allowHeaders: ["Authorization", "Content-Type"],
    maxAge: 86_400,
  }),
);

root.route("/api/v1", app);

root.notFound((c) => c.json({ error: "Not Found" }, 404));

export default {
  fetch: root.fetch,
  scheduled: handleReminderScheduled,
  queue: handleReminderQueue,
};
