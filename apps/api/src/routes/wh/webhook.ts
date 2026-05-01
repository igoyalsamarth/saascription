import { Hono } from "hono";
import { clerkWebhookRouter } from "./clerk";

const webhookRouter = new Hono<{ Bindings: CloudflareBindings }>();

webhookRouter.route("/clerk", clerkWebhookRouter);

export { webhookRouter };
