import { getAuth } from "@hono/clerk-auth";
import { Hono } from "hono";
import { getUserAndWorkspaceForOwner } from "../../controllers/users";

const usersRouter = new Hono<{ Bindings: CloudflareBindings }>();

usersRouter.get("/me", async (c) => {
  const { userId } = getAuth(c);
  if (!userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { user: row, workspace } = await getUserAndWorkspaceForOwner(
    c.env.DB,
    userId,
  );

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
    workspace: workspace
      ? { id: workspace.id, name: workspace.name }
      : null,
  });
});

export { usersRouter };
