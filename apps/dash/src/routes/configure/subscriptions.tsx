import { createFileRoute } from "@tanstack/react-router";

import { ConfigureSubscriptionsPage } from "../../components/configure-subscriptions";

export const Route = createFileRoute("/configure/subscriptions")({
  component: ConfigureSubscriptionsRoute,
});

function ConfigureSubscriptionsRoute() {
  return <ConfigureSubscriptionsPage />;
}
