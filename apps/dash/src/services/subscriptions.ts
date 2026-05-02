import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { SubscriptionRow } from "@/lib/subscriptions";
import { useClient } from "@/lib/client";

export const subscriptionKeys = {
  all: ["workspace-subscriptions"] as const,
  me: () => [...subscriptionKeys.all, "me"] as const,
};

export type WorkspaceSubscriptionsResponse = {
  subscriptions: SubscriptionRow[];
};

export type PutWorkspaceSubscriptionsResponse = {
  ok: true;
  subscriptions: SubscriptionRow[];
};

function bodyForPut(rows: SubscriptionRow[]) {
  return {
    subscriptions: rows.map((r) => ({
      id: r.id,
      name: r.name,
      amount: r.amount,
      interval: r.interval,
      nextBillingAt: r.nextBillingAt,
    })),
  };
}

export function useWorkspaceSubscriptionsQuery() {
  const client = useClient();
  return useQuery({
    queryKey: subscriptionKeys.me(),
    queryFn: () =>
      client
        .get("workspaces/me/subscriptions")
        .json<WorkspaceSubscriptionsResponse>(),
    staleTime: Number.POSITIVE_INFINITY,
  });
}

export function useReplaceWorkspaceSubscriptionsMutation(
  options?: Omit<
    UseMutationOptions<
      PutWorkspaceSubscriptionsResponse,
      Error,
      SubscriptionRow[],
      unknown
    >,
    "mutationFn"
  >,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (rows) => {
      return client
        .put("workspaces/me/subscriptions", {
          json: bodyForPut(rows),
        })
        .json<PutWorkspaceSubscriptionsResponse>();
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<WorkspaceSubscriptionsResponse>(
        subscriptionKeys.me(),
        { subscriptions: data.subscriptions },
      );
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
