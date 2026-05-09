import { Hono } from "hono";
import { searchSaasCatalogByName } from "../../controllers/saas";

const saasRouter = new Hono<{ Bindings: CloudflareBindings }>();

/**
 * Global SaaS catalog search (any signed-in user). Optional `query` — short or empty returns [].
 */
saasRouter.get("/all", async (c) => {

  const query = c.req.query("query") ?? "";
  const list = await searchSaasCatalogByName(c.env.DB, query);
  return c.json({ saas: list });
});

export { saasRouter };
