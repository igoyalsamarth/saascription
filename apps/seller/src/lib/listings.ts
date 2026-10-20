export const LISTING_CATEGORIES = [
  { slug: "engineering", label: "Engineering" },
  { slug: "collaboration", label: "Collaboration" },
  { slug: "design", label: "Design" },
  { slug: "productivity", label: "Productivity" },
  { slug: "finance", label: "Finance" },
  { slug: "marketing", label: "Marketing" },
  { slug: "infrastructure", label: "Infrastructure" },
  { slug: "security", label: "Security" },
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number]["slug"];

export type BillingInterval = "monthly" | "yearly";

export type ListingPackage = {
  name: string;
  amountCents: number;
  currency: string;
  billingInterval: BillingInterval;
};

export type ListingStatus = "review" | "published";

const KNOWN_CATEGORY_SLUGS = new Set<string>(
  LISTING_CATEGORIES.map((category) => category.slug),
);

const packagePrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function categoryLabel(slug: string) {
  return (
    LISTING_CATEGORIES.find((category) => category.slug === slug)?.label ?? slug
  );
}

export function isKnownCategory(value: string): value is ListingCategory {
  return KNOWN_CATEGORY_SLUGS.has(value);
}

export function formatPackagePrice(pkg: {
  amountCents: number;
  billingInterval: BillingInterval;
}) {
  const amount = packagePrice.format(pkg.amountCents / 100);
  return pkg.billingInterval === "yearly" ? `${amount}/yr` : `${amount}/mo`;
}
