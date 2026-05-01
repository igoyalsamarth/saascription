/** Subset of Clerk `User` from `user.created` / `user.updated` webhooks. */
export type ClerkEmailAddress = {
  id: string;
  email_address: string;
  verification?: { status?: string };
};

export type ClerkUserData = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string | null;
  profile_image_url: string | null;
  primary_email_address_id: string | null;
  email_addresses?: ClerkEmailAddress[];
};

export type ClerkWebhookEvent = {
  type: string;
  data: ClerkUserData;
};
