import { buttonVariants } from "@saascription/ui";
import { Link, useNavigate } from "@tanstack/react-router";

import { useSellerListing, useUpdateSellerSaas } from "@/services/listings";

import { ListingForm } from "./listing-form";

export function EditSaasPage({ id }: { id: string }) {
  const listing = useSellerListing(id);
  const updateSaas = useUpdateSellerSaas();
  const navigate = useNavigate();

  if (listing.isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  if (listing.isError || !listing.data) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 bg-muted/30 px-4">
        <p className="text-sm text-destructive">
          {listing.error instanceof Error
            ? listing.error.message
            : "Could not load this product."}
        </p>
        <Link
          to="/listings"
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          Back to listings
        </Link>
      </div>
    );
  }

  const product = listing.data;
  const description =
    product.status === "published"
      ? "This listing is live. Saving sends it back to review until it is published again."
      : "This listing is in review. Saving keeps it in review.";

  return (
    <ListingForm
      key={product.id}
      title={`Edit ${product.name}`}
      description={description}
      submitLabel="Save for review"
      pendingLabel="Saving…"
      initial={product}
      isPending={updateSaas.isPending}
      onSubmit={async (input) => {
        await updateSaas.mutateAsync({ id: product.id, ...input });
        void navigate({ to: "/listings" });
      }}
    />
  );
}
