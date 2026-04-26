import Link from "next/link";

import type { TocItem } from "@/lib/blog/toc";
import { cn } from "@/lib/utils";

type TocListProps = {
  items: TocItem[];
  className?: string;
  /** When set, connects the nav to a visible heading (e.g. sidebar "On this page"). */
  ariaLabelledBy?: string;
};

export function TocList({ items, className, ariaLabelledBy }: TocListProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <nav
      aria-label={ariaLabelledBy ? undefined : "On this page"}
      aria-labelledby={ariaLabelledBy}
      className={cn("flex flex-col gap-1.5", className)}
    >
      {items.map((h, i) => (
        <Link
          className={cn(
            "text-sm text-muted-foreground transition-colors hover:text-foreground",
            h.depth === 3 && "pl-3",
          )}
          href={`#${h.id}`}
          key={`${h.id}-${h.depth}-${i.toString()}`}
        >
          {h.text}
        </Link>
      ))}
    </nav>
  );
}
