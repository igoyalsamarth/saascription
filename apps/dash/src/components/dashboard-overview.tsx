import { useUser } from "@clerk/clerk-react";
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

import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

const spendData = [
  { month: "May", spend: 1820 },
  { month: "Jun", spend: 2140 },
  { month: "Jul", spend: 1980 },
  { month: "Aug", spend: 2450 },
  { month: "Sep", spend: 2210 },
  { month: "Oct", spend: 2645 },
];

const sparklineData = [
  { i: 0, v: 2.1 },
  { i: 1, v: 2.3 },
  { i: 2, v: 2.5 },
  { i: 3, v: 2.45 },
  { i: 4, v: 2.85 },
  { i: 5, v: 2.84 },
];

const categoryData = [
  { name: "Software", value: 35, key: "software" as const },
  { name: "Cloud", value: 28, key: "cloud" as const },
  { name: "Design", value: 18, key: "design" as const },
  { name: "Productivity", value: 12, key: "productivity" as const },
  { name: "Other", value: 7, key: "other" as const },
];

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

const renewals = [
  { name: "AWS", amount: 420, inDays: 2 },
  { name: "Adobe CC", amount: 79, inDays: 5 },
  { name: "Figma", amount: 45, inDays: 9 },
];

export function DashboardOverview() {
  const { user } = useUser();
  const [spendWindow, setSpendWindow] = useState<"6m" | "1y">("6m");
  const [rangeLabel, setRangeLabel] = useState("Last 30 days");

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
                14
              </p>
              <Badge variant="secondary" className="mt-2 w-fit text-[0.625rem]">
                +2 since last month
              </Badge>
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
                $2,845
              </p>
              <div className="mt-2 h-8 w-full">
                <ChartContainer
                  config={sparkConfig}
                  className="aspect-6/1 w-full"
                  initialDimension={{ width: 200, height: 32 }}
                >
                  <AreaChart
                    data={sparklineData}
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
                $4,120
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
                  data={spendData}
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
              {renewals.map((r) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between gap-2 border-b border-border/60 py-3 last:border-b-0"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {r.name}
                      </p>
                      <p className="text-[0.625rem] text-muted-foreground">
                        In {r.inDays} day{r.inDays === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-medium tabular-nums text-foreground">
                    ${r.amount}
                  </span>
                </div>
              ))}
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
              <CardDescription>Share of this month’s total</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
              <ChartContainer
                config={chartKeys}
                className="mx-auto min-h-[200px] w-[200px] sm:mx-0"
                initialDimension={{ width: 200, height: 200 }}
              >
                <PieChart>
                  <ChartTooltip
                    content={<ChartTooltipContent nameKey="name" hideLabel />}
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
                      <span className="truncate text-foreground">{c.name}</span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {c.value}%
                    </span>
                  </li>
                ))}
              </ul>
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
              <div className="flex gap-3 rounded-md border border-border/80 bg-muted/20 p-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <HugeiconsIcon
                    icon={Notification01Icon}
                    className="size-3.5"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">
                    New subscription added
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground">
                    Netflix Standard Plan — 2h ago
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
