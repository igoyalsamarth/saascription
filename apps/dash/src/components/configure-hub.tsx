import { AiBrain01Icon, PencilEdit02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  SidebarTrigger,
} from "@saascription/ui";
import { Link } from "@tanstack/react-router";

import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

export function ConfigureHubPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <header className={DASH_STICKY_HEADER}>
        <div
          className={
            DASH_STICKY_HEADER_PAD +
            " flex flex-wrap items-center justify-between gap-3"
          }
        >
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger className="-ml-1 md:hidden" />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold tracking-tight text-foreground">
                Configure subscriptions
              </h1>
              <p className="text-xs text-muted-foreground">
                Choose how your subscription list is populated.
              </p>
            </div>
          </div>
        </div>
      </header>
      <div className={DASH_SCROLL_CONTENT}>
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 sm:items-stretch">
            <Card className="h-full min-h-0 border-border/80 shadow-sm">
              <CardHeader className="gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"
                    aria-hidden
                  >
                    <HugeiconsIcon icon={AiBrain01Icon} className="size-5" />
                  </span>
                  <Badge
                    variant="secondary"
                    className="shrink-0 text-[0.625rem]"
                  >
                    Coming Soon
                  </Badge>
                </div>
                <CardTitle className="text-base">Auto setup</CardTitle>
                <CardDescription>
                  Connect accounts and discover renewals and spend
                  automatically.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  type="button"
                  variant="secondary"
                  disabled
                  className="w-full"
                >
                  Sync Subscriptions
                </Button>
              </CardFooter>
            </Card>

            <Card className="h-full min-h-0 justify-between border-border/80 shadow-sm ring-1 ring-primary/15">
              <CardHeader className="gap-2">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
                  aria-hidden
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} className="size-5" />
                </span>
                <CardTitle className="text-base">Your subscriptions</CardTitle>
                <CardDescription>
                  Add any services you pay for—names, amounts, and billing
                  rhythm are entirely up to you.
                </CardDescription>
              </CardHeader>
              <CardFooter className="w-full border-0 bg-transparent pt-0">
                <Link
                  to="/configure/subscriptions"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full justify-center",
                  )}
                >
                  Manage subscriptions
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
