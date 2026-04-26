import GitHubSlugger from "github-slugger";

export type TocItem = { id: string; text: string; depth: 2 | 3 };

function stripInlineMd(raw: string) {
  return raw
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1");
}

/**
 * `##` / `###` headings, in file order, with ids aligned to `rehype-slug` (plain-text headings).
 */
export function tableOfContentsFromMdxBody(source: string): TocItem[] {
  const slugger = new GitHubSlugger();
  const out: TocItem[] = [];
  for (const line of source.split("\n")) {
    let depth: 2 | 3 | null = null;
    let body: string | null = null;
    const m3 = /^###\s+(.+?)\s*$/.exec(line);
    const m2 = /^##\s+(.+?)\s*$/.exec(line);
    if (m3) {
      depth = 3;
      body = m3[1] ?? "";
    } else if (m2) {
      depth = 2;
      body = m2[1] ?? "";
    }
    if (depth && body != null) {
      const text = stripInlineMd(body).trim() || "section";
      out.push({ depth, text, id: slugger.slug(text) });
    }
  }
  return out;
}
