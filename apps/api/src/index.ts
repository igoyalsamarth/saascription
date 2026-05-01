import { Hono } from "hono";
import { app } from "./app";

const root = new Hono<{ Bindings: CloudflareBindings }>();

root.route("/api/v1", app);

export default root;
