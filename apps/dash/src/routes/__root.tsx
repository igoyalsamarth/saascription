import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";

import AppChrome from "../components/AppChrome";
import ClerkProvider from "../integrations/clerk/provider";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased wrap-anywhere selection:bg-primary/15">
      <ClerkProvider>
        <div className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
          <AppChrome>
            <Outlet />
          </AppChrome>
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </div>
      </ClerkProvider>
    </div>
  );
}
