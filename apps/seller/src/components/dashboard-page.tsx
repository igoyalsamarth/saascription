import {
  Add01Icon,
  Dollar01Icon,
  LayerIcon,
  UserMultipleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  cn,
} from "@saascription/ui";
import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";

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

const revenueConfig = {
  monthlyRevenue: { label: "Monthly revenue", color: "var(--color-chart-1)" },
} satisfies ChartConfig;

const categoryColor = {
  engineering: "var(--color-chart-1)",
  collaboration: "var(--color-chart-2)",
  design: "var(--color-chart-3)",
  productivity: "var(--color-chart-4)",
  finance: "var(--color-chart-5)",
  marketing: "var(--color-chart-1)",
  infrastructure: "var(--color-chart-2)",
  security: "var(--color-chart-3)",
} as const;

const categoryConfig = {
  engineering: { label: "Engineering", color: categoryColor.engineering },
  collaboration: {
    label: "Collaboration",
    color: categoryColor.collaboration,
  },
  design: { label: "Design", color: categoryColor.design },
  productivity: { label: "Productivity", color: categoryColor.productivity },
  finance: { label: "Finance", color: categoryColor.finance },
  marketing: { label: "Marketing", color: categoryColor.marketing },
  infrastructure: {
    label: "Infrastructure",
    color: categoryColor.infrastructure,
  },
  security: { label: "Security", color: categoryColor.security },
} satisfies ChartConfig;

export function DashboardPage() {
  const {
    data: listings = [],
    isPending,
    isError,
    error,
  } = useSellerListings();

  const totals = useMemo(() => {
    return listings.reduce(
      (sum, listing) => ({
        subscribers: sum.subscribers + listing.subscribers,
        monthlyRevenue: sum.monthlyRevenue + listing.monthlyRevenue,
      }),
      { subscribers: 0, monthlyRevenue: 0 },
    );
  }, [listings]);

  const revenueByProduct = useMemo(
    () =>
      [...listings]
        .sort((a, b) => b.monthlyRevenue - a.monthlyRevenue)
        .map((listing) => ({
          id: listing.id,
          name: listing.name,
          monthlyRevenue: listing.monthlyRevenue,
          subscribers: listing.subscribers,
          category: listing.categories[0],
        })),
    [listings],
  );

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const listing of listings) {
      for (const slug of listing.categories) {
        counts.set(slug, (counts.get(slug) ?? 0) + 1);
      }
    }
    return [...counts.entries()].map(([key, value]) => ({
      key,
      name: categoryLabel(key),
      value,
    }));
  }, [listings]);

  if (isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-destructive">
          {error instanceof Error
            ? error.message
            : "Could not load your dashboard."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <PageHeader
        title="Dashboard"
        description="Performance of the products you have listed"
        actions={
          <Link
            to="/add"
            className={buttonVariants({ variant: "default", size: "sm" })}
          >
            <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
            Add Product
          </Link>
        }
      />
      <div
        className={cn(
          SELLER_SCROLL_CONTENT,
          "mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6",
        )}
      >
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Listed products"
            hint="In your catalog"
            value={countFormat.format(listings.length)}
            icon={LayerIcon}
          />
          <StatCard
            label="Subscribers"
            hint="Active subscriptions on your products"
            value={countFormat.format(totals.subscribers)}
            icon={UserMultipleIcon}
          />
          <StatCard
            label="Monthly revenue"
            hint="From active subscriptions"
            value={usd.format(totals.monthlyRevenue)}
            icon={Dollar01Icon}
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Revenue by product</CardTitle>
              <CardDescription>Estimated monthly revenue</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueByProduct.length === 0 ? (
                <EmptyChart message="Add a product to see revenue by listing." />
              ) : (
                <ChartContainer
                  config={revenueConfig}
                  className="aspect-auto w-full"
                  style={{
                    height: Math.max(220, revenueByProduct.length * 40),
                  }}
                  initialDimension={{ width: 560, height: 240 }}
                >
                  <BarChart
                    data={revenueByProduct}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={108}
                      tickLine={false}
                      axisLine={false}
                      className="text-[0.625rem]"
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="monthlyRevenue"
                      fill="var(--color-monthlyRevenue, var(--color-chart-1))"
                      radius={4}
                      barSize={14}
                    />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Listings by category</CardTitle>
              <CardDescription>How your catalog is grouped</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
              {categoryData.length === 0 ? (
                <EmptyChart message="Categories appear after you add a product." />
              ) : (
                <>
                  <ChartContainer
                    config={categoryConfig}
                    className="mx-auto aspect-square w-[180px]"
                    initialDimension={{ width: 180, height: 180 }}
                  >
                    <PieChart>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent nameKey="name" hideLabel />
                        }
                      />
                      <Pie
                        data={categoryData}
                        nameKey="name"
                        dataKey="value"
                        innerRadius={48}
                        outerRadius={72}
                        strokeWidth={0}
                        paddingAngle={2}
                      >
                        {categoryData.map((entry) => (
                          <Cell
                            key={entry.key}
                            fill={
                              categoryColor[
                                entry.key as keyof typeof categoryColor
                              ] ?? "var(--color-chart-1)"
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <ul className="w-full min-w-0 space-y-2 text-xs">
                    {categoryData.map((entry) => (
                      <li
                        key={entry.key}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{
                              backgroundColor:
                                categoryColor[
                                  entry.key as keyof typeof categoryColor
                                ] ?? "var(--color-chart-1)",
                            }}
                          />
                          <span className="truncate">{entry.name}</span>
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {entry.value}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle>Top products</CardTitle>
              <CardDescription>Sorted by monthly revenue</CardDescription>
            </div>
            <Link
              to="/listings"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              All listings
            </Link>
          </CardHeader>
          <CardContent className="px-0">
            {listings.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                You have not listed a product yet.
              </p>
            ) : (
              <ul>
                {revenueByProduct.slice(0, 5).map((row) => (
                  <li
                    key={row.id}
                    className="flex items-center justify-between gap-3 border-t border-border/70 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{row.name}</p>
                      <p className="text-[0.625rem] text-muted-foreground">
                        {countFormat.format(row.subscribers)} subscribers
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {row.category ? (
                        <Badge variant="secondary">
                          {categoryLabel(row.category)}
                        </Badge>
                      ) : null}
                      <span className="text-sm font-medium tabular-nums">
                        {usd.format(row.monthlyRevenue)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  label,
  hint,
  value,
  icon,
}: {
  label: string;
  hint: string;
  value: string;
  icon: typeof LayerIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle>{label}</CardTitle>
          <CardDescription>{hint}</CardDescription>
        </div>
        <span className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
          <HugeiconsIcon icon={icon} className="size-4" />
        </span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <p className="flex min-h-40 items-center justify-center text-center text-sm text-muted-foreground">
      {message}
    </p>
  );
}
