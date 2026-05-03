import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useClient } from "@/lib/client";
import type { SubscriptionRow } from "@/lib/subscriptions";
import { calendarKeys } from "@/services/calendar";
import { dashboardKeys } from "@/services/dashboard";
import { spendsKeys } from "@/services/spends";

export const subscriptionKeys = {
  all: ["workspace-subscriptions"] as const,
  me: () => [...subscriptionKeys.all, "me"] as const,
};

export type WorkspaceSubscriptionsResponse = {
  subscriptions: SubscriptionRow[];
};

export type CreateSubscriptionResponse = {
  ok: true;
  subscription: SubscriptionRow;
};

export type UpdateSubscriptionResponse = {
  ok: true;
  subscription: SubscriptionRow;
};

function patchBody(
  row: Omit<SubscriptionRow, "id" | "saasId" | "status" | "cancelledAt">,
) {
  return {
    name: row.name,
    amount: row.amount,
    interval: row.interval,
    nextBillingAt: row.nextBillingAt,
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

export function useCreateSubscriptionMutation(
  options?: Omit<
    UseMutationOptions<
      CreateSubscriptionResponse,
      Error,
      SubscriptionRow,
      unknown
    >,
    "mutationFn"
  >,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (row) => {
      return client
        .post("workspaces/me/subscriptions", {
          json: {
            id: row.id,
            name: row.name,
            amount: row.amount,
            interval: row.interval,
            nextBillingAt: row.nextBillingAt,
          },
        })
        .json<CreateSubscriptionResponse>();
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<WorkspaceSubscriptionsResponse>(
        subscriptionKeys.me(),
        (old) => ({
          subscriptions: [...(old?.subscriptions ?? []), data.subscription],
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.overview(),
      });
      await queryClient.invalidateQueries({
        queryKey: calendarKeys.renewals(),
      });
      await queryClient.invalidateQueries({ queryKey: spendsKeys.all });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useUpdateSubscriptionMutation(
  options?: Omit<
    UseMutationOptions<
      UpdateSubscriptionResponse,
      Error,
      { id: string; row: SubscriptionRow },
      unknown
    >,
    "mutationFn"
  >,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ id, row }) => {
      return client
        .patch(`workspaces/me/subscriptions/${id}`, {
          json: patchBody(row),
        })
        .json<UpdateSubscriptionResponse>();
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<WorkspaceSubscriptionsResponse>(
        subscriptionKeys.me(),
        (old) => ({
          subscriptions: (old?.subscriptions ?? []).map((s) =>
            s.id === data.subscription.id ? data.subscription : s,
          ),
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.overview(),
      });
      await queryClient.invalidateQueries({
        queryKey: calendarKeys.renewals(),
      });
      await queryClient.invalidateQueries({ queryKey: spendsKeys.all });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}

export function useDeleteSubscriptionMutation(
  options?: Omit<
    UseMutationOptions<{ ok: true }, Error, string, unknown>,
    "mutationFn"
  >,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (id: string) => {
      return client
        .delete(`workspaces/me/subscriptions/${id}`)
        .json<{ ok: true }>();
    },
    onSuccess: async (data, id, onMutateResult, context) => {
      queryClient.setQueryData<WorkspaceSubscriptionsResponse>(
        subscriptionKeys.me(),
        (old) => ({
          subscriptions: (old?.subscriptions ?? []).filter((s) => s.id !== id),
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.overview(),
      });
      await queryClient.invalidateQueries({
        queryKey: calendarKeys.renewals(),
      });
      await queryClient.invalidateQueries({ queryKey: spendsKeys.all });
      await options?.onSuccess?.(data, id, onMutateResult, context);
    },
  });
}

export type CancelSubscriptionResponse = {
  ok: true;
  subscription: SubscriptionRow;
};

export function useCancelSubscriptionMutation(
  options?: Omit<
    UseMutationOptions<CancelSubscriptionResponse, Error, string, unknown>,
    "mutationFn"
  >,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (id: string) => {
      return client
        .post(`workspaces/me/subscriptions/${id}/cancel`)
        .json<CancelSubscriptionResponse>();
    },
    onSuccess: async (data, variables, onMutateResult, context) => {
      queryClient.setQueryData<WorkspaceSubscriptionsResponse>(
        subscriptionKeys.me(),
        (old) => ({
          subscriptions: (old?.subscriptions ?? []).map((s) =>
            s.id === data.subscription.id ? data.subscription : s,
          ),
        }),
      );
      await queryClient.invalidateQueries({
        queryKey: dashboardKeys.overview(),
      });
      await queryClient.invalidateQueries({
        queryKey: calendarKeys.renewals(),
      });
      await queryClient.invalidateQueries({ queryKey: spendsKeys.all });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
