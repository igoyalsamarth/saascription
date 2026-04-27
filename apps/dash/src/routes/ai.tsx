import { createFileRoute } from "@tanstack/react-router";

import { AiOptimizationPage } from "../components/ai-optimization-page";

export const Route = createFileRoute("/ai")({
  component: AiRoute,
});

function AiRoute() {
  return <AiOptimizationPage />;
}
