import { Hono } from "hono";
import { cors } from "hono/cors";

import { app } from "./app";

const root = new Hono<{ Bindings: CloudflareBindings }>();

/** Vite dev server (dash); add deployed dash origins via wrangler when needed. */
root.use(
  "*",
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://dash.saascription.com",
      "https://saascription-dash.pages.dev",
    ],
    allowHeaders: ["Authorization", "Content-Type"],
    maxAge: 86_400,
  }),
);

root.route("/api/v1", app);

root.notFound((c) => c.json({ error: "Not Found" }, 404));

export default root;
