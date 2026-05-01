import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@saascription/ui";
import Link from "next/link";
import { ThemeToggle } from "@/components/landing/theme-toggle";
import { appSignInUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

const mainNavLinks = [
  { href: "/#features", label: "Features" },
  { href: "/#testimonials", label: "Testimonials" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-14 items-center sm:h-16">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
          >
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"
              aria-hidden
            >
              <HugeiconsIcon icon={SparklesIcon} size={18} />
            </span>
            <span className="hidden sm:inline">Saascription</span>
          </Link>
          <nav
            className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-8 md:flex"
            aria-label="Main"
          >
            {mainNavLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Link
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "h-9 rounded-full px-4 text-xs font-medium sm:h-10 sm:px-5 sm:text-sm",
              )}
              href={appSignInUrl}
            >
              Get Started
            </Link>
          </div>
        </div>
        <nav
          className="flex justify-center gap-6 overflow-x-auto border-t border-border/50 py-2.5 md:hidden"
          aria-label="Main mobile"
        >
          {mainNavLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
