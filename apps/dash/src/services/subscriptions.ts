import {
  type UseMutationOptions,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useClient } from "@/lib/client";
import type { SubscriptionRow } from "@/lib/subscriptions";
import {
  useWorkspaceDataBundleQuery,
  workspaceKeys,
} from "@/services/workspace";
import { useUserMe } from "@/services/user";

export type CreateSubscriptionResponse = {
  ok: true;
};

export type UpdateSubscriptionResponse = {
  ok: true;
};

export type CancelSubscriptionResponse = {
  ok: true;
};

type UpdateSubscriptionMutationOptions = Omit<
  UseMutationOptions<
    UpdateSubscriptionResponse,
    Error,
    { id: string; row: SubscriptionRow },
    undefined
  >,
  "mutationFn" | "onMutate" | "onError" | "onSuccess" | "onSettled"
>;

type CreateSubscriptionMutationOptions = Omit<
  UseMutationOptions<
    CreateSubscriptionResponse,
    Error,
    SubscriptionRow,
    undefined
  >,
  "mutationFn" | "onMutate" | "onError" | "onSuccess" | "onSettled"
>;

type DeleteSubscriptionMutationOptions = Omit<
  UseMutationOptions<{ ok: true }, Error, string, undefined>,
  "mutationFn" | "onMutate" | "onError" | "onSuccess" | "onSettled"
>;

type CancelSubscriptionMutationOptions = Omit<
  UseMutationOptions<CancelSubscriptionResponse, Error, string, undefined>,
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
  options?: CreateSubscriptionMutationOptions,
) {
  const client = useClient();
  const { data: me } = useUserMe();
  const workspaceId = me?.workspace?.id;
  const queryClient = useQueryClient();
  return useMutation<
    CreateSubscriptionResponse,
    Error,
    SubscriptionRow,
    undefined
  >({
    ...options,
    mutationFn: async (row) => {
      if (!workspaceId) {
        throw new Error("No workspace");
      }
      return client
        .post(`workspaces/${workspaceId}/subscriptions`, {
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
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}

export function useUpdateSubscriptionMutation(
  options?: UpdateSubscriptionMutationOptions,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  const { data: me } = useUserMe();
  const workspaceId = me?.workspace?.id;
  return useMutation<
    UpdateSubscriptionResponse,
    Error,
    { id: string; row: SubscriptionRow },
    undefined
  >({
    ...options,
    mutationFn: async ({ id, row }) => {
      if (!workspaceId) {
        throw new Error("No workspace");
      }
      return client
        .patch(`workspaces/${workspaceId}/subscriptions/${id}`, {
          json: patchBody(row),
        })
        .json<UpdateSubscriptionResponse>();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}

export function useDeleteSubscriptionMutation(
  options?: DeleteSubscriptionMutationOptions,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  const { data: me } = useUserMe();
  const workspaceId = me?.workspace?.id;
  return useMutation<{ ok: true }, Error, string, undefined>({
    ...options,
    mutationFn: async (id: string) => {
      if (!workspaceId) {
        throw new Error("No workspace");
      }
      return client
        .delete(`workspaces/${workspaceId}/subscriptions/${id}`)
        .json<{ ok: true }>();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}

export function useCancelSubscriptionMutation(
  options?: CancelSubscriptionMutationOptions,
) {
  const client = useClient();
  const queryClient = useQueryClient();
  const { data: me } = useUserMe();
  const workspaceId = me?.workspace?.id;
  return useMutation<CancelSubscriptionResponse, Error, string, undefined>({
    ...options,
    mutationFn: async (id: string) => {
      if (!workspaceId) {
        throw new Error("No workspace");
      }
      return client
        .post(`workspaces/${workspaceId}/subscriptions/${id}/cancel`)
        .json<CancelSubscriptionResponse>();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: workspaceKeys.bundle(),
      });
    },
  });
}
