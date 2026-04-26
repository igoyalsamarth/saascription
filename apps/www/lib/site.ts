/** Display name (metadata, JSON-LD, etc.). */
export const siteName = "Saascription";

/** Web app — sign in and product UI. */
export const appSignInUrl = "https://app.saascription.co";

/**
 * Used for absolute URLs in metadata (Open Graph, canonical, etc.).
 * Set in production, e.g. `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`
 */
export function getSiteUrl(): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) {
    return env.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}
