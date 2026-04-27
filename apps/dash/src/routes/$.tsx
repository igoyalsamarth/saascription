import { Link, createFileRoute } from "@tanstack/react-router";

import { buttonVariants, cn } from "@saascription/ui";

export const Route = createFileRoute("/$")({
  component: NotFoundRoute,
});

function NotFoundRoute() {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
      <p className="m-0 text-sm font-medium text-foreground">Page not found</p>
      <p className="m-0 max-w-sm text-center text-xs text-muted-foreground">
        The page you are looking for does not exist or was moved.
      </p>
      <Link
        to="/"
        className={cn(buttonVariants({ variant: "default", size: "sm" }))}
      >
        Back to dashboard
      </Link>
    </main>
  );
}
