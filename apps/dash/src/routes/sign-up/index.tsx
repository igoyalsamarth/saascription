import { createFileRoute } from "@tanstack/react-router";

import { SignUpPage } from "./-sign-up-view";

export const Route = createFileRoute("/sign-up/")({
  component: SignUpPage,
});
