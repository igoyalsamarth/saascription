import {
  listSubscriptionsForWorkspace,
  type SubscriptionRow,
} from "./subscriptions";

export type WorkspaceDataBundlePayload = {
  subscriptions: SubscriptionRow[];
};

export type BuildWorkspaceDataBundleResult =
  | { ok: true; payload: WorkspaceDataBundlePayload }
  | { ok: false; reason: "invalid_workspace_id" };

export async function buildWorkspaceDataBundle(
  db: D1Database,
  workspaceId: string,
): Promise<BuildWorkspaceDataBundleResult> {

    const subscriptions = await listSubscriptionsForWorkspace(db, workspaceId);
  return { ok: true, payload: { subscriptions } };
}
