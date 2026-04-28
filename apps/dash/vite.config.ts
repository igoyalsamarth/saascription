import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Pure client SPA: TanStack Start SPA mode emits static files under `dist/client`.
 * Deploy that folder to any static host (Cloudflare Pages, S3, etc.) — no Worker/runtime server.
 */
const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tanstackStart({
      spa: {
        enabled: true,
        prerender: {
          crawlLinks: true,
        },
      },
    }),
    tailwindcss(),
    viteReact(),
    devtools(),
  ],
});

export default config;
