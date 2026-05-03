import {
  ArrowRight01Icon,
  Calendar01Icon,
  CloudIcon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  Button,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarTrigger,
} from "@saascription/ui";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Label,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import { type SpendsMonthsWindow, useSpendsAnalytics } from "@/services/spends";
import { useUserMe } from "@/services/user";

import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

function formatSpendCompactUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return "$0";
  }
  if (n >= 1000) {
    const k = n / 1000;
    const digits = k >= 10 ? 0 : 1;
    return `$${k.toFixed(digits)}k`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

const areaConfig: ChartConfig = {
  spend: { label: "Spend", color: "var(--color-chart-1)" },
};

const categoryChartConfig = {
  software: { label: "Software & SaaS", color: "var(--color-chart-1)" },
  productivity: { label: "Productivity", color: "var(--color-chart-4)" },
  infra: { label: "Infrastructure", color: "var(--color-chart-2)" },
  other: { label: "Other", color: "var(--color-chart-5)" },
} satisfies ChartConfig;

export function SpendsAnalytics() {
  const { data: user } = useUserMe();
  const [months, setMonths] = useState<SpendsMonthsWindow>(6);
  const {
    data: spends,
    isPending: spendsPending,
    isError: spendsError,
    error: spendsErr,
  } = useSpendsAnalytics(months);

  const rangeLabel =
    months === 3
      ? "Last 3 months"
      : months === 12
        ? "Last 12 months"
        : "Last 6 months";

  const currencyFmt = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
    [],
  );

  const userLabel = user?.id
    ? `User ID: ${user.id.length > 20 ? `${user.id.slice(0, 10)}…` : user.id}`
    : "Signed in";

  if (spendsPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading spends…</p>
      </div>
    );
  }

  if (spendsError || !spends) {
    const message =
      spendsErr instanceof Error ? spendsErr.message : "Could not load spends.";
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

  const categoryDonut = spends.categoryBreakdown;
  const monthlySpendSeries = spends.spendByMonth;
  const highestSpends = spends.highestSpends;
  const mom = spends.monthOverMonthPercentChange;

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
              Spends &amp; analytics
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Track your monthly expenses and AI-driven savings ({userLabel})
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
                  setMonths(3);
                }}
              >
                Last 3 months
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setMonths(6);
                }}
              >
                Last 6 months
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setMonths(12);
                }}
              >
                Last 12 months
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
        <section className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                <div>
                  <CardTitle>Monthly spend</CardTitle>
                  <CardDescription>Recurring and usage-based</CardDescription>
                </div>
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-foreground sm:text-3xl">
                    {currencyFmt.format(spends.totalMonthlySpend)}
                  </span>
                  {mom != null ? (
                    <Badge
                      variant="secondary"
                      className="w-fit border-transparent bg-primary/10 text-primary"
                    >
                      {mom >= 0 ? "+" : ""}
                      {mom}% vs prior month
                    </Badge>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={areaConfig}
                className="min-h-[240px] w-full"
                initialDimension={{ width: 640, height: 240 }}
              >
                <AreaChart
                  data={monthlySpendSeries}
                  margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    className="stroke-border/50"
                    strokeDasharray="3 3"
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    className="text-[0.65rem] text-muted-foreground"
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent indicator="line" />}
                  />
                  <Area
                    name="spend"
                    dataKey="spend"
                    type="monotone"
                    fill="var(--color-spend, var(--color-chart-1))"
                    fillOpacity={0.15}
                    stroke="var(--color-spend, var(--color-chart-1))"
                    strokeWidth={2.5}
                    dot={{
                      r: 3,
                      fill: "var(--color-spend, var(--color-chart-1))",
                    }}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-primary-foreground">
                Monthly savings
              </CardTitle>
              <CardDescription className="text-primary-foreground/85">
                AI-surfaced opportunities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl font-semibold tabular-nums text-primary-foreground sm:text-3xl">
                {currencyFmt.format(spends.savings.monthlySavingsUsd)}
              </p>
              {spends.savings.cancelledSubscriptionsCount > 0 ? (
                <Badge className="border border-primary-foreground/30 bg-primary-foreground/15 px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-primary-foreground">
                  {spends.savings.cancelledSubscriptionsCount} subscription
                  {spends.savings.cancelledSubscriptionsCount === 1 ? "" : "s"}{" "}
                  cancelled
                </Badge>
              ) : null}
              {spends.savings.opportunities.map((op) => (
                <div
                  key={op.title}
                  className="flex items-center justify-between gap-2 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-primary-foreground">
                      {op.title}
                    </p>
                    <p className="text-[0.65rem] text-primary-foreground/80">
                      {op.subtitle}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 text-primary-foreground hover:bg-primary-foreground/15"
                    aria-label="View opportunity"
                  >
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="size-3.5"
                    />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spend by category</CardTitle>
              <CardDescription>
                Estimated mix from active subscriptions (by vendor name)
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              {categoryDonut.length === 0 ? (
                <p className="w-full py-8 text-center text-sm text-muted-foreground">
                  Add active subscriptions to see category mix.
                </p>
              ) : (
                <>
                  <ChartContainer
                    config={categoryChartConfig}
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
                        data={categoryDonut}
                        nameKey="name"
                        dataKey="value"
                        innerRadius={54}
                        outerRadius={82}
                        strokeWidth={0}
                        paddingAngle={1}
                      >
                        {categoryDonut.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={`var(--color-${entry.key})`}
                            className="stroke-transparent"
                          />
                        ))}
                        <Label
                          content={({ viewBox }) => {
                            if (
                              !viewBox ||
                              !("cx" in viewBox) ||
                              !("cy" in viewBox)
                            ) {
                              return null;
                            }
                            const { cx, cy } = viewBox as {
                              cx: number;
                              cy: number;
                            };
                            return (
                              <text
                                x={cx}
                                y={cy}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                className="fill-foreground"
                              >
                                <tspan
                                  x={cx}
                                  dy="-0.35em"
                                  className="text-[0.65rem] fill-muted-foreground"
                                >
                                  Total / mo
                                </tspan>
                                <tspan
                                  x={cx}
                                  dy="1.15em"
                                  className="text-lg font-semibold fill-foreground"
                                >
                                  {formatSpendCompactUsd(
                                    spends.totalMonthlySpend,
                                  )}
                                </tspan>
                              </text>
                            );
                          }}
                        />
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <ul className="w-full min-w-0 space-y-2.5 text-xs sm:max-w-52">
                    {categoryDonut.map((c) => (
                      <li
                        key={c.name}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2 shrink-0 rounded-sm"
                            style={{
                              backgroundColor: `var(--color-${c.key})`,
                            }}
                            aria-hidden
                          />
                          <span className="truncate text-foreground">
                            {c.name}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums text-muted-foreground">
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
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle>Highest spends</CardTitle>
                <CardDescription>Top line items this period</CardDescription>
              </div>
              <Link
                to="/spends"
                className={buttonVariants({
                  variant: "link",
                  className: "h-auto p-0 text-xs",
                })}
              >
                View all
              </Link>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
                      <th className="pb-2 pr-2 font-medium">Service</th>
                      <th className="hidden pb-2 pr-2 font-medium sm:table-cell">
                        Category
                      </th>
                      <th className="pb-2 pr-2 font-medium">Renewal</th>
                      <th className="pb-2 text-end font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highestSpends.length === 0 ? (
                      <tr className="border-b border-border/60 last:border-0">
                        <td
                          colSpan={4}
                          className="py-8 text-center text-muted-foreground"
                        >
                          No active subscriptions to rank yet.
                        </td>
                      </tr>
                    ) : (
                      highestSpends.map((row) => (
                        <tr
                          key={row.subscriptionId}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-3 pr-2 align-top">
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                                <HugeiconsIcon
                                  icon={CloudIcon}
                                  className="size-3.5"
                                />
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium text-foreground">
                                  {row.service}
                                </p>
                                <p className="text-[0.65rem] text-muted-foreground">
                                  {row.sub}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="hidden py-3 pr-2 align-top text-foreground sm:table-cell">
                            {row.category}
                          </td>
                          <td className="max-w-36 py-3 pr-2 align-top">
                            {row.renewalUrgent ? (
                              <span
                                className={cn(
                                  "inline-block rounded-full px-2 py-0.5 text-[0.6rem] font-medium",
                                  "bg-amber-500/15 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
                                )}
                              >
                                {row.renewalLabel}
                              </span>
                            ) : (
                              <span className="text-[0.65rem] text-muted-foreground sm:text-xs">
                                {row.renewalLabel}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap py-3 text-end align-top text-xs font-medium tabular-nums text-foreground">
                            {currencyFmt.format(row.cost)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
