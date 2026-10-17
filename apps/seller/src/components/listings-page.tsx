import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  cn,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saascription/ui";
import { Link } from "@tanstack/react-router";

import { categoryLabel } from "@/lib/listings";
import { SELLER_SCROLL_CONTENT } from "@/lib/page-layout";
import { useSellerListings } from "@/services/listings";

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
  const {
    data: listings = [],
    isPending,
    isError,
    error,
  } = useSellerListings();

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
        description="SaaS products in your catalog"
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
          "mx-auto w-full max-w-7xl p-4 sm:p-6",
        )}
      >
        <Card>
          <CardContent className="px-0">
            {listings.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
                <p className="text-sm font-medium">No products listed yet</p>
                <p className="max-w-sm text-xs text-muted-foreground">
                  Add a SaaS product and it will show up here.
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
                    <TableHead className="text-right">Subscribers</TableHead>
                    <TableHead className="text-right">
                      Monthly revenue
                    </TableHead>
                    <TableHead className="pr-4 text-right">Listed</TableHead>
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
                        <div className="flex flex-wrap gap-1">
                          {listing.categories.map((slug) => (
                            <Badge key={slug} variant="secondary">
                              {categoryLabel(slug)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {countFormat.format(listing.subscribers)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {usd.format(listing.monthlyRevenue)}
                      </TableCell>
                      <TableCell className="pr-4 text-right text-muted-foreground">
                        {listedOn.format(new Date(listing.createdAt))}
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
