import { decryptSecret, encryptSecret, signState, verifyState } from "./crypto";

export const GMAIL_READONLY_SCOPE =
  "https://www.googleapis.com/auth/gmail.readonly";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

export type OAuthStatePayload = {
  workspaceId: string;
  userId: string;
  nonce: string;
  exp: number;
};

export type GoogleTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
};

export type GoogleUserInfo = {
  email: string;
  verified_email?: boolean;
};

function getGoogleClientId(env: CloudflareBindings): string {
  if (!env.GOOGLE_OAUTH_CLIENT_ID) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID");
  }
  return env.GOOGLE_OAUTH_CLIENT_ID;
}

function getGoogleClientSecret(env: CloudflareBindings): string {
  if (!env.GOOGLE_OAUTH_CLIENT_SECRET) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_SECRET");
  }
  return env.GOOGLE_OAUTH_CLIENT_SECRET;
}

export async function createOAuthState(
  env: CloudflareBindings,
  workspaceId: string,
  userId: string,
): Promise<string> {
  const payload: OAuthStatePayload = {
    workspaceId,
    userId,
    nonce: crypto.randomUUID(),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const payloadB64 = btoa(JSON.stringify(payload));
  const sig = await signState(payloadB64, env.GMAIL_TOKEN_ENCRYPTION_KEY);
  return `${payloadB64}.${sig}`;
}

export async function parseOAuthState(
  env: CloudflareBindings,
  state: string,
): Promise<OAuthStatePayload | null> {
  const [payloadB64, sig] = state.split(".");
  if (!payloadB64 || !sig) {
    return null;
  }
  const valid = await verifyState(
    payloadB64,
    sig,
    env.GMAIL_TOKEN_ENCRYPTION_KEY,
  );
  if (!valid) {
    return null;
  }
  try {
    const payload = JSON.parse(atob(payloadB64)) as OAuthStatePayload;
    if (!payload.workspaceId || !payload.userId || !payload.exp) {
      return null;
    }
    if (Date.now() > payload.exp) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function buildGoogleAuthUrl(
  env: CloudflareBindings,
  redirectUri: string,
  state: string,
): string {
  const params = new URLSearchParams({
    client_id: getGoogleClientId(env),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_READONLY_SCOPE,
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeCodeForTokens(
  env: CloudflareBindings,
  code: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    code,
    client_id: getGoogleClientId(env),
    client_secret: getGoogleClientSecret(env),
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${res.status} ${text}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

export async function refreshAccessToken(
  env: CloudflareBindings,
  refreshToken: string,
): Promise<GoogleTokenResponse> {
  const body = new URLSearchParams({
    client_id: getGoogleClientId(env),
    client_secret: getGoogleClientSecret(env),
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${res.status} ${text}`);
  }

  return (await res.json()) as GoogleTokenResponse;
}

export async function fetchGoogleUserEmail(
  accessToken: string,
): Promise<string> {
  const res = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google userinfo failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as GoogleUserInfo;
  if (!data.email) {
    throw new Error("Google account has no email");
  }
  return data.email;
}

export async function encryptRefreshToken(
  env: CloudflareBindings,
  refreshToken: string,
): Promise<string> {
  return encryptSecret(refreshToken, env.GMAIL_TOKEN_ENCRYPTION_KEY);
}

export async function decryptRefreshToken(
  env: CloudflareBindings,
  refreshTokenEnc: string,
): Promise<string> {
  return decryptSecret(refreshTokenEnc, env.GMAIL_TOKEN_ENCRYPTION_KEY);
}
