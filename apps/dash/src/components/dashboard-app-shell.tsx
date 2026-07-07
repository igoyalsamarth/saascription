import { SidebarInset } from "@saascription/ui";
import type { ReactNode } from "react";

import { AppSidebar } from "./app-sidebar";

/** Shell content only — must render inside `SidebarProvider` (see AppChrome). */
export function DashboardAppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppSidebar />
      <SidebarInset className="min-h-0 min-w-0 overflow-hidden">
        {children}
      </SidebarInset>
    </>
  );
}
