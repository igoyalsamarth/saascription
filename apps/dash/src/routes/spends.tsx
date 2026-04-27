import { createFileRoute } from "@tanstack/react-router";

import { SpendsAnalytics } from "../components/spends-analytics";

export const Route = createFileRoute("/spends")({
  component: SpendsRoute,
});

function SpendsRoute() {
  return <SpendsAnalytics />;
}
