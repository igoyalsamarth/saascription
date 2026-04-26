import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { appSignInUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary"
            aria-hidden
          >
            S
          </span>
          <span className="hidden sm:inline">Saascription</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main">
          <Link
            href="/#features"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            Features
          </Link>
          <Link
            href="/blog/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-muted-foreground hover:text-foreground",
            )}
          >
            Blog
          </Link>
          <Link
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "h-8 px-3.5",
            )}
            href={appSignInUrl}
          >
            Sign in
          </Link>
        </nav>
      </div>
    </header>
  );
}
