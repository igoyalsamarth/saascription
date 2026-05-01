import type { ClerkUserData } from "../types/clerk";

export function resolvePrimaryEmail(data: ClerkUserData): string | null {
  const emails = data.email_addresses ?? [];
  const pid = data.primary_email_address_id;
  if (pid) {
    const match = emails.find((e) => e.id === pid);
    if (match?.email_address) return match.email_address.trim().toLowerCase();
  }
  const verified = emails.find((e) => e.verification?.status === "verified");
  if (verified?.email_address) return verified.email_address.trim().toLowerCase();
  const first = emails[0]?.email_address?.trim().toLowerCase();
  return first ?? null;
}

export function buildDisplayName(data: ClerkUserData): string | null {
  const parts = [data.first_name, data.last_name].filter(Boolean).join(" ").trim();
  if (parts.length > 0) return parts;
  if (data.username) return data.username;
  return null;
}

export function pickImageUrl(data: ClerkUserData): string | null {
  return data.image_url ?? data.profile_image_url ?? null;
}
