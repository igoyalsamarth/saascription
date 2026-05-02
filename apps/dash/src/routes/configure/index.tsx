import { createFileRoute } from "@tanstack/react-router";

import { ConfigureHubPage } from "../../components/configure-hub";

export const Route = createFileRoute("/configure/")({
  component: ConfigureIndexRoute,
});

function ConfigureIndexRoute() {
  return <ConfigureHubPage />;
}
