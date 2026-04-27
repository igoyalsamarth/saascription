import { createFileRoute } from "@tanstack/react-router";

import { SubscriptionsPage } from "../components/subscriptions-page";

export const Route = createFileRoute("/subs")({
  component: SubsRoute,
});

function SubsRoute() {
  return <SubscriptionsPage />;
}
