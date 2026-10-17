import { createFileRoute } from "@tanstack/react-router";

import { AddSaasPage } from "@/components/add-saas-page";

export const Route = createFileRoute("/add")({
  component: AddSaasPage,
});
