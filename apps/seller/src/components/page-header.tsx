import { cn, SidebarTrigger } from "@saascription/ui";
import type { ReactNode } from "react";

import {
  SELLER_STICKY_HEADER,
  SELLER_STICKY_HEADER_PAD,
} from "@/lib/page-layout";

type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className={cn(SELLER_STICKY_HEADER, SELLER_STICKY_HEADER_PAD)}>
      <div className="flex w-full items-start justify-between gap-3 sm:items-center">
        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {title}
            </h1>
            {description != null ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions != null ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
