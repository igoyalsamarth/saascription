/**
 * YAML frontmatter in `app/blog/_posts/<slug>.mdx`
 */
export type BlogPostFrontmatter = {
  title: string;
  description: string;
  image?: string;
  author?: string;
  tags?: string[];
  /** ISO date `YYYY-MM-DD` */
  publishedOn: string;
  featured?: boolean;
};

/**
 * For index / home teaser: frontmatter + computed `readTime` and route `slug`.
 */
export type BlogListItem = BlogPostFrontmatter & {
  slug: string;
  readTime: string;
};

/**
 * Post loaded for rendering: parsed frontmatter, MDX body, computed read time.
 */
export type BlogPostPayload = {
  slug: string;
  frontmatter: BlogPostFrontmatter;
  content: string;
  readTime: string;
};
