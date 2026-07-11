import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GMAIL_OAUTH_STATE_KEY } from "@/services/sync";

export const Route = createFileRoute("/api/auth/google/callback")({
  component: GoogleOAuthCallbackRoute,
});

function GoogleOAuthCallbackRoute() {
  const [message, setMessage] = useState("Completing Gmail connection…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");

    if (window.opener) {
      if (error) {
        window.opener.postMessage(
          { type: "gmail-oauth-callback", error },
          window.location.origin,
        );
        setMessage("Connection cancelled. You can close this window.");
      } else if (code && state) {
        const expectedState = sessionStorage.getItem(GMAIL_OAUTH_STATE_KEY);
        if (expectedState && expectedState !== state) {
          window.opener.postMessage(
            {
              type: "gmail-oauth-callback",
              error: "OAuth state mismatch",
            },
            window.location.origin,
          );
          setMessage("Security check failed. You can close this window.");
        } else {
          window.opener.postMessage(
            { type: "gmail-oauth-callback", code, state },
            window.location.origin,
          );
          setMessage("Connected. You can close this window.");
        }
        window.close();
      } else {
        window.opener.postMessage(
          {
            type: "gmail-oauth-callback",
            error: "Missing OAuth response",
          },
          window.location.origin,
        );
        setMessage("Something went wrong. You can close this window.");
      }
    } else {
      setMessage("You can close this window and return to Saascription.");
    }
  }, []);

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
