import { createFileRoute } from "@tanstack/react-router";

import { EditSaasPage } from "@/components/edit-saas-page";

export const Route = createFileRoute("/listings_/$id/edit")({
  component: EditListingRoute,
});

function EditListingRoute() {
  const { id } = Route.useParams();
  return <EditSaasPage id={id} />;
}
