import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";

import { buildCalendarPayload } from "../../controllers/calendar";
import { buildDashboardOverview } from "../../controllers/dashboard";
import {
  buildSpendsAnalytics,
  parseSpendsMonthsQuery,
} from "../../controllers/spends";
import { getUserById } from "../../controllers/users";
import { ensureUserFromClerkApi } from "../../controllers/workspaces";

const usersRouter = new Hono<{ Bindings: CloudflareBindings }>();

usersRouter.get("/me", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  let row = await getUserById(c.env.DB, userId);
  if (!row) {
    try {
      const clerkClient = c.get("clerk");
      const clerkUser = await clerkClient.users.getUser(userId);
      await ensureUserFromClerkApi(c.env.DB, clerkUser);
      row = await getUserById(c.env.DB, userId);
    } catch (e) {
      const status = (e as Error & { status?: number }).status;
      if (status === 422) {
        return c.json(
          {
            error:
              "Account email is not available yet; ensure your profile has an email.",
          },
          422,
        );
      }
      throw e;
    }
  }

  if (!row) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      imageUrl: row.image_url,
    },
  });
});

usersRouter.get("/me/dashboard", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const dashboard = await buildDashboardOverview(c.env.DB, userId);
  return c.json({ dashboard });
});

usersRouter.get("/me/calendar", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const calendar = await buildCalendarPayload(c.env.DB, userId);
  return c.json({ calendar });
});

usersRouter.get("/me/spends", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const months = parseSpendsMonthsQuery(c.req.query("months"));
  const spends = await buildSpendsAnalytics(c.env.DB, userId, months);
  return c.json({ spends });
});

export { usersRouter };
