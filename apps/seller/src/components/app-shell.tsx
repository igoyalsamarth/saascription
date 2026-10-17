import { useAuth } from "@clerk/clerk-react";
import {
  SidebarInset,
  SidebarProvider,
  TooltipProvider,
} from "@saascription/ui";
import { Navigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppSidebar } from "./app-sidebar";

function isBareAuthPath(pathname: string) {
  return (
    pathname === "/sign-in" ||
    pathname.startsWith("/sign-in/") ||
    pathname === "/sign-up" ||
    pathname.startsWith("/sign-up/")
  );
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

function useIsSplat404() {
  return useRouterState({
    select: (s) => s.matches.some((m) => m.routeId === "/$"),
  });
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isSplat404 = useIsSplat404();

  if (isBareAuthPath(pathname) || isSplat404) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground">
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <RequireAuth>
        <TooltipProvider>
          <SidebarProvider className="h-svh min-h-0 max-h-svh w-full overflow-hidden">
            <AppSidebar />
            <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
              {children}
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </RequireAuth>
    </div>
  );
}
