import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { formatBlogDateLong } from "@/lib/blog/dates";
import { blogPostImageAbsoluteUrl } from "@/lib/blog/image-url";
import { getAllBlogListItems } from "@/lib/blog/loader";
import { siteName } from "@/lib/site";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Notes on managing SaaS subscriptions, renewals, and team operations.",
  alternates: { canonical: "/blog/" },
  openGraph: {
    title: "Blog",
    description:
      "Practical writing on subscription operations, renewals, and how we are building Saascription.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog | ${siteName}`,
  },
  robots: { index: true, follow: true },
};

export default function BlogIndexPage() {
  const blogPosts = getAllBlogListItems();
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">
        Blog
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
        Practical writing on subscription operations, renewals, and how we are
        building Saascription.
      </p>
      <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {blogPosts.map((post) => {
          const imageSrc = blogPostImageAbsoluteUrl(post);
          return (
            <li className="min-w-0" key={post.slug}>
              <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
                <Link
                  aria-label={post.title}
                  className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-muted/80"
                  href={`/blog/${post.slug}/`}
                >
                  {imageSrc ? (
                    <Image
                      alt=""
                      className="object-cover"
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      src={imageSrc}
                    />
                  ) : null}
                </Link>
                <div className="flex flex-1 flex-col p-6">
                  <time
                    className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                    dateTime={post.publishedOn}
                  >
                    {formatBlogDateLong(post.publishedOn)} · {post.readTime}
                  </time>
                  <h2 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                    <Link
                      className="hover:text-primary"
                      href={`/blog/${post.slug}/`}
                    >
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                    {post.description}
                  </p>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
