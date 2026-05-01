import { Hono } from "hono";
import { Webhook } from "svix";
import { deleteUserByClerkId, upsertUserFromClerk } from "../../controllers/clerk-users";
import type { ClerkWebhookEvent } from "../../types/clerk";

const wh = new Hono<{ Bindings: CloudflareBindings }>();

wh.post("/", async (c) => {
  const secret = c.env.CLERK_WEBHOOK_SIGNING_SECRET;
  if (!secret?.trim()) {
    return c.json({ error: "CLERK_WEBHOOK_SIGNING_SECRET is not configured" }, 500);
  }

  const payload = await c.req.text();
  const svixId = c.req.header("svix-id");
  const svixTimestamp = c.req.header("svix-timestamp");
  const svixSignature = c.req.header("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return c.json({ error: "Missing Svix signature headers" }, 400);
  }

  let evt: ClerkWebhookEvent;
  try {
    const verifier = new Webhook(secret);
    evt = verifier.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return c.json({ error: "Invalid webhook signature" }, 400);
  }

  const { type, data } = evt;

  if (type === "user.created" || type === "user.updated") {
    try {
      await upsertUserFromClerk(c.env.DB, data);
    } catch (e) {
      const status = (e as Error & { status?: number }).status ?? 500;
      if (status === 422) {
        return c.json(
          {
            error: "User has no resolvable email yet; Clerk may send a follow-up event",
          },
          422,
        );
      }
      throw e;
    }
    return c.json({ ok: true, type });
  }

  if (type === "user.deleted") {
    if (!data.id) {
      return c.json({ error: "Missing user id" }, 400);
    }
    await deleteUserByClerkId(c.env.DB, data.id);
    return c.json({ ok: true, type });
  }

  return c.json({ ok: true, ignored: true, type });
});

export { wh as clerkWebhookRouter };
