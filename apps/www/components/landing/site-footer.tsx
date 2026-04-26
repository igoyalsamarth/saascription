import Link from "next/link";

import { appSignInUrl } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-muted/30">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="font-semibold text-foreground">Saascription</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Subscription management for modern teams. Track renewals, spend, and
            owners in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <Link className="hover:text-foreground" href="/blog/">
            Blog
          </Link>
          <Link className="hover:text-foreground" href={appSignInUrl}>
            Sign in
          </Link>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Saascription. All rights reserved.
      </div>
    </footer>
  );
}
