import { cn, SidebarInset } from "@saascription/ui";
import { useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { AppSidebar } from "./app-sidebar";

function useIsAiRoute() {
  return useRouterState({
    select: (s) =>
      s.location.pathname === "/ai" || s.location.pathname.startsWith("/ai/"),
  });
}

/** Shell content only — must render inside `SidebarProvider` (see AppChrome). */
export function DashboardAppShell({ children }: { children: ReactNode }) {
  const isAiRoute = useIsAiRoute();
  return (
    <>
      <AppSidebar />
      <SidebarInset
        className={cn(
          "min-h-0 min-w-0 overflow-hidden",
          isAiRoute && "bg-transparent shadow-none",
        )}
      >
        {children}
      </SidebarInset>
    </>
  );
}
