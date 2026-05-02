import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/configure")({
  component: ConfigureLayout,
});

function ConfigureLayout() {
  return <Outlet />;
}
