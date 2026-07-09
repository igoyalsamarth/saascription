import { Notification01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button, cn, SidebarTrigger } from "@saascription/ui";
import type { ReactNode } from "react";

import {
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

export function DashNotificationBell() {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative"
      aria-label="Notifications"
    >
      <HugeiconsIcon
        icon={Notification01Icon}
        className="size-4 text-foreground"
      />
      <span
        className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background"
        aria-hidden
      />
    </Button>
  );
}

type DashPageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  /** Rendered beside the notification bell in the top-right. */
  actions?: ReactNode;
  showNotificationBell?: boolean;
  /** Full-width row below the title (e.g. calendar toolbar). */
  below?: ReactNode;
  className?: string;
  sidebarTriggerClassName?: string;
};

export function DashPageHeader({
  title,
  description,
  eyebrow,
  actions,
  showNotificationBell = true,
  below,
  className,
  sidebarTriggerClassName = "shrink-0 md:hidden",
}: DashPageHeaderProps) {
  const hasTrailing = actions != null || showNotificationBell;

  return (
    <header
      className={cn(
        DASH_STICKY_HEADER,
        below != null && "flex flex-col gap-3 sm:gap-4",
        DASH_STICKY_HEADER_PAD,
        className,
      )}
    >
      <div className="flex w-full items-start justify-between gap-3 sm:items-center">
        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
          <SidebarTrigger className={sidebarTriggerClassName} />
          <div className="min-w-0">
            {eyebrow != null ? (
              <p className="text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1
              className={cn(
                "font-semibold tracking-tight text-foreground",
                eyebrow != null ? "text-lg" : "text-lg sm:text-xl",
              )}
            >
              {title}
            </h1>
            {description != null ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {hasTrailing ? (
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            {actions}
            {showNotificationBell ? <DashNotificationBell /> : null}
          </div>
        ) : null}
      </div>
      {below != null ? <div className="w-full">{below}</div> : null}
    </header>
  );
}
