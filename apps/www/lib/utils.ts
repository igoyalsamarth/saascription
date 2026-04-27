import { getSiteUrl } from "./site";

export { cn } from "@saascription/ui";

/**
 * Resolves a path to an absolute URL using the current site origin.
 * Already-absolute `http(s)` hrefs are returned as-is.
 */
export function absoluteUrl(href: string) {
  if (href.startsWith("http://") || href.startsWith("https://")) {
    return href;
  }
  const base = getSiteUrl().replace(/\/$/, "");
  return `${base}${href.startsWith("/") ? href : `/${href}`}`;
}
