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

export function categoryLabel(slug: string) {
  return (
    LISTING_CATEGORIES.find((category) => category.slug === slug)?.label ?? slug
  );
}
