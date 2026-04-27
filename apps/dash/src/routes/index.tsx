import { createFileRoute } from "@tanstack/react-router";

import { DashboardOverview } from "../components/dashboard-overview";

export const Route = createFileRoute("/")({
  component: DashboardRoute,
});

function DashboardRoute() {
  return <DashboardOverview />;
}
