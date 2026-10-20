import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saascription/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { categoryLabel, formatPackagePrice } from "@/lib/listings";
import { SELLER_SCROLL_CONTENT } from "@/lib/page-layout";
import {
  type SellerListing,
  useDeleteSellerSaas,
  usePublishSellerSaas,
  useReviewListings,
  useSellerListings,
} from "@/services/listings";
import { useUserMe } from "@/services/user";

import { PageHeader } from "./page-header";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const countFormat = new Intl.NumberFormat("en-US");

const listedOn = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function ListingsPage() {
  const me = useUserMe();
  const isAdmin = me.data?.user.admin === true;
  const currentUserId = me.data?.user.id;
  const {
    data: listings = [],
    isPending,
    isError,
    error,
  } = useSellerListings();
  const review = useReviewListings(isAdmin);
  const removeListing = useDeleteSellerSaas();
  const publishListing = usePublishSellerSaas();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const othersInReview = (review.data ?? []).filter(
    (listing) => listing.creatorId !== currentUserId,
  );

  async function onDelete(id: string) {
    setActionError(null);
    try {
      await removeListing.mutateAsync(id);
      setConfirmId(null);
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete this listing.",
      );
    }
  }

  async function onPublish(id: string) {
    setActionError(null);
    try {
      await publishListing.mutateAsync(id);
    } catch (publishError) {
      setActionError(
        publishError instanceof Error
          ? publishError.message
          : "Could not publish this listing.",
      );
    }
  }

  if (isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading listings…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Could not load your listings."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <PageHeader
        title="Listings"
        description="Submissions stay in review until they are published"
        actions={
          <Link
            to="/add"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            Add SaaS
          </Link>
        }
      />
      <div
        className={cn(
          SELLER_SCROLL_CONTENT,
          "mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 sm:p-6",
        )}
      >
        {actionError ? (
          <p className="text-sm text-destructive">{actionError}</p>
        ) : null}
        {isAdmin && othersInReview.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Awaiting review</CardTitle>
              <CardDescription>
                Publish a listing when it is ready to appear in the catalog.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {othersInReview.map((listing) => (
                <div
                  key={listing.id}
                  className="flex flex-col gap-3 rounded-md border border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {listing.name}
                    </p>
                    <p className="truncate text-[0.625rem] text-muted-foreground">
                      {listing.creatorEmail ?? "Unknown seller"}
                    </p>
                    <ListingFacts listing={listing} />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={
                      publishListing.isPending &&
                      publishListing.variables === listing.id
                    }
                    onClick={() => {
                      void onPublish(listing.id);
                    }}
                  >
                    Publish
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {isAdmin && review.isError ? (
          <p className="text-sm text-destructive">
            {review.error instanceof Error
              ? review.error.message
              : "Could not load listings in review."}
          </p>
        ) : null}
        <Card>
          <CardContent className="px-0">
            {listings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                <p className="text-sm font-medium">No products listed yet</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Add a SaaS product and it will show up here after you submit
                  it for review.
                </p>
                <Link
                  to="/add"
                  className={buttonVariants({ variant: "default", size: "sm" })}
                >
                  Add SaaS
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Product</TableHead>
                    <TableHead>Categories</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Subscribers</TableHead>
                    <TableHead className="text-right">
                      Monthly revenue
                    </TableHead>
                    <TableHead className="text-right">Listed</TableHead>
                    <TableHead className="pr-4 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listings.map((listing) => (
                    <TableRow key={listing.id}>
                      <TableCell className="pl-4">
                        <div className="flex items-center gap-3">
                          <ProductMark
                            name={listing.name}
                            iconUrl={listing.iconUrl}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {listing.name}
                            </p>
                            {listing.websiteUrl ? (
                              <p className="truncate text-[0.625rem] text-muted-foreground">
                                {listing.websiteUrl.replace(/^https?:\/\//, "")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex max-w-48 flex-wrap gap-1">
                          {listing.categories.length === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            listing.categories.map((slug) => (
                              <Badge key={slug} variant="secondary">
                                {categoryLabel(slug)}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PackageList packages={listing.packages} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={listing.status} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {countFormat.format(listing.subscribers)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {usd.format(listing.monthlyRevenue)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {listedOn.format(new Date(listing.createdAt))}
                      </TableCell>
                      <TableCell className="pr-4">
                        <div className="flex flex-wrap justify-end gap-1">
                          {isAdmin && listing.status === "review" ? (
                            <Button
                              type="button"
                              size="xs"
                              disabled={
                                publishListing.isPending &&
                                publishListing.variables === listing.id
                              }
                              onClick={() => {
                                void onPublish(listing.id);
                              }}
                            >
                              Publish
                            </Button>
                          ) : null}
                          <Link
                            to="/listings/$id/edit"
                            params={{ id: listing.id }}
                            className={buttonVariants({
                              variant: "outline",
                              size: "xs",
                            })}
                          >
                            Edit
                          </Link>
                          {confirmId === listing.id ? (
                            <>
                              <Button
                                type="button"
                                size="xs"
                                variant="destructive"
                                disabled={removeListing.isPending}
                                onClick={() => {
                                  void onDelete(listing.id);
                                }}
                              >
                                Confirm
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="ghost"
                                onClick={() => setConfirmId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <Button
                              type="button"
                              size="xs"
                              variant="ghost"
                              onClick={() => setConfirmId(listing.id)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ListingFacts({ listing }: { listing: SellerListing }) {
  return (
    <p className="mt-1 text-[0.625rem] text-muted-foreground">
      {listing.categories.length > 0
        ? listing.categories.map((slug) => categoryLabel(slug)).join(", ")
        : "No categories"}
      {listing.packages.length > 0
        ? ` · ${listing.packages
            .map((pkg) => `${pkg.name} ${formatPackagePrice(pkg)}`)
            .join(", ")}`
        : ""}
    </p>
  );
}

function PackageList({ packages }: { packages: SellerListing["packages"] }) {
  if (packages.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex max-w-52 flex-col gap-0.5 text-xs">
      {packages.slice(0, 2).map((pkg) => (
        <span key={`${pkg.name}-${pkg.billingInterval}-${pkg.amountCents}`}>
          {pkg.name} · {formatPackagePrice(pkg)}
        </span>
      ))}
      {packages.length > 2 ? (
        <span className="text-muted-foreground">
          +{packages.length - 2} more
        </span>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: SellerListing["status"] }) {
  if (status === "published") {
    return <Badge variant="secondary">Published</Badge>;
  }
  return <Badge variant="outline">In review</Badge>;
}

function ProductMark({ name, iconUrl }: { name: string; iconUrl: string }) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt=""
        className="size-8 shrink-0 rounded-md border border-border object-cover"
      />
    );
  }

  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-medium text-primary">
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}
