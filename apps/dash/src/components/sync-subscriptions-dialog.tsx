"use client";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saascription/ui";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useClient } from "@/lib/client";
import {
  connectGmail,
  fetchOAuthUrl,
  GMAIL_OAUTH_REDIRECT_KEY,
  GMAIL_OAUTH_STATE_KEY,
  getGoogleOAuthRedirectUri,
  type SyncJobPhase,
  startSync,
  syncKeys,
  useSyncJobQuery,
  useSyncStatusQuery,
} from "@/services/sync";
import { useUserMe } from "@/services/user";
import { workspaceKeys } from "@/services/workspace";

type SyncStep =
  | "checking"
  | "oauth"
  | "connecting"
  | "starting"
  | "running"
  | "complete"
  | "error";

type SyncSubscriptionsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const PHASE_LABELS: Record<SyncJobPhase, string> = {
  listing: "Scanning your inbox…",
  filtering: "Finding subscription emails…",
  extracting: "Extracting subscription details…",
  ingesting: "Adding subscriptions…",
  done: "Finishing up…",
};

function phaseLabel(phase: SyncJobPhase): string {
  return PHASE_LABELS[phase] ?? "Working…";
}

export function SyncSubscriptionsDialog({
  open,
  onOpenChange,
}: SyncSubscriptionsDialogProps) {
  const client = useClient();
  const queryClient = useQueryClient();
  const { data: me } = useUserMe();
  const workspaceId = me?.workspace?.id;
  const { data: status, refetch: refetchStatus } = useSyncStatusQuery();

  const [step, setStep] = useState<SyncStep>("checking");
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: job } = useSyncJobQuery(jobId, {
    enabled: open && step === "running" && Boolean(jobId),
    refetchInterval: step === "running" ? 2000 : false,
  });

  const reset = useCallback(() => {
    setStep("checking");
    setJobId(null);
    setError(null);
  }, []);

  const handleOAuthMessage = useCallback(
    async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const data = event.data as {
        type?: string;
        code?: string;
        state?: string;
        error?: string;
      };
      if (data.type !== "gmail-oauth-callback") {
        return;
      }

      if (data.error) {
        setError(data.error);
        setStep("error");
        return;
      }

      if (!workspaceId || !data.code || !data.state) {
        setError("OAuth callback was missing required data.");
        setStep("error");
        return;
      }

      const expectedState = sessionStorage.getItem(GMAIL_OAUTH_STATE_KEY);
      if (!expectedState || expectedState !== data.state) {
        setError("OAuth state mismatch. Please try again.");
        setStep("error");
        return;
      }

      setStep("connecting");
      try {
        const redirectUri =
          sessionStorage.getItem(GMAIL_OAUTH_REDIRECT_KEY) ??
          getGoogleOAuthRedirectUri();
        await connectGmail(client, workspaceId, {
          code: data.code,
          state: data.state,
          redirectUri,
        });
        sessionStorage.removeItem(GMAIL_OAUTH_STATE_KEY);
        sessionStorage.removeItem(GMAIL_OAUTH_REDIRECT_KEY);
        await refetchStatus();
        const result = await startSync(client, workspaceId);
        setJobId(result.jobId);
        setStep("running");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to connect Gmail");
        setStep("error");
      }
    },
    [client, refetchStatus, workspaceId],
  );

  const openOAuthPopup = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    setStep("oauth");
    setError(null);
    try {
      const { url, state, redirectUri } = await fetchOAuthUrl(
        client,
        workspaceId,
      );
      sessionStorage.setItem(GMAIL_OAUTH_STATE_KEY, state);
      sessionStorage.setItem(GMAIL_OAUTH_REDIRECT_KEY, redirectUri);

      const popup = window.open(
        url,
        "gmail-oauth",
        "width=520,height=720,menubar=no,toolbar=no",
      );
      if (!popup) {
        setError("Popup blocked. Allow popups for this site and try again.");
        setStep("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start OAuth");
      setStep("error");
    }
  }, [client, workspaceId]);

  const beginSync = useCallback(async () => {
    if (!workspaceId) {
      return;
    }
    setStep("starting");
    setError(null);
    try {
      const result = await startSync(client, workspaceId);
      setJobId(result.jobId);
      setStep("running");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start sync");
      setStep("error");
    }
  }, [client, workspaceId]);

  useEffect(() => {
    if (!open) {
      return;
    }
    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [open, handleOAuthMessage]);

  useEffect(() => {
    if (!open || !workspaceId) {
      return;
    }
    reset();
    void refetchStatus();
  }, [open, workspaceId, reset, refetchStatus]);

  useEffect(() => {
    if (!open || step !== "checking" || !status) {
      return;
    }

    if (status.syncCompleted) {
      setStep("complete");
      return;
    }

    if (
      status.latestJob?.status === "running" ||
      status.latestJob?.status === "queued"
    ) {
      setJobId(status.latestJob.id);
      setStep("running");
      return;
    }

    if (status.connected) {
      void beginSync();
      return;
    }

    void openOAuthPopup();
  }, [open, step, status, beginSync, openOAuthPopup]);

  useEffect(() => {
    if (step !== "running" || !job) {
      return;
    }
    if (job.status === "completed") {
      setStep("complete");
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.bundle() });
      void queryClient.invalidateQueries({
        queryKey: syncKeys.status(workspaceId),
      });
    } else if (job.status === "failed") {
      setError(job.errorMessage ?? "Sync failed");
      setStep("error");
    }
  }, [step, job, queryClient, workspaceId]);

  if (!open) {
    return null;
  }

  const progress =
    job && job.totalMessages > 0
      ? Math.min(
          100,
          Math.round((job.processedMessages / job.totalMessages) * 100),
        )
      : job?.phase === "extracting" || job?.phase === "ingesting"
        ? 85
        : 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 supports-backdrop-filter:backdrop-blur-xs">
      <Card className="w-full max-w-md border-border/80 shadow-lg">
        <CardHeader className="gap-2">
          <CardTitle className="text-base">Sync subscriptions</CardTitle>
          <CardDescription>
            We scan the last year of Gmail for billing emails and add
            subscriptions automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {step === "oauth" && (
            <p className="text-sm text-muted-foreground">
              Complete Gmail permission in the popup window. If nothing opened,
              check your popup blocker.
            </p>
          )}

          {(step === "connecting" || step === "starting") && (
            <p className="text-sm text-muted-foreground">Connecting Gmail…</p>
          )}

          {step === "running" && job && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {phaseLabel(job.phase)}
              </p>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {job.processedMessages > 0 && job.totalMessages > 0
                  ? `${job.processedMessages.toLocaleString()} / ${job.totalMessages.toLocaleString()} emails scanned`
                  : "Starting scan…"}
                {job.candidateCount > 0
                  ? ` · ${job.candidateCount} candidates`
                  : ""}
              </p>
            </div>
          )}

          {step === "complete" && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="font-medium text-foreground">Sync complete</p>
              <p className="text-muted-foreground">
                {job
                  ? `Imported ${job.importedCount} subscription${job.importedCount === 1 ? "" : "s"}. Skipped ${job.skippedDuplicates} duplicate${job.skippedDuplicates === 1 ? "" : "s"}.`
                  : status?.syncCompleted
                    ? "This workspace has already been synced."
                    : "Your subscriptions are ready to review."}
              </p>
            </div>
          )}

          {step === "error" && (
            <p className="text-sm text-destructive">
              {error ?? "Something went wrong."}
            </p>
          )}

          <div className="flex justify-end gap-2">
            {step === "error" && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  reset();
                  if (status?.connected) {
                    void beginSync();
                  } else {
                    void openOAuthPopup();
                  }
                }}
              >
                Try again
              </Button>
            )}
            <Button
              type="button"
              variant={step === "complete" ? "default" : "secondary"}
              onClick={() => onOpenChange(false)}
              disabled={
                step === "running" ||
                step === "connecting" ||
                step === "starting"
              }
            >
              {step === "complete" ? "Done" : "Close"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
