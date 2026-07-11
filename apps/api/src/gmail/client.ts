import { getValidAccessToken } from "./token-store";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

export type GmailMessageListResponse = {
  messages?: Array<{ id: string; threadId: string }>;
  nextPageToken?: string;
  resultSizeEstimate?: number;
};

export type GmailHeader = { name: string; value: string };

export type GmailMessageMetadata = {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: GmailHeader[];
    mimeType?: string;
    body?: { data?: string };
    parts?: Array<{
      mimeType?: string;
      body?: { data?: string };
      parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
    }>;
  };
};

export type GmailMessageRef = {
  id: string;
  threadId: string;
};

function decodeBase64Url(data: string): string {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function getHeader(
  message: GmailMessageMetadata,
  name: string,
): string | null {
  const headers = message.payload?.headers ?? [];
  const found = headers.find(
    (h) => h.name.toLowerCase() === name.toLowerCase(),
  );
  return found?.value ?? null;
}

export function extractPlainTextBody(message: GmailMessageMetadata): string {
  const parts: string[] = [];

  function walk(
    node:
      | {
          mimeType?: string;
          body?: { data?: string };
          parts?: Array<{ mimeType?: string; body?: { data?: string } }>;
        }
      | null
      | undefined,
  ) {
    if (!node) {
      return;
    }
    if (node.mimeType === "text/plain" && node.body?.data) {
      parts.push(decodeBase64Url(node.body.data));
      return;
    }
    if (
      node.mimeType === "text/html" &&
      node.body?.data &&
      parts.length === 0
    ) {
      const html = decodeBase64Url(node.body.data);
      parts.push(stripHtml(html));
      return;
    }
    for (const child of node.parts ?? []) {
      walk(child);
    }
    if (!node.parts?.length && node.body?.data && parts.length === 0) {
      parts.push(decodeBase64Url(node.body.data));
    }
  }

  walk(message.payload);
  if (parts.length === 0 && message.snippet) {
    return message.snippet;
  }
  return parts.join("\n\n").trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export class GmailClient {
  constructor(private accessToken: string) {}

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${GMAIL_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gmail API ${path} failed: ${res.status} ${text}`);
    }
    return (await res.json()) as T;
  }

  listMessages(options: {
    query: string;
    pageToken?: string;
    maxResults?: number;
  }): Promise<GmailMessageListResponse> {
    const params = new URLSearchParams({
      q: options.query,
      maxResults: String(options.maxResults ?? 500),
    });
    if (options.pageToken) {
      params.set("pageToken", options.pageToken);
    }
    return this.request<GmailMessageListResponse>(`/messages?${params}`);
  }

  getMessageMetadata(messageId: string): Promise<GmailMessageMetadata> {
    const params = new URLSearchParams({
      format: "metadata",
      metadataHeaders: "From",
    });
    params.append("metadataHeaders", "Subject");
    params.append("metadataHeaders", "Date");
    return this.request<GmailMessageMetadata>(
      `/messages/${messageId}?${params}`,
    );
  }

  getMessageFull(messageId: string): Promise<GmailMessageMetadata> {
    return this.request<GmailMessageMetadata>(
      `/messages/${messageId}?format=full`,
    );
  }
}

export async function createGmailClient(
  db: D1Database,
  env: CloudflareBindings,
  workspaceId: string,
): Promise<GmailClient> {
  const { accessToken } = await getValidAccessToken(db, env, workspaceId);
  return new GmailClient(accessToken);
}
