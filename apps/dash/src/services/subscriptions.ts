import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useClient } from "@/lib/client";
import type { SubscriptionRow } from "@/lib/subscriptions";
import {
  getWorkspaceBundleQueryKey,
  useWorkspaceDataBundleQuery,
  type WorkspaceDataBundleResponse,
  workspaceKeys,
} from "@/services/workspace";

export type CreateSubscriptionResponse = {
  ok: true;
  subscription: SubscriptionRow;
};

export type UpdateSubscriptionResponse = {
  ok: true;
  subscription: SubscriptionRow;
};

type BundleRollbackContext = {
  previous: WorkspaceDataBundleResponse | undefined;
};

/** Callback fields are implemented internally (optimistic + rollback); omit from options. */
type SubscriptionMutationRestOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables, BundleRollbackContext>,
  "mutationFn" | "onMutate" | "onError" | "onSuccess" | "onSettled"
>;

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
  return useWorkspaceDataBundleQuery((data) => ({
    subscriptions: data.subscriptions,
  }));
}

export function useCreateSubscriptionMutation(
  options?: SubscriptionMutationRestOptions<
    CreateSubscriptionResponse,
    SubscriptionRow
  >,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation<
    CreateSubscriptionResponse,
    Error,
    SubscriptionRow,
    BundleRollbackContext
  >({
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
    onMutate: async (row) => {
      const key = getWorkspaceBundleQueryKey(queryClient);
      if (!key) {
        return { previous: undefined };
      }
      await queryClient.cancelQueries({
        queryKey: key,
      });
      const previous = queryClient.getQueryData<WorkspaceDataBundleResponse>(
        key,
      );
      queryClient.setQueryData<WorkspaceDataBundleResponse>(
        key,
        (old) => {
          if (!old) {
            return old;
          }
          return { ...old, subscriptions: [...old.subscriptions, row] };
        },
      );
      return { previous };
    },
    onError: (_err, _row, context) => {
      if (context?.previous !== undefined) {
        const key = getWorkspaceBundleQueryKey(queryClient);
        if (key) {
          queryClient.setQueryData(key, context.previous);
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}

export function useUpdateSubscriptionMutation(
  options?: SubscriptionMutationRestOptions<
    UpdateSubscriptionResponse,
    { id: string; row: SubscriptionRow }
  >,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation<
    UpdateSubscriptionResponse,
    Error,
    { id: string; row: SubscriptionRow },
    BundleRollbackContext
  >({
    ...options,
    mutationFn: async ({ id, row }) => {
      return client
        .patch(`workspaces/me/subscriptions/${id}`, {
          json: patchBody(row),
        })
        .json<UpdateSubscriptionResponse>();
    },
    onMutate: async (variables) => {
      const key = getWorkspaceBundleQueryKey(queryClient);
      if (!key) {
        return { previous: undefined };
      }
      await queryClient.cancelQueries({
        queryKey: key,
      });
      const previous = queryClient.getQueryData<WorkspaceDataBundleResponse>(
        key,
      );
      const { id, row } = variables;
      queryClient.setQueryData<WorkspaceDataBundleResponse>(
        key,
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            subscriptions: old.subscriptions.map((s) =>
              s.id === id ? { ...row, id } : s,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _variables, context) => {
      if (context?.previous !== undefined) {
        const key = getWorkspaceBundleQueryKey(queryClient);
        if (key) {
          queryClient.setQueryData(key, context.previous);
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}

export function useDeleteSubscriptionMutation(
  options?: SubscriptionMutationRestOptions<{ ok: true }, string>,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation<{ ok: true }, Error, string, BundleRollbackContext>({
    ...options,
    mutationFn: async (id: string) => {
      return client
        .delete(`workspaces/me/subscriptions/${id}`)
        .json<{ ok: true }>();
    },
    onMutate: async (id) => {
      const key = getWorkspaceBundleQueryKey(queryClient);
      if (!key) {
        return { previous: undefined };
      }
      await queryClient.cancelQueries({
        queryKey: key,
      });
      const previous = queryClient.getQueryData<WorkspaceDataBundleResponse>(
        key,
      );
      queryClient.setQueryData<WorkspaceDataBundleResponse>(
        key,
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            subscriptions: old.subscriptions.filter((s) => s.id !== id),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        const key = getWorkspaceBundleQueryKey(queryClient);
        if (key) {
          queryClient.setQueryData(key, context.previous);
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}

export type CancelSubscriptionResponse = {
  ok: true;
  subscription: SubscriptionRow;
};

export function useCancelSubscriptionMutation(
  options?: SubscriptionMutationRestOptions<CancelSubscriptionResponse, string>,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation<
    CancelSubscriptionResponse,
    Error,
    string,
    BundleRollbackContext
  >({
    ...options,
    mutationFn: async (id: string) => {
      return client
        .post(`workspaces/me/subscriptions/${id}/cancel`)
        .json<CancelSubscriptionResponse>();
    },
    onMutate: async (id) => {
      const key = getWorkspaceBundleQueryKey(queryClient);
      if (!key) {
        return { previous: undefined };
      }
      await queryClient.cancelQueries({
        queryKey: key,
      });
      const previous = queryClient.getQueryData<WorkspaceDataBundleResponse>(
        key,
      );
      const cancelledAt = new Date().toISOString();
      queryClient.setQueryData<WorkspaceDataBundleResponse>(
        key,
        (old) => {
          if (!old) {
            return old;
          }
          return {
            ...old,
            subscriptions: old.subscriptions.map((s) =>
              s.id === id
                ? {
                    ...s,
                    status: "cancelled" as const,
                    cancelledAt,
                  }
                : s,
            ),
          };
        },
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous !== undefined) {
        const key = getWorkspaceBundleQueryKey(queryClient);
        if (key) {
          queryClient.setQueryData(key, context.previous);
        }
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}
