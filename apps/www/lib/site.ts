/** Display name (metadata, JSON-LD, etc.). */
export const siteName = "Saascription";

/** Web app — sign in and product UI. */
export const appSignInUrl = "https://dash.saascription.app";

/** Dash app sign-in page (absolute URL for cross-origin links from the marketing site). */
export const appDashSignInUrl = `${appSignInUrl}/sign-in`;

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

/**
 * GA4 measurement ID (`G-XXXXXXXX`). Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` when you want gtag loaded.
 */
export function getGaMeasurementId(): string | undefined {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  return id || undefined;
}
