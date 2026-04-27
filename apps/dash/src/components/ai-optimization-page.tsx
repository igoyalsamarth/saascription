import { useUser } from "@clerk/clerk-react";
import {
  ArtificialIntelligence01Icon,
  ChartHistogramIcon,
  CloudIcon,
  KanbanIcon,
  MailSend01Icon,
  Notification01Icon,
  Search01Icon,
  Settings01Icon,
  SlackIcon,
  SparklesIcon,
  TaskDone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Button,
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
  Input,
  SidebarTrigger,
} from "@saascription/ui";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";

import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

/** Sticky top row on AI: glass, not a solid opaque bar (avoids a “box” over the thread). */
const AI_STICKY_HEADER =
  "sticky top-0 z-20 border-b border-border/40 bg-transparent shadow-none backdrop-blur-md supports-[backdrop-filter]:bg-background/35";

const suggestions = [
  {
    title: "Summary of 2023 spend",
    description: "Analyze last year’s total expenses.",
    icon: ChartHistogramIcon,
  },
  {
    title: "CRM under $50?",
    description: "Find CRM tools fitting your budget.",
    icon: Search01Icon,
  },
  {
    title: "Total AWS spend",
    description: "Check lifetime spend on cloud infrastructure.",
    icon: CloudIcon,
  },
] as const;

const barData = [
  { month: "Jul", value: 1180, highlight: false },
  { month: "Aug", value: 1320, highlight: false },
  { month: "Sep", value: 1450, highlight: false },
  { month: "Oct", value: 1510, highlight: false },
  { month: "Nov", value: 1680, highlight: false },
  { month: "Dec", value: 1840, highlight: true },
] as const;

