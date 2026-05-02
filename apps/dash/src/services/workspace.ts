import {
  type UseMutationOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { useClient } from "@/lib/client";

import { userKeys } from "./user";

export const workspaceKeys = {
  all: ["workspace"] as const,
  me: () => [...workspaceKeys.all, "me"] as const,
};

export type WorkspaceMeResponse = {
  hasWorkspace: boolean;
  workspace: { id: string; name: string | null } | null;
};

export function useWorkspaceMe() {
  const client = useClient();
  return useQuery({
    queryKey: workspaceKeys.me(),
    queryFn: () => client.get("workspaces/me").json<WorkspaceMeResponse>(),
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
      await queryClient.invalidateQueries({ queryKey: workspaceKeys.me() });
      await queryClient.invalidateQueries({ queryKey: userKeys.me() });
      await options?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
}
