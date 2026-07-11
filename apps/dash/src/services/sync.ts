import { useQuery } from "@tanstack/react-query";
import { useClient } from "@/lib/client";
import { useUserMe } from "@/services/user";

export type SyncJobStatus = "queued" | "running" | "completed" | "failed";

export type SyncJobPhase =
  | "listing"
  | "filtering"
  | "extracting"
  | "ingesting"
  | "done";

export type SyncJob = {
  id: string;
  workspaceId: string;
  status: SyncJobStatus;
  phase: SyncJobPhase;
  totalMessages: number;
  processedMessages: number;
  candidateCount: number;
  extractedCount: number;
  importedCount: number;
  skippedDuplicates: number;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type SyncStatusResponse = {
  connected: boolean;
  email: string | null;
  syncCompleted: boolean;
  latestJob: SyncJob | null;
};

export type OAuthUrlResponse = {
  url: string;
  state: string;
  redirectUri: string;
};

export const syncKeys = {
  status: (workspaceId: string | undefined) =>
    ["sync", "status", workspaceId] as const,
  job: (workspaceId: string | undefined, jobId: string | undefined) =>
    ["sync", "job", workspaceId, jobId] as const,
};

export function useSyncStatusQuery() {
  const client = useClient();
  const { data: me } = useUserMe();
  const workspaceId = me?.workspace?.id;

  return useQuery({
    queryKey: syncKeys.status(workspaceId),
    queryFn: () =>
      client
        .get(`workspaces/${workspaceId}/sync/status`)
        .json<SyncStatusResponse>(),
    enabled: Boolean(workspaceId),
  });
}

export function useSyncJobQuery(
  jobId: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false },
) {
  const client = useClient();
  const { data: me } = useUserMe();
  const workspaceId = me?.workspace?.id;

  return useQuery({
    queryKey: syncKeys.job(workspaceId, jobId ?? undefined),
    queryFn: () =>
      client
        .get(`workspaces/${workspaceId}/sync/jobs/${jobId}`)
        .json<{ job: SyncJob }>()
        .then((r) => r.job),
    enabled: Boolean(workspaceId && jobId && options?.enabled !== false),
    refetchInterval: options?.refetchInterval,
  });
}

export async function fetchOAuthUrl(
  client: ReturnType<typeof useClient>,
  workspaceId: string,
): Promise<OAuthUrlResponse> {
  return client
    .get(`workspaces/${workspaceId}/sync/oauth-url`)
    .json<OAuthUrlResponse>();
}

export async function connectGmail(
  client: ReturnType<typeof useClient>,
  workspaceId: string,
  payload: { code: string; state: string; redirectUri: string },
): Promise<{ ok: true; email: string }> {
  return client
    .post(`workspaces/${workspaceId}/sync/gmail/connect`, { json: payload })
    .json<{ ok: true; email: string }>();
}

export async function startSync(
  client: ReturnType<typeof useClient>,
  workspaceId: string,
): Promise<{ ok: true; jobId: string }> {
  return client
    .post(`workspaces/${workspaceId}/sync/start`)
    .json<{ ok: true; jobId: string }>();
}

export const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/google/callback";

export function getGoogleOAuthRedirectUri(): string {
  if (typeof window === "undefined") {
    return "http://localhost:5173/api/auth/google/callback";
  }
  return `${window.location.origin}${GOOGLE_OAUTH_CALLBACK_PATH}`;
}

export const GMAIL_OAUTH_STATE_KEY = "saascription_gmail_oauth_state";
export const GMAIL_OAUTH_REDIRECT_KEY = "saascription_gmail_oauth_redirect";
