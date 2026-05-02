import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export type WorkspaceMeResponse = {
  hasWorkspace: boolean;
  workspace: { id: string; name: string | null } | null;
};

export function useWorkspaceMe() {
  return useQuery({
    queryKey: ["workspace", "me"],
    queryFn: () => api.get("workspaces/me").json<WorkspaceMeResponse>(),
  });
}
