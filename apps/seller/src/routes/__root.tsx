import { createRootRoute, Outlet } from "@tanstack/react-router";

import AppShell from "../components/app-shell";
import ClerkProvider from "../providers/clerk";
import QueryProvider from "../providers/query";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-primary/15">
      <ClerkProvider>
        <QueryProvider>
          <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
            <AppShell>
              <Outlet />
            </AppShell>
          </div>
        </QueryProvider>
      </ClerkProvider>
    </div>
  );
}
