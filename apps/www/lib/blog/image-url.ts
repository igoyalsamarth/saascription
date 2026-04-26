import { absoluteUrl } from "@/lib/utils";

import type { BlogPostFrontmatter } from "./types";

/**
 * Resolves `image` from post front matter to a single absolute URL. Used for
 * `next/image`, Open Graph, Twitter cards, and JSON-LD so all surfaces stay
 * consistent.
 */
export function blogPostImageAbsoluteUrl(
  post: Pick<BlogPostFrontmatter, "image">,
): string | undefined {
  if (!post.image) {
    return undefined;
  }
  return post.image.startsWith("http") ? post.image : absoluteUrl(post.image);
}
