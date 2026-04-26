import type { Metadata } from "next";

import { getSiteUrl } from "../site";
import { blogPostImageAbsoluteUrl } from "./image-url";
import type { BlogPostFrontmatter } from "./types";

function ogImage(absolute: string, title: string) {
  return { url: absolute, width: 1200, height: 630, alt: title };
}

export function blogPostMetadata(
  slug: string,
  post: BlogPostFrontmatter,
): Metadata {
  const path = `/blog/${slug}/`;
  const pageUrl = `${getSiteUrl()}${path}`;
  const published = new Date(`${post.publishedOn}T12:00:00.000Z`);
  const absoluteImage = blogPostImageAbsoluteUrl(post);
  const openGraph: Metadata["openGraph"] = {
    title: post.title,
    description: post.description,
    type: "article",
    publishedTime: published.toISOString(),
    url: pageUrl,
  };
  if (absoluteImage) {
    openGraph.images = [ogImage(absoluteImage, post.title)];
  }
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: path },
    openGraph,
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: absoluteImage ? [absoluteImage] : undefined,
    },
    robots: { index: true, follow: true },
  };
}
