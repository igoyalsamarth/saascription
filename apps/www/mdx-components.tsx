import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

const linkClass =
  "font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary";

function ProseH1({ id, children }: { id?: string; children?: ReactNode }) {
  return (
    <h1
      className="mt-10 scroll-mt-20 text-2xl font-semibold tracking-tight text-foreground first:mt-0"
      id={id}
    >
      {children}
    </h1>
  );
}

function ProseH2({
  id,
  children,
  className,
}: {
  id?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <h2
      className={cn(
        "mt-10 scroll-mt-20 text-xl font-semibold tracking-tight text-foreground first:mt-0",
        className,
      )}
      id={id}
    >
      {children}
    </h2>
  );
}

function ProseH3({
  id,
  children,
  className,
}: {
  id?: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <h3
      className={cn(
        "mt-8 scroll-mt-20 text-lg font-semibold tracking-tight text-foreground",
        className,
      )}
      id={id}
    >
      {children}
    </h3>
  );
}

const components: MDXComponents = {
  h1: ProseH1,
  h2: ProseH2,
  h3: ProseH3,
  p: ({ children }) => (
    <p className="text-base leading-7 text-foreground/90">{children}</p>
  ),
  a: ({ children, href }) => (
    <a className={linkClass} href={href}>
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="my-4 list-outside list-disc space-y-2 pl-5 text-foreground/90">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-4 list-outside list-decimal space-y-2 pl-5 text-foreground/90">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-7">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-foreground">{children}</strong>
  ),
  code: ({ className, children, ...rest }) => {
    const isBlock = Boolean(className?.includes("language-"));
    if (isBlock) {
      return (
        <code className="font-mono text-sm text-foreground/95" {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground"
        {...rest}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="my-4 overflow-x-auto rounded-lg border border-border/80 bg-muted/50 p-4 text-sm">
      {children}
    </pre>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-primary/50 pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  img: ({ src, alt, title }) => (
    // MDX can reference any URL; `next/image` would need host allow-lists and dimensions.
    // biome-ignore lint/performance/noImgElement: author-controlled blog body images
    <img
      alt={alt ?? ""}
      className="my-6 h-auto w-full max-w-2xl rounded-lg border border-border/80"
      loading="lazy"
      src={typeof src === "string" ? src : ""}
      title={title}
    />
  ),
  hr: () => <hr className="my-8 border-border/80" />,
  table: ({ children }) => (
    <div className="my-4 overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        {children}
      </table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-3 py-2 font-semibold text-foreground">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-border/60 px-3 py-2 text-foreground/90">
      {children}
    </td>
  ),
};

export const mdxProseComponentMap = components;
/** Alias for blog post page (MDX remote). */
export const mdxComponents = mdxProseComponentMap;

export function useMDXComponents(): MDXComponents {
  return components;
}
