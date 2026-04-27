import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  output: "export",
  trailingSlash: true,
  transpilePackages: ["@saascription/ui"],
  images: {
    unoptimized: true,
  },
};

const withMDX = createMDX({
  options: {
    // String form works with Turbopack; same config is used in production.
    // @see https://nextjs.org/docs/app/guides/mdx#using-plugins-with-turbopack
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [],
  },
});

export default withMDX(nextConfig);
