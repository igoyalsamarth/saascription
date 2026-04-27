import { buttonVariants, cn } from "@saascription/ui";
import { Link } from "@tanstack/react-router";

import ClerkHeader from "../integrations/clerk/header-user";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background text-foreground shadow-sm backdrop-blur-md transition-colors supports-[backdrop-filter]:bg-background/90 dark:supports-[backdrop-filter]:bg-background/80">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-2 font-semibold text-foreground",
          )}
        >
          <span className="size-2 rounded-full bg-primary" aria-hidden />
          Saascription
        </Link>

        <div className="flex items-center gap-2">
          <ClerkHeader />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
