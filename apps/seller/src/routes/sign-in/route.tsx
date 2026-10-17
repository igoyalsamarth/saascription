import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  component: SignInLayout,
});

function SignInLayout() {
  return <Outlet />;
}
