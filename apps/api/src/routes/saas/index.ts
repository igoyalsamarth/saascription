import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { searchSaasCatalogByName } from "../../controllers/saas";
import {
  createSaasForUser,
  ensureUserRow,
  getSaasForCreator,
  listSaasForCreator,
  parseCreateSellerSaasBody,
} from "../../controllers/seller-saas";

const saasRouter = new Hono<{ Bindings: CloudflareBindings }>();

function errorStatus(error: unknown): number | undefined {
  if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }
  return undefined;
}

/**
 * Global SaaS catalog search (any signed-in user). Optional `query` — short or empty returns [].
 * Only rows with a website or icon URL are returned.
 */
saasRouter.get("/all", async (c) => {
  const query = c.req.query("query") ?? "";
  const list = await searchSaasCatalogByName(c.env.DB, query);
  return c.json({ saas: list });
});

/** Products listed by the signed-in seller, with subscriber and revenue totals. */
saasRouter.get("/mine", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const saas = await listSaasForCreator(c.env.DB, userId);
  return c.json({ saas });
});

saasRouter.get("/mine/:id", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  const saas = await getSaasForCreator(c.env.DB, userId, id);
  if (!saas) {
    return c.json({ error: "Product not found" }, 404);
  }
  return c.json({ saas });
});

saasRouter.post("/", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Expected a JSON object." }, 400);
  }

  try {
    await ensureUserRow(c.env.DB, userId, async () => {
      const user = await c.get("clerk").users.getUser(userId);
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        imageUrl: user.imageUrl,
        primaryEmailAddressId: user.primaryEmailAddressId,
        emailAddresses: user.emailAddresses.map((email) => ({
          id: email.id,
          emailAddress: email.emailAddress,
          verification: email.verification?.status
            ? { status: email.verification.status }
            : null,
        })),
      };
    });
    const input = parseCreateSellerSaasBody(body);
    const saas = await createSaasForUser(c.env.DB, userId, input);
    return c.json({ saas }, 201);
  } catch (error) {
    const status = errorStatus(error);
    if (
      status === 400 ||
      status === 401 ||
      status === 404 ||
      status === 409 ||
      status === 422
    ) {
      return c.json({ error: (error as Error).message }, status);
    }
    throw error;
  }
});

export { saasRouter };
