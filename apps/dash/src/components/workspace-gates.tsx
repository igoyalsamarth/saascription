import { Navigate } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useUserMe } from "@/services/user";

/** Full app shell: send users without a workspace to onboarding. */
export function WorkspaceGate({ children }: { children: ReactNode }) {
  const { data, isPending, isError, error } = useUserMe();

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Could not load workspace.";
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-background px-4">
        <p className="text-sm text-destructive">{message}</p>
        <p className="text-center text-xs text-muted-foreground">
          Try refreshing. If this persists, contact support.
        </p>
      </div>
    );
  }

  if (!data?.workspace?.id) {
    return <Navigate to="/onboard" replace />;
  }

  return children;
}

/** Onboarding page: if they already have a workspace, go home. */
export function OnboardGate({ children }: { children: ReactNode }) {
  const { data, isPending, isError, error } = useUserMe();

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Could not load workspace.";
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 bg-background px-4">
        <p className="text-sm text-destructive">{message}</p>
        <p className="text-center text-xs text-muted-foreground">
          Try refreshing. If this persists, contact support.
        </p>
      </div>
    );
  }

  if (data?.workspace?.id) {
    return <Navigate to="/" replace />;
  }

  return children;
}
