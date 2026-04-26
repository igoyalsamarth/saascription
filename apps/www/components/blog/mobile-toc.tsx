import type { TocItem } from "@/lib/blog/toc";
import { cn } from "@/lib/utils";
import { TocList } from "./toc-list";

type MobileTocProps = { items: TocItem[]; className?: string };

export function MobileToc({ items, className }: MobileTocProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className={cn("lg:hidden", className)}>
      <details className="group rounded-lg border border-border/80 bg-card">
        <summary className="cursor-pointer list-none p-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          <span>On this page</span>
        </summary>
        <div className="border-t border-border/60 p-3">
          <TocList items={items} />
        </div>
      </details>
    </div>
  );
}
