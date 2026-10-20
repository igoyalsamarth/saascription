import { useNavigate } from "@tanstack/react-router";

import { useCreateSellerSaas } from "@/services/listings";

import { ListingForm } from "./listing-form";

export function AddSaasPage() {
  const createSaas = useCreateSellerSaas();
  const navigate = useNavigate();

  return (
    <ListingForm
      title="Add SaaS"
      description="New products stay in review until they are published."
      submitLabel="Submit for review"
      pendingLabel="Saving…"
      isPending={createSaas.isPending}
      onSubmit={async (input) => {
        await createSaas.mutateAsync(input);
        void navigate({ to: "/listings" });
      }}
    />
  );
}
