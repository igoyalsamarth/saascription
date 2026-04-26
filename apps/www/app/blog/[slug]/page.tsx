import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import readingTime from "reading-time";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import type { BlogPosting, BreadcrumbList, WithContext } from "schema-dts";

import { BlogTableOfContents } from "@/components/blog/blog-table-of-contents";
import { MobileToc } from "@/components/blog/mobile-toc";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { formatBlogDateMedium } from "@/lib/blog/dates";
import { blogPostImageAbsoluteUrl } from "@/lib/blog/image-url";
import { getPostBySlug, getPostSlugsFromDisk } from "@/lib/blog/loader";
import { blogPostMetadata } from "@/lib/blog/seo";
import { tableOfContentsFromMdxBody } from "@/lib/blog/toc";
import { getSiteUrl, siteName } from "@/lib/site";
import { absoluteUrl, cn } from "@/lib/utils";
import { mdxProseComponentMap } from "@/mdx-components";

export const revalidate = false;
export const dynamic = "force-static";
export const dynamicParams = false;

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getPostSlugsFromDisk().map((slug) => ({ slug }));
}

function escapeForJsonScript(json: string) {
  return json.replace(/</g, "\\u003c");
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const p = getPostBySlug(slug);
  if (!p) {
    return { title: "Not found" };
  }
  return blogPostMetadata(slug, p.frontmatter);
}

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params;
  const p = getPostBySlug(slug);
  if (!p) {
    notFound();
  }
  const doc = p.frontmatter;
  if (!doc.title || !doc.description) {
    notFound();
  }

  const pagePath = `/blog/${slug}/`;
  const pageUrl = absoluteUrl(pagePath);
  const tocItems = tableOfContentsFromMdxBody(p.content);

  const rt = readingTime(p.content);
  const timeRequiredMins = Math.max(1, Math.round(rt.minutes || 1));
  const wc = p.content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const absoluteImage = blogPostImageAbsoluteUrl(doc);

  const breadcrumbs: readonly { name: string; url: string }[] = [
    { name: "Home", url: "/" },
    { name: "Blog", url: "/blog/" },
    { name: doc.title, url: pagePath },
  ] as const;

  const blogPosting: WithContext<BlogPosting> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: doc.title,
    description: doc.description,
    url: pageUrl,
    datePublished: doc.publishedOn,
    dateModified: doc.publishedOn,
    author: {
      "@type": "Person",
      name: doc.author ?? "Saascription",
    },
    image: absoluteImage ? [absoluteImage] : undefined,
    publisher: {
      "@type": "Organization",
      name: siteName,
      url: getSiteUrl(),
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
    wordCount: wc,
    timeRequired: `PT${timeRequiredMins}M`,
    keywords: doc.tags?.length ? doc.tags : undefined,
    inLanguage: "en-US",
  };

  const breadcrumbLd: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.url),
    })),
  };

  const mdx = await MDXRemote({
    source: p.content,
    components: mdxProseComponentMap,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
        dangerouslySetInnerHTML={{
          __html: escapeForJsonScript(JSON.stringify(blogPosting)),
        }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static JSON-LD
        dangerouslySetInnerHTML={{
          __html: escapeForJsonScript(JSON.stringify(breadcrumbLd)),
        }}
      />
      <div className="mx-auto mt-5 w-full max-w-6xl px-5 xl:px-0">
        <div className="mb-4">
          <Link
            className={cn(
              buttonVariants({ variant: "link" }),
              "h-auto gap-2 p-0 text-foreground",
            )}
            href="/blog/"
          >
            <HugeiconsIcon
              className="shrink-0"
              color="currentColor"
              icon={ArrowLeft01Icon}
              size={16}
            />
            Back to Blog
          </Link>
        </div>
        <article className="rounded-xl">
          {absoluteImage ? (
            <div className="border-border relative mb-2 aspect-1200/420 min-h-[200px] w-full max-h-[50vh] overflow-hidden rounded-xl border sm:aspect-2/1 sm:max-h-[420px] sm:min-h-0">
              <Image
                alt={doc.title}
                className="object-cover object-left"
                fill
                priority
                sizes="(max-width: 1280px) 100vw, 1200px"
                src={absoluteImage}
              />
            </div>
          ) : null}
          <div className="p-5">
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-y-4 text-balance text-center">
              <h1 className="text-3xl font-semibold tracking-tighter md:text-5xl">
                {doc.title}
              </h1>
              <p className="text-secondary-foreground max-w-3xl text-balance md:text-lg">
                {doc.description}
              </p>
              <div className="text-secondary-foreground flex flex-wrap items-center justify-center gap-x-2 text-sm">
                {doc.publishedOn ? (
                  <time dateTime={doc.publishedOn}>
                    {formatBlogDateMedium(doc.publishedOn)}
                  </time>
                ) : null}
                {doc.publishedOn && <span aria-hidden>·</span>}
                <span>{p.readTime}</span>
              </div>
            </div>
            {doc.tags && doc.tags.length > 0 ? (
              <div className="text-secondary-foreground mt-4 flex flex-wrap items-center justify-center gap-2 text-sm">
                {doc.tags.map((tag) => (
                  <Badge
                    className="border border-border/80 text-xs"
                    key={tag}
                    variant="secondary"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-1 gap-x-1 lg:grid-cols-7">
            <div className="article-content col-span-1 p-5 md:p-8 lg:col-span-5 lg:p-10">
              {mdx}
            </div>
            <aside className="text-primary col-span-1 hidden h-fit w-full flex-col items-start justify-start p-5 lg:sticky lg:top-20 lg:col-span-2 lg:flex">
              <BlogTableOfContents items={tocItems} />
              <div aria-hidden className="h-10" />
              <div className="min-h-32 w-full" />
            </aside>
          </div>
        </article>
        <MobileToc className="mt-5 px-1" items={tocItems} />
      </div>
    </>
  );
}
