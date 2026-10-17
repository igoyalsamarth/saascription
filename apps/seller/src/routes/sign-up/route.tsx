import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up")({
  component: SignUpLayout,
});

function SignUpLayout() {
  return <Outlet />;
}
