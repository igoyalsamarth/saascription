import { createRootRoute, Outlet } from "@tanstack/react-router";

import AppChrome from "../components/AppChrome";
import ClerkProvider from "../providers/clerk";
import QueryProvider from "../providers/query";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased wrap-anywhere selection:bg-primary/15">
      <ClerkProvider>
        <QueryProvider>
          <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
            <AppChrome>
              <Outlet />
            </AppChrome>
          </div>
        </QueryProvider>
      </ClerkProvider>
    </div>
  );
}
