import { SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";

import { appSignInUrl } from "@/lib/site";

const footerColumns = [
  {
    title: "Resources & support",
    titleClass: "text-primary",
    links: [
      { label: "Help", href: "#" },
      { label: "FAQ", href: "#" },
      { label: "Contact support", href: "#" },
      { label: "Knowledge base", href: "#" },
    ],
  },
  {
    title: "Product",
    titleClass: "text-chart-2",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Security", href: "#" },
    ],
  },
  {
    title: "Company",
    titleClass: "text-chart-2",
    links: [
      { label: "About us", href: "#" },
      { label: "Blog", href: "/blog/" },
      { label: "Careers", href: "#" },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border/80 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="lg:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HugeiconsIcon icon={SparklesIcon} size={18} aria-hidden />
              </span>
              Saascription
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The smartest way to manage, track, and optimize your SaaS
              subscriptions.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <p
                className={`text-xs font-semibold uppercase tracking-wider ${col.titleClass}`}
              >
                {col.title}
              </p>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-border/60 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {year} Saascription. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="#"
              className="text-muted-foreground hover:text-foreground"
            >
              Terms of Service
            </Link>
            <Link
              href={appSignInUrl}
              className="text-muted-foreground hover:text-foreground"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
