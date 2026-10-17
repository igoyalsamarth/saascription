import { HTTPError } from "ky";

export async function readApiError(error: unknown, fallback: string) {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.clone().json()) as { error?: string };
      if (typeof body.error === "string" && body.error.trim()) {
        return body.error;
      }
    } catch {
      // The response body was not JSON.
    }
  }
  return fallback;
}
