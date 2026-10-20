import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { searchSaasCatalogByName } from "../../controllers/saas";
import {
  createSaasForUser,
  deleteSaasForCreator,
  ensureUserRow,
  getSaasForCreator,
  listSaasForCreator,
  listSaasInReview,
  parseSellerSaasBody,
  publishSaasListing,
  updateSaasForCreator,
  userIsAdmin,
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

function jsonFromSellerError(error: unknown) {
  const status = errorStatus(error);
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 409 ||
    status === 422
  ) {
    return { status, message: (error as Error).message } as const;
  }
  return null;
}

/**
 * Global SaaS catalog search (any signed-in user). Optional `query` — short or empty returns [].
 * Only published rows with a website or icon URL are returned.
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

/** Listings waiting for an admin to publish. */
saasRouter.get("/review", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!(await userIsAdmin(c.env.DB, userId))) {
    return c.json({ error: "Only an admin can see listings in review." }, 403);
  }
  const saas = await listSaasInReview(c.env.DB);
  return c.json({ saas });
});

saasRouter.post("/review/:id/publish", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  if (!(await userIsAdmin(c.env.DB, userId))) {
    return c.json({ error: "Only an admin can publish listings." }, 403);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  try {
    const saas = await publishSaasListing(c.env.DB, id);
    return c.json({ saas });
  } catch (error) {
    const mapped = jsonFromSellerError(error);
    if (mapped) {
      return c.json({ error: mapped.message }, mapped.status);
    }
    throw error;
  }
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

saasRouter.patch("/mine/:id", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }

  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Expected a JSON object." }, 400);
  }

  try {
    const input = parseSellerSaasBody(body);
    const saas = await updateSaasForCreator(c.env.DB, userId, id, input);
    return c.json({ saas });
  } catch (error) {
    const mapped = jsonFromSellerError(error);
    if (mapped) {
      return c.json({ error: mapped.message }, mapped.status);
    }
    throw error;
  }
});

saasRouter.delete("/mine/:id", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const id = c.req.param("id");
  if (!id) {
    return c.json({ error: "Missing id" }, 400);
  }
  try {
    await deleteSaasForCreator(c.env.DB, userId, id);
    return c.json({ ok: true });
  } catch (error) {
    const mapped = jsonFromSellerError(error);
    if (mapped) {
      return c.json({ error: mapped.message }, mapped.status);
    }
    throw error;
  }
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
    const input = parseSellerSaasBody(body);
    const saas = await createSaasForUser(c.env.DB, userId, input);
    return c.json({ saas }, 201);
  } catch (error) {
    const mapped = jsonFromSellerError(error);
    if (mapped) {
      return c.json({ error: mapped.message }, mapped.status);
    }
    throw error;
  }
});

export { saasRouter };
