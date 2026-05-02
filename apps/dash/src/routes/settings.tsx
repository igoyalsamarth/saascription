import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto p-4 sm:p-6">
      <h1 className="text-lg font-semibold tracking-tight text-foreground">
        Settings
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Manage your account and preferences. More options will appear here as
        the product grows.
      </p>
    </div>
  );
}
