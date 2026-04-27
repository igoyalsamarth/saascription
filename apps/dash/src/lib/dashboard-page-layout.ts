/**
 * Page shell pattern: sticky top row + one scrollable region below (fills remaining height under the header).
 * Use with a root of `className="flex min-h-0 flex-1 flex-col bg-muted/30"` (or similar).
 */
export const DASH_STICKY_HEADER =
  "sticky top-0 z-20 border-b border-border bg-background/95 shadow-[0_1px_0_0] shadow-border/30 backdrop-blur-md supports-[backdrop-filter]:bg-background/90";

/** Slightly under `py-4` so the row lines up with `SidebarHeader` (sidebar `py-3` + brand row). */
export const DASH_STICKY_HEADER_PAD = "px-4 py-3.25 sm:px-6";

/**
 * Fills `flex-1` under the header and scrolls; hides native scrollbar (still scrollable / keyboard).
 */
export const DASH_SCROLL_CONTENT =
  "min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain overscroll-x-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0";
