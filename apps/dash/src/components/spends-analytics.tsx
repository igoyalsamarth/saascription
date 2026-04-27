import { useUser } from "@clerk/clerk-react";
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
import { useState } from "react";
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

import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

const monthlySpendSeries = [
  { month: "Jan", spend: 2100 },
  { month: "Feb", spend: 1980 },
  { month: "Mar", spend: 2340 },
  { month: "Apr", spend: 2560 },
  { month: "May", spend: 2410 },
  { month: "Jun", spend: 2845 },
];

const areaConfig: ChartConfig = {
  spend: { label: "Spend", color: "var(--color-chart-1)" },
};

const categoryDonut: {
  name: string;
  value: number;
  key: "software" | "productivity" | "infra" | "other";
}[] = [
  { name: "Software & SaaS", value: 35, key: "software" },
  { name: "Productivity", value: 25, key: "productivity" },
  { name: "Infrastructure", value: 20, key: "infra" },
  { name: "Other", value: 20, key: "other" },
];

const categoryChartConfig = {
  software: { label: "Software & SaaS", color: "var(--color-chart-1)" },
  productivity: { label: "Productivity", color: "var(--color-chart-4)" },
  infra: { label: "Infrastructure", color: "var(--color-chart-2)" },
  other: { label: "Other", color: "var(--color-chart-5)" },
} satisfies ChartConfig;

const highestSpends = [
  {
    service: "AWS",
    sub: "Cloud services",
    category: "Infrastructure",
    renewal: "in 2 days",
    renewalUrgent: true,
    cost: 845.0,
  },
  {
    service: "Microsoft 365",
    sub: "Productivity suite",
    category: "Productivity",
    renewal: "Oct 24, 2024",
    renewalUrgent: false,
    cost: 450.0,
  },
  {
    service: "Salesforce",
    sub: "CRM",
    category: "Sales",
    renewal: "Nov 01, 2024",
    renewalUrgent: false,
    cost: 300.0,
  },
  {
    service: "Adobe CC",
    sub: "Design tools",
    category: "Design",
    renewal: "Oct 28, 2024",
    renewalUrgent: false,
    cost: 89.99,
  },
] as const;

export function SpendsAnalytics() {
  const { user } = useUser();
  const [rangeLabel, setRangeLabel] = useState("Last 6 months");

  const userLabel = user?.id
    ? `User ID: ${user.id.length > 20 ? `${user.id.slice(0, 10)}…` : user.id}`
    : "Signed in";

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
                  setRangeLabel("Last 3 months");
                }}
              >
                Last 3 months
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRangeLabel("Last 6 months");
                }}
              >
                Last 6 months
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRangeLabel("Last 12 months");
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
                    $2,845.00
                  </span>
                  <Badge
                    variant="secondary"
                    className="w-fit border-transparent bg-primary/10 text-primary"
                  >
                    +4.2% vs last month
                  </Badge>
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
                $342.00
              </p>
              <Badge className="border border-primary-foreground/30 bg-primary-foreground/15 px-2.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-primary-foreground">
                3 subscriptions cancelled
              </Badge>
              <div className="flex items-center justify-between gap-2 rounded-md border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-primary-foreground">
                    Duplicate Zoom
                  </p>
                  <p className="text-[0.65rem] text-primary-foreground/80">
                    Save $14.99/mo
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-primary-foreground hover:bg-primary-foreground/15"
                  aria-label="View opportunity"
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} className="size-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Spend by category</CardTitle>
              <CardDescription>This month’s mix</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <ChartContainer
                config={categoryChartConfig}
                className="mx-auto min-h-[200px] w-[200px] sm:mx-0"
                initialDimension={{ width: 200, height: 200 }}
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" hideLabel />}
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
                              Total
                            </tspan>
                            <tspan
                              x={cx}
                              dy="1.15em"
                              className="text-lg font-semibold fill-foreground"
                            >
                              $2.8k
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
                      <span className="truncate text-foreground">{c.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {c.value}%
                    </span>
                  </li>
                ))}
              </ul>
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
                    {highestSpends.map((row) => (
                      <tr
                        key={row.service}
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
                              {row.renewal}
                            </span>
                          ) : (
                            <span className="text-[0.65rem] text-muted-foreground sm:text-xs">
                              {row.renewal}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap py-3 text-end align-top text-xs font-medium tabular-nums text-foreground">
                          $
                          {row.cost.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
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
