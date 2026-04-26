import type { Metadata } from "next";
import Link from "next/link";

import { FeatureGrid } from "@/components/landing/feature-grid";
import { HomeBlogTeaser } from "@/components/landing/home-blog-teaser";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { buttonVariants } from "@/components/ui/button";
import { getAllBlogListItems } from "@/lib/blog/loader";
import { appSignInUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: { absolute: "Saascription | SaaS subscription management" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Saascription | SaaS subscription management",
    description:
      "Saascription helps you track tools, renewals, and spend across the company—so finance and IT stay aligned, and nothing renews on surprise terms.",
    type: "website",
  },
};

export default function Home() {
  const allPosts = getAllBlogListItems();
  const homePosts = allPosts.slice(0, 3);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <SiteHeader />
      <main>
        <section
          className="relative overflow-hidden border-b border-border/60"
          aria-labelledby="hero-heading"
        >
          <div
            className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.12] blur-3xl dark:bg-primary/20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 top-24 h-64 w-64 rounded-full bg-chart-2/20 blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 md:pt-24">
            <p className="text-sm font-medium text-primary">
              Subscription management for SaaS teams
            </p>
            <h1
              id="hero-heading"
              className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-tight"
            >
              All your subscriptions, one calm place
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Saascription helps you track tools, renewals, and spend across the
              company—so finance and IT stay aligned, and nothing renews on
              surprise terms.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "h-10 px-5 text-sm sm:h-11 sm:px-6",
                )}
                href={appSignInUrl}
              >
                Sign in
              </Link>
              <Link
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-10 px-5 text-sm sm:h-11 sm:px-6",
                )}
                href="/blog/"
              >
                Read the blog
              </Link>
            </div>
            <dl className="mt-16 grid max-w-2xl gap-6 sm:grid-cols-3">
              {[
                { k: "Tools tracked", v: "All vendors, one list" },
                { k: "Renewals", v: "Dates and owners in view" },
                { k: "Your data", v: "Designed for clarity" },
              ].map((row) => (
                <div
                  key={row.k}
                  className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 backdrop-blur-sm"
                >
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {row.k}
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-foreground">
                    {row.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <FeatureGrid />
        <section
          className="border-b border-border/60 py-20 sm:py-24"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/10 via-card to-card px-6 py-12 sm:px-10 sm:py-14">
              <h2
                id="cta-heading"
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                Ready to get subscription chaos under control?
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Create an account to be first in line as we open early access.
                No spam—just product updates you can use.
              </p>
              <div className="mt-6">
                <Link
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "h-10 px-5 text-sm",
                  )}
                  href={appSignInUrl}
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
        <HomeBlogTeaser posts={homePosts} />
      </main>
      <SiteFooter />
    </div>
  );
}
