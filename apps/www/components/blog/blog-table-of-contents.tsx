import type { TocItem } from "@/lib/blog/toc";
import { TocList } from "./toc-list";

type BlogTableOfContentsProps = { items: TocItem[] };

export function BlogTableOfContents({ items }: BlogTableOfContentsProps) {
  if (items.length === 0) {
    return null;
  }
  return (
    <div className="w-full">
      <p className="mb-3 text-sm font-medium text-foreground" id="toc-label">
        On this page
      </p>
      <TocList
        ariaLabelledBy="toc-label"
        className="max-h-[60vh] overflow-y-auto"
        items={items}
      />
    </div>
  );
}
