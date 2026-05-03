import {
  Calendar01Icon,
  Dollar01Icon,
  LayerIcon,
  Notification01Icon,
  PiggyBankIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarTrigger,
} from "@saascription/ui";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { useDashboardOverview } from "@/services/dashboard";
import { useUserMe } from "@/services/user";

import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

const usdWhole = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const chartKeys = {
  software: { label: "Software", color: "var(--color-chart-1)" },
  cloud: { label: "Cloud", color: "var(--color-chart-2)" },
  design: { label: "Design", color: "var(--color-chart-3)" },
  productivity: { label: "Productivity", color: "var(--color-chart-4)" },
  other: { label: "Other", color: "var(--color-chart-5)" },
} satisfies ChartConfig;

const areaConfig: ChartConfig = {
  spend: { label: "Spend", color: "var(--color-chart-1)" },
};

const sparkConfig: ChartConfig = {
  v: { label: "Trend", color: "var(--color-chart-1)" },
};

export function DashboardOverview() {
  const { data: user } = useUserMe();
  const {
    data: dashboard,
    isPending: dashboardPending,
    isError: dashboardError,
    error: dashboardErr,
  } = useDashboardOverview();
  const [spendWindow, setSpendWindow] = useState<"6m" | "1y">("6m");
  const [rangeLabel, setRangeLabel] = useState("Last 30 days");

  const userLabel = user?.id
    ? `User ID: ${user.id.length > 20 ? `${user.id.slice(0, 10)}…` : user.id}`
    : "Signed in";

  if (dashboardPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading dashboard…</p>
      </div>
    );
  }

  if (dashboardError || !dashboard) {
    const message =
      dashboardErr instanceof Error
        ? dashboardErr.message
        : "Could not load dashboard.";
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 bg-muted/30 px-4">
        <p className="text-sm text-destructive">{message}</p>
        <p className="text-center text-xs text-muted-foreground">
          Try refreshing. If this persists, check that the API is running and
          VITE_API_URL is correct.
        </p>
      </div>
    );
  }

  const categoryData = dashboard.categoryBreakdown;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <header
        className={cn(
          DASH_STICKY_HEADER,
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          DASH_STICKY_HEADER_PAD,
        )}
      >
        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Dashboard overview
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your subscription ecosystem at a glance ({userLabel})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifications"
          >
            <HugeiconsIcon
              icon={Notification01Icon}
              className="size-4 text-foreground"
            />
            <span
              className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background"
              aria-hidden
            />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "inline-flex gap-1.5",
              })}
            >
              <HugeiconsIcon
                icon={Calendar01Icon}
                className="size-3.5 text-muted-foreground"
              />
              {rangeLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem
                onClick={() => {
                  setRangeLabel("Last 30 days");
                }}
              >
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRangeLabel("Last 90 days");
                }}
              >
                Last 90 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div
        className={cn(
          DASH_SCROLL_CONTENT,
          "mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6",
        )}
      >
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Active subscriptions</CardTitle>
                <CardDescription>Across all workspaces</CardDescription>
              </div>
              <span className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
                <HugeiconsIcon icon={LayerIcon} className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {dashboard.activeSubscriptionsCount}
              </p>
              {dashboard.activeSubscriptionsDeltaSinceLastMonth > 0 ? (
                <Badge
                  variant="secondary"
                  className="mt-2 w-fit text-[0.625rem]"
                >
                  {`+${dashboard.activeSubscriptionsDeltaSinceLastMonth} in the last 30 days`}
                </Badge>
              ) : (
                <p className="mt-2 text-[0.625rem] text-muted-foreground">
                  No new subscriptions in the last 30 days
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Total monthly spend</CardTitle>
                <CardDescription>Before tax</CardDescription>
              </div>
              <span className="flex size-9 items-center justify-center rounded-md border border-border bg-muted/50 text-muted-foreground">
                <HugeiconsIcon icon={Dollar01Icon} className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                {usdWhole.format(dashboard.totalMonthlySpend)}
              </p>
              <div className="mt-2 h-8 w-full">
                <ChartContainer
                  config={sparkConfig}
                  className="aspect-6/1 w-full"
                  initialDimension={{ width: 200, height: 32 }}
                >
                  <AreaChart
                    data={dashboard.monthlySpendSparkline}
                    margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
                  >
                    <Area
                      name="v"
                      dataKey="v"
                      type="monotone"
                      fill="var(--color-v, var(--color-chart-1))"
                      fillOpacity={0.2}
                      stroke="var(--color-v, var(--color-chart-1))"
                      strokeWidth={1.5}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground sm:col-span-2 lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-primary-foreground">
                  Lifetime savings
                </CardTitle>
                <CardDescription className="text-primary-foreground/85">
                  Optimized by AI recommendations
                </CardDescription>
              </div>
              <span className="flex size-9 items-center justify-center rounded-md border border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground">
                <HugeiconsIcon icon={PiggyBankIcon} className="size-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold tabular-nums text-primary-foreground sm:text-3xl">
                {usdWhole.format(dashboard.lifetimeSavings)}
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 sm:items-center">
              <div>
                <CardTitle>Spend overview</CardTitle>
                <CardDescription>
                  Recurring and usage-based charges
                </CardDescription>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={buttonVariants({
                    variant: "ghost",
                    size: "sm",
                    className: "inline-flex gap-1",
                  })}
                >
                  {spendWindow === "6m" ? "Last 6 months" : "Last 12 months"}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem onClick={() => setSpendWindow("6m")}>
                    Last 6 months
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSpendWindow("1y")}>
                    Last 12 months
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={areaConfig}
                className="min-h-[240px] w-full"
                initialDimension={{ width: 600, height: 240 }}
              >
                <AreaChart
                  data={dashboard.spendByMonth}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    className="stroke-border/50"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    className="text-[0.625rem] text-muted-foreground"
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    name="spend"
                    dataKey="spend"
                    type="monotone"
                    fill="var(--color-spend, var(--color-chart-1))"
                    fillOpacity={0.12}
                    stroke="var(--color-spend, var(--color-chart-1))"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Next renewals</CardTitle>
              <CardDescription>Upcoming subscription charges</CardDescription>
            </CardHeader>
            <CardContent className="space-y-0">
              {dashboard.upcomingRenewals.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No upcoming renewals with a next billing date.
                </p>
              ) : (
                dashboard.upcomingRenewals.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 border-b border-border/60 py-3 last:border-b-0"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <HugeiconsIcon
                          icon={SparklesIcon}
                          className="size-3.5"
                        />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-foreground">
                          {r.name}
                        </p>
                        <p className="text-[0.625rem] text-muted-foreground">
                          {r.inDays === 0
                            ? "Renews today"
                            : `In ${r.inDays} day${r.inDays === 1 ? "" : "s"}`}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                      {usdWhole.format(r.amount)}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Link
                to="/"
                className={buttonVariants({
                  variant: "secondary",
                  className: "w-full",
                })}
              >
                View calendar
              </Link>
            </CardFooter>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spend by category</CardTitle>
              <CardDescription>
                Share of estimated monthly spend (from vendor names)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {categoryData.length === 0 ? (
                <p className="w-full py-8 text-center text-sm text-muted-foreground">
                  Add active subscriptions to see a category breakdown.
                </p>
              ) : (
                <>
                  <ChartContainer
                    config={chartKeys}
                    className="mx-auto min-h-[200px] w-[200px] sm:mx-0"
                    initialDimension={{ width: 200, height: 200 }}
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
                        innerRadius={52}
                        outerRadius={80}
                        strokeWidth={0}
                        paddingAngle={1}
                      >
                        {categoryData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={`var(--color-${entry.key})`}
                            className="stroke-transparent"
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <ul className="w-full min-w-0 space-y-2 text-xs sm:max-w-48">
                    {categoryData.map((c) => (
                      <li
                        key={c.name}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2 shrink-0 rounded-sm"
                            style={{
                              backgroundColor: `var(--color-${c.key}, var(--color-chart-1))`,
                            }}
                            aria-hidden
                          />
                          <span className="truncate text-foreground">
                            {c.name}
                          </span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {c.value}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest events on your account</CardDescription>
              </div>
              <Link
                to="/"
                className={buttonVariants({
                  variant: "link",
                  className: "h-auto p-0 text-xs",
                })}
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              {dashboard.recentActivity ? (
                <div className="flex gap-3 rounded-md border border-border/80 bg-muted/20 p-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <HugeiconsIcon
                      icon={Notification01Icon}
                      className="size-3.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground">
                      {dashboard.recentActivity.title}
                    </p>
                    <p className="text-[0.625rem] text-muted-foreground">
                      {dashboard.recentActivity.subtitle}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No subscription activity yet.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
