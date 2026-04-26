import type { MetadataRoute } from "next";

import { getPostBySlug, getPostSlugsFromDisk } from "@/lib/blog/loader";
import { absoluteUrl } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = false;

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "monthly" },
    {
      url: absoluteUrl("/blog/"),
      lastModified: now,
      changeFrequency: "weekly",
    },
    {
      url: absoluteUrl("/sign-in/"),
      lastModified: now,
      changeFrequency: "yearly",
    },
  ];
  for (const slug of getPostSlugsFromDisk()) {
    const post = getPostBySlug(slug);
    if (!post) {
      continue;
    }
    entries.push({
      url: absoluteUrl(`/blog/${slug}/`),
      lastModified: new Date(`${post.frontmatter.publishedOn}T12:00:00Z`),
      changeFrequency: "monthly",
    });
  }
  return entries;
}
