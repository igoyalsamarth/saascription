import fs from "node:fs";
import path from "node:path";

import matter from "gray-matter";
import readingTime from "reading-time";

import type {
  BlogListItem,
  BlogPostFrontmatter,
  BlogPostPayload,
} from "./types";

/** Private folder: not a URL segment. */
const POSTS_DIR = path.join(process.cwd(), "app", "blog", "_posts");

const slugRe = /^[a-z0-9]+(-[a-z0-9]+)*$/i;

function assertFrontmatter(d: unknown, slug: string): d is BlogPostFrontmatter {
  if (!d || typeof d !== "object") {
    throw new Error(
      `Invalid front matter in _posts/${slug}.mdx: expected a YAML object`,
    );
  }
  const o = d as Record<string, unknown>;
  for (const k of ["title", "description", "publishedOn"]) {
    if (typeof o[k] !== "string" || o[k] === "") {
      throw new Error(
        `Invalid front matter in _posts/${slug}.mdx: missing or invalid "${k}"`,
      );
    }
  }
  if (o.image !== undefined && typeof o.image !== "string") {
    throw new Error(
      `Invalid front matter in _posts/${slug}.mdx: "image" must be a string URL`,
    );
  }
  if (o.author !== undefined && typeof o.author !== "string") {
    throw new Error(
      `Invalid front matter in _posts/${slug}.mdx: "author" must be a string`,
    );
  }
  if (o.featured !== undefined && typeof o.featured !== "boolean") {
    throw new Error(
      `Invalid front matter in _posts/${slug}.mdx: "featured" must be a boolean`,
    );
  }
  if (o.tags !== undefined) {
    if (!Array.isArray(o.tags) || o.tags.some((t) => typeof t !== "string")) {
      throw new Error(
        `Invalid front matter in _posts/${slug}.mdx: "tags" must be a string array`,
      );
    }
  }
  return true;
}

export function getPostSlugsFromDisk(): string[] {
  if (!fs.existsSync(POSTS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/i, ""))
    .filter((slug) => slugRe.test(slug))
    .sort((a, b) => a.localeCompare(b, "en"));
}

function parseMdxFile(slug: string): {
  data: unknown;
  content: string;
} {
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Post file missing: _posts/${slug}.mdx`);
  }
  const raw = fs.readFileSync(filePath, "utf8");
  return matter(raw);
}

export function getPostBySlug(slug: string): BlogPostPayload | null {
  if (!slugRe.test(slug) || !getPostSlugsFromDisk().includes(slug)) {
    return null;
  }
  const { data, content } = parseMdxFile(slug);
  assertFrontmatter(data, slug);
  return {
    slug,
    frontmatter: data as BlogPostFrontmatter,
    content,
    readTime: readingTime(content).text,
  };
}

/**
 * For blog index and home teaser, sorted by `publishedOn` (newest first).
 */
export function getAllBlogListItems(): BlogListItem[] {
  const slugs = getPostSlugsFromDisk();
  const items: BlogListItem[] = slugs.map((slug) => {
    const { data, content } = parseMdxFile(slug);
    assertFrontmatter(data, slug);
    return {
      slug,
      readTime: readingTime(content).text,
      ...(data as BlogPostFrontmatter),
    };
  });
  return items.sort(
    (a, b) =>
      new Date(b.publishedOn).getTime() - new Date(a.publishedOn).getTime(),
  );
}
