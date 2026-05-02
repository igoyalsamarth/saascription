import ky from "ky";

const defaultBase = "http://localhost:8787/api/v1";
const baseUrl = `${(import.meta.env.VITE_API_URL ?? defaultBase).replace(/\/?$/, "")}/`;

let getToken: (() => Promise<string | null>) | null = null;

/** Wired from `QueryProvider` under `ClerkProvider` — never call `useAuth` inside ky hooks. */
export function setApiTokenGetter(fn: (() => Promise<string | null>) | null) {
  getToken = fn;
}

export const api = ky.create({
  baseUrl,
  hooks: {
    beforeRequest: [
      async ({ request }) => {
        const tokenFn = getToken;
        if (!tokenFn) {
          return;
        }
        const token = await tokenFn();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
  },
});
