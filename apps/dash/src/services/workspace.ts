import {
  type QueryClient,
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useClient } from "@/lib/client";
import type { SubscriptionRow } from "@/lib/subscriptions";
import { type UserMeResponse, userKeys, useUserMe } from "@/services/user";

export const workspaceKeys = {
  all: ["workspace"] as const,
  bundle: () => [...workspaceKeys.all, "bundle"] as const,
};

export type WorkspaceDataBundleResponse = {
  subscriptions: SubscriptionRow[];
};

/** Resolves the react-query key for the workspace data bundle (needs `users/me` in cache). */
export function getWorkspaceBundleQueryKey(
  queryClient: Pick<QueryClient, "getQueryData">,
): readonly unknown[] | null {
  const me = queryClient.getQueryData<UserMeResponse>(userKeys.me());
  const wid = me?.workspace?.id;
  if (!me?.hasWorkspace || !wid) {
    return null;
  }
  return [...workspaceKeys.bundle(), wid] as const;
}

export function useWorkspaceMe() {
  const q = useUserMe();
  return {
    ...q,
    data:
      q.data !== undefined
        ? {
            hasWorkspace: q.data.hasWorkspace,
            workspace: q.data.workspace,
          }
        : undefined,
  };
}

export function useWorkspaceDataBundleQuery<
  TSelected = WorkspaceDataBundleResponse,
>(select?: (data: WorkspaceDataBundleResponse) => TSelected) {
  const client = useClient();
  const { data: me, isSuccess: meSuccess } = useUserMe();
  const workspaceId = me?.workspace?.id;
  const enabled = meSuccess && !!me?.hasWorkspace && !!workspaceId;

  return useQuery({
    queryKey: [...workspaceKeys.bundle(), workspaceId ?? null] as const,
    queryFn: () =>
      client
        .get("workspaces/me/data", {
          searchParams: workspaceId ? { workspaceId } : {},
        })
        .json<WorkspaceDataBundleResponse>(),
    staleTime: Number.POSITIVE_INFINITY,
    select,
    enabled,
  });
}

export type CreateWorkspaceInput = {
  workspaceName: string;
  displayName: string;
};

export type CreateWorkspaceResponse = {
  ok: boolean;
  workspace: { id: string; name: string | null };
};

export function useCreateWorkspaceMutation(
  options?: Omit<
    UseMutationOptions<
      CreateWorkspaceResponse,
      Error,
      CreateWorkspaceInput,
      unknown
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();
  const client = useClient();
  return useMutation({
    ...options,
    mutationFn: async (values) => {
      return client
        .post("workspaces", { json: values })
        .json<CreateWorkspaceResponse>();
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      await queryClient.invalidateQueries({ queryKey: userKeys.me() });
      await queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
