import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { appSignInUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Saascription to manage your subscriptions.",
  alternates: { canonical: "/sign-in/" },
  openGraph: { type: "website" },
  robots: { index: true, follow: true },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-20 sm:px-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Sign in
          </h1>
          <p className="mt-2 text-muted-foreground">
            The product app lives on a separate subdomain. Use the link below to
            sign in.
          </p>
          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">
              You can also read the{" "}
              <Link
                className="font-medium text-primary hover:underline"
                href="/blog/"
              >
                blog
              </Link>{" "}
              on this site.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-10 w-full sm:w-auto",
                )}
                href={appSignInUrl}
              >
                Sign in
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 w-full sm:w-auto",
                )}
                href="/blog/"
              >
                Read blog
              </Link>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
