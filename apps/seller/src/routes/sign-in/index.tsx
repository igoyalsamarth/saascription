import { createFileRoute } from "@tanstack/react-router";

import { SignInPage } from "./-sign-in-view";

export const Route = createFileRoute("/sign-in/")({
  component: SignInPage,
});
