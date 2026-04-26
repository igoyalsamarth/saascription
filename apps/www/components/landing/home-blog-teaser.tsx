import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { blogPostImageAbsoluteUrl } from "@/lib/blog/image-url";
import type { BlogListItem } from "@/lib/blog/types";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${iso}T12:00:00Z`));
}

type HomeBlogTeaserProps = { posts: BlogListItem[] };

export function HomeBlogTeaser({ posts }: HomeBlogTeaserProps) {
  return (
    <section
      aria-labelledby="blog-heading"
      className="border-b border-border/60 bg-muted/20 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
              id="blog-heading"
            >
              From the blog
            </h2>
            <p className="mt-3 max-w-xl text-lg text-muted-foreground">
              Ideas on managing SaaS subscriptions, renewals, and team
              alignment.
            </p>
          </div>
          <Link
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "shrink-0",
            )}
            href="/blog/"
          >
            View all posts
          </Link>
        </div>
        <ul className="mt-12 grid gap-6 md:grid-cols-3">
          {posts.map((post) => {
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
                        sizes="(max-width: 768px) 100vw, 33vw"
                        src={imageSrc}
                      />
                    ) : null}
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <time
                      className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                      dateTime={post.publishedOn}
                    >
                      {formatDate(post.publishedOn)} · {post.readTime}
                    </time>
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-foreground">
                      <Link
                        className="hover:text-primary"
                        href={`/blog/${post.slug}/`}
                      >
                        {post.title}
                      </Link>
                    </h3>
                    <p className="mt-2 line-clamp-3 flex-1 text-sm text-muted-foreground">
                      {post.description}
                    </p>
                    <Link
                      className="mt-4 text-sm font-medium text-primary hover:underline"
                      href={`/blog/${post.slug}/`}
                    >
                      Read article
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
