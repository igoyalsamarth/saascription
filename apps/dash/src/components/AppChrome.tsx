import { useAuth } from "@clerk/clerk-react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { OnboardGate, WorkspaceGate } from "@/components/workspace-gates";

import { DashboardAppShell } from "./dashboard-app-shell";

function isSignInPath(pathname: string) {
  return pathname === "/sign-in" || pathname.startsWith("/sign-in/");
}

function isOnboardPath(pathname: string) {
  return pathname === "/onboard" || pathname.startsWith("/onboard/");
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-black px-4">
        <p className="text-sm text-white">Loading…</p>
      </div>
    );
  }

  if (!userId) {
    return <Navigate to="/sign-in" replace />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">{children}</div>
  );
}

function BareChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground transition-colors">
      {children}
    </div>
  );
}

/**
 * "Bare" layout: no app sidebar (sign-in, 404, etc.).
 * Root 404 is `routes/$.tsx` with route id `"/$"`. Match objects expose this as
 * `routeId` — we must not use `id` (that is a unique *match* id, not the route id).
 */
function useIsSplat404() {
  return useRouterState({
    select: (s) => s.matches.some((m) => m.routeId === "/$"),
  });
}

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSplat404 = useIsSplat404();
  const isSignIn = isSignInPath(pathname);
  const isOnboard = isOnboardPath(pathname);

  if (isSignIn || isSplat404) {
    return <BareChrome>{children}</BareChrome>;
  }

  if (isOnboard) {
    return (
      <BareChrome>
        <RequireAuth>
          <OnboardGate>{children}</OnboardGate>
        </RequireAuth>
      </BareChrome>
    );
  }

  return (
    <BareChrome>
      <RequireAuth>
        <WorkspaceGate>
          <DashboardAppShell>{children}</DashboardAppShell>
        </WorkspaceGate>
      </RequireAuth>
    </BareChrome>
  );
}