const barConfig: ChartConfig = {
  value: { label: "Spend", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

const serviceCompare = [
  {
    name: "Trello",
    plan: "Standard",
    price: "Free — $5/user",
    features: [
      "Unlimited cards & boards",
      "Automation up to 1,000/mo",
      "Integrations with Drive & Slack",
    ],
    under: "$42",
    icon: KanbanIcon,
    iconClass: "text-sky-600",
  },
  {
    name: "ClickUp",
    plan: "Unlimited",
    price: "From $7/user",
    features: [
      "All-in-one project views",
      "Unlimited list & Gantt",
      "AI writer add-on",
    ],
    under: "$31",
    icon: TaskDone01Icon,
    iconClass: "text-violet-600",
  },
] as const;

export function AiOptimizationPage() {
  const { user } = useUser();
  const [input, setInput] = useState("");

  const userLabel = user?.id
    ? `User ID: ${user.id.length > 20 ? `${user.id.slice(0, 10)}…` : user.id}`
    : "User ID: 0";

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[linear-gradient(to_top,rgb(0,0,0),var(--background)_100%)]">
      <header
        className={cn(
          AI_STICKY_HEADER,
          "flex w-full items-start justify-between gap-3 sm:items-center",
          DASH_STICKY_HEADER_PAD,
        )}
      >
        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              AI optimization assistant
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Ask your personal AI about spending, tools, and savings (
              {userLabel})
            </p>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
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
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-0 overflow-hidden lg:max-w-[min(100%,100rem)] lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/60 bg-transparent px-4 py-3 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <p className="mb-2 text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase">
                Suggested
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                {suggestions.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    className="text-left"
                    onClick={() => {
                      setInput(
                        s.title === "Summary of 2023 spend"
                          ? "Show me a breakdown of my 2023 spend"
                          : s.title,
                      );
                    }}
                  >
                    <Card className="h-full border-border/60 bg-background/25 backdrop-blur-sm transition-shadow hover:shadow-md">
                      <CardHeader className="space-y-0 pb-1.5 pt-3">
                        <div className="mb-1.5 flex size-8 items-center justify-center rounded-md border border-border/60 bg-muted/50">
                          <HugeiconsIcon
                            icon={s.icon}
                            className="size-3.5 text-foreground"
                          />
                        </div>
                        <CardTitle className="text-xs font-medium leading-tight">
                          {s.title}
                        </CardTitle>
                        <CardDescription className="text-[0.625rem] leading-snug">
                          {s.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div
            className={cn(
              DASH_SCROLL_CONTENT,
              "bg-transparent px-4 py-4 sm:px-6",
            )}
          >
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              <div className="ml-auto max-w-[min(100%,32rem)] rounded-2xl border border-primary/20 bg-emerald-50/90 px-4 py-2.5 text-sm text-foreground dark:border-primary/15 dark:bg-emerald-950/35">
                Show me a breakdown of my 2023 spend
              </div>

              <div className="mr-auto flex w-full max-w-[min(100%,36rem)] gap-2.5">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <HugeiconsIcon
                    icon={ArtificialIntelligence01Icon}
                    className="size-3.5"
                  />
                </div>
                <div className="min-w-0 space-y-3 rounded-2xl border border-border/60 bg-background/20 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur-sm">
                  <p className="text-muted-foreground">
                    Here’s your 2023 spend by month. December was your peak at
                    about{" "}
                    <span className="font-medium text-foreground">$1,840</span>{" "}
                    — mostly from infrastructure and design tools. The trend is
                    up <span className="text-primary">~12% vs. mid-year</span>.
                  </p>
                  <div className="h-px w-full bg-border/60" />
                  <p className="text-xs font-medium text-foreground">
                    Monthly spend
                  </p>
                  <ChartContainer
                    config={barConfig}
                    className="!aspect-auto h-44 w-full min-w-0 max-h-44 bg-transparent [&_.recharts-wrapper]:!bg-transparent [&_svg.recharts-surface]:fill-transparent"
                  >
                    <BarChart
                      data={barData}
                      margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        className="stroke-border/50"
                      />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          className: "text-[0.625rem] fill-muted-foreground",
                        }}
                        dy={4}
                      />
                      <YAxis
                        width={32}
                        tickLine={false}
                        axisLine={false}
                        tick={{
                          className: "text-[0.625rem] fill-muted-foreground",
                        }}
                        tickFormatter={(v) => `${v}`}
                      />
                      <ChartTooltip
                        content={<ChartTooltipContent className="text-xs" />}
                        cursor={{
                          fill: "color-mix(in oklch, var(--primary) 8%, transparent)",
                        }}
                      />
                      <Bar
                        name="value"
                        dataKey="value"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={40}
                      >
                        {barData.map((d) => (
                          <Cell
                            key={d.month}
                            fill={
                              d.highlight
                                ? "var(--primary)"
                                : "color-mix(in oklch, var(--muted-foreground) 22%, var(--background))"
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>

              <div className="ml-auto max-w-[min(100%,32rem)] rounded-2xl border border-primary/20 bg-emerald-50/90 px-4 py-2.5 text-sm text-foreground dark:border-primary/15 dark:bg-emerald-950/35">
                Compare Trello and ClickUp for our team
              </div>

              <div className="mr-auto flex w-full max-w-[min(100%,40rem)] gap-2.5">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <HugeiconsIcon icon={SparklesIcon} className="size-3.5" />
                </div>
                <div className="min-w-0 space-y-3 text-sm text-foreground">
                  <p className="text-muted-foreground">
                    Both fit teams under 25 seats. Trello is lighter and cheaper
                    at the entry tier; ClickUp has more project views and time
                    tracking out of the box. Given your current stack, I’d use
                    Trello if you want minimal overhead; pick ClickUp if you
                    need sprints in one product.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {serviceCompare.map((svc) => (
                      <Card
                        key={svc.name}
                        className="border-border/60 bg-background/25 shadow-sm backdrop-blur-sm"
                      >
                        <CardHeader className="space-y-1 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-md border border-border/60 bg-muted/40">
                              <HugeiconsIcon
                                icon={svc.icon}
                                className={cn("size-3.5", svc.iconClass)}
                              />
                            </span>
                            <div>
                              <CardTitle className="text-sm">
                                {svc.name}
                              </CardTitle>
                              <p className="text-[0.625rem] text-muted-foreground">
                                {svc.plan} · {svc.price}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-1 pb-3 text-[0.625rem] text-muted-foreground">
                          <ul className="list-inside list-disc space-y-0.5">
                            {svc.features.map((f) => (
                              <li key={f}>{f}</li>
                            ))}
                          </ul>
                        </CardContent>
                        <CardFooter className="border-t border-border/50 pt-2 text-[0.625rem] font-medium text-primary">
                          Under budget (${svc.under} left)
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 shrink-0 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:px-6">
            <div className="mx-auto max-w-3xl space-y-2">
              <div className="flex items-center gap-2 rounded-full border border-border/50 bg-background/20 px-2 py-1.5 shadow-sm backdrop-blur-sm">
                <span className="flex size-8 shrink-0 items-center justify-center text-muted-foreground">
                  <HugeiconsIcon
                    icon={ArtificialIntelligence01Icon}
                    className="size-4"
                  />
                </span>
                <Input
                  className="h-8 flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0"
                  placeholder="Ask AI anything about your subscriptions…"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  className="size-8 shrink-0 rounded-full"
                  aria-label="Send"
                >
                  <HugeiconsIcon
                    icon={MailSend01Icon}
                    className="size-3.5 text-primary-foreground"
                  />
                </Button>
              </div>
              <p className="px-1 text-center text-[0.625rem] text-muted-foreground">
                AI can make mistakes. Please verify important financial
                information.
              </p>
            </div>
          </div>
        </div>

        <aside className="hidden min-h-0 w-72 shrink-0 border-l border-border/40 bg-background/15 backdrop-blur-sm lg:flex lg:flex-col">
          <div className="border-b border-border/60 p-4">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span className="text-primary">
                <HugeiconsIcon
                  icon={ArtificialIntelligence01Icon}
                  className="size-4"
                />
              </span>
              AI insights
            </p>
          </div>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0 [-ms-overflow-style:none]">
            <Card className="border-primary/20 bg-linear-to-br from-primary/8 via-primary/4 to-emerald-500/10 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/80 dark:bg-card">
                    <HugeiconsIcon
                      icon={SlackIcon}
                      className="size-4 text-[#4A154B]"
                    />
                  </span>
                  <p className="text-sm leading-relaxed text-foreground">
                    <span className="font-semibold">Save $15/mo.</span> Switch
                    Slack to annual billing.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="w-full"
                >
                  Apply savings
                </Button>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <div className="pointer-events-auto fixed right-20 bottom-4 z-50 md:bottom-5">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className="size-9 rounded-full border border-border/60 shadow-md"
          aria-label="AI settings"
        >
          <HugeiconsIcon
            icon={Settings01Icon}
            className="size-3.5 text-foreground"
          />
        </Button>
      </div>
    </div>
  );
}
