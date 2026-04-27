import { useAuth } from "@clerk/clerk-react";
import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { DashboardAppShell } from "./dashboard-app-shell";

function isSignInPath(pathname: string) {
  return pathname === "/sign-in" || pathname.startsWith("/sign-in/");
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
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

/**
 * "Bare" layout: no app sidebar (sign-in, 404, etc.).
 * Root 404 is `routes/$.tsx` with route id `"/$"`. Match objects expose this as
 * `routeId` — we must not use `id` (that is a unique *match* id, not the route id).
 */
function useIsBareAppChrome() {
  return useRouterState({
    select: (s) => {
      if (isSignInPath(s.location.pathname)) {
        return true;
      }
      return s.matches.some((m) => m.routeId === "/$");
    },
  });
}

export default function AppChrome({ children }: { children: ReactNode }) {
  const bareChrome = useIsBareAppChrome();

  if (bareChrome) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground transition-colors">
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground transition-colors">
      <RequireAuth>
        <DashboardAppShell>{children}</DashboardAppShell>
      </RequireAuth>
    </div>
  );
}
