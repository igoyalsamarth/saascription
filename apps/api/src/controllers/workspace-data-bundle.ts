import {
  listSubscriptionsForWorkspace,
  type SubscriptionRow,
} from "./subscriptions";
import {
  getWorkspaceByIdForOwner,
  getWorkspaceForOwner,
} from "./workspaces";

export type WorkspaceDataBundlePayload = {
  subscriptions: SubscriptionRow[];
};

export type BuildWorkspaceDataBundleResult =
  | { ok: true; payload: WorkspaceDataBundlePayload }
  | { ok: false; reason: "invalid_workspace_id" };

export async function buildWorkspaceDataBundle(
  db: D1Database,
  ownerUserId: string,
  options?: { workspaceId?: string | null },
): Promise<BuildWorkspaceDataBundleResult> {
  if (options?.workspaceId) {
    const ws = await getWorkspaceByIdForOwner(
      db,
      options.workspaceId,
      ownerUserId,
    );
    if (!ws) {
      return { ok: false, reason: "invalid_workspace_id" };
    }
    const subscriptions = await listSubscriptionsForWorkspace(db, ws.id);
    return {
      ok: true,
      payload: { subscriptions },
    };
  }

  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return {
      ok: true,
      payload: { subscriptions: [] },
    };
  }

  const subscriptions = await listSubscriptionsForWorkspace(db, ws.id);

  return {
    ok: true,
    payload: { subscriptions },
  };
}
