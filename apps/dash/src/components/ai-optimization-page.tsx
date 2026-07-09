import {
  ArtificialIntelligence01Icon,
  ChartHistogramIcon,
  CloudIcon,
  KanbanIcon,
  MailSend01Icon,
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
} from "@saascription/ui";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { DASH_SCROLL_CONTENT } from "../lib/dashboard-page-layout";
import { DashPageHeader } from "./dash-page-header";

const USER_MESSAGE_CLASS =
  "rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm text-foreground";

const ASSISTANT_MESSAGE_CLASS =
  "min-w-0 space-y-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-sm";

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
  value: { label: "Spend", color: "var(--color-chart-1)" },
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
    iconClass: "text-chart-2",
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
    iconClass: "text-chart-4",
  },
] as const;

export function AiOptimizationPage() {
  const [input, setInput] = useState("");

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <DashPageHeader
        title="AI optimization assistant"
        description="Ask your personal AI about spending, tools, and savings"
      />

      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-0 overflow-hidden lg:max-w-[min(100%,100rem)] lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border bg-background px-4 py-2.5 sm:px-6 sm:py-3">
            <div className="mx-auto max-w-3xl">
              <p className="mb-1.5 text-[0.625rem] font-medium tracking-wide text-muted-foreground uppercase sm:mb-2">
                Suggested
              </p>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
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
                    <Card className="h-full transition-shadow hover:shadow-md">
                      <CardHeader className="space-y-0 p-2 pb-1.5 sm:p-3 sm:pb-1.5 sm:pt-3">
                        <div className="mb-1 flex size-6 items-center justify-center rounded-md border border-border bg-muted/50 sm:mb-1.5 sm:size-8">
                          <HugeiconsIcon
                            icon={s.icon}
                            className="size-3 text-foreground sm:size-3.5"
                          />
                        </div>
                        <CardTitle className="text-[0.625rem] font-medium leading-tight sm:text-xs">
                          {s.title}
                        </CardTitle>
                        <CardDescription className="text-[0.5625rem] leading-snug sm:text-[0.625rem]">
                          {s.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={cn(DASH_SCROLL_CONTENT, "px-4 py-4 sm:px-6")}>
            <div className="mx-auto flex max-w-3xl flex-col gap-6">
              <div
                className={cn(
                  "ml-auto max-w-[min(100%,32rem)]",
                  USER_MESSAGE_CLASS,
                )}
              >
                Show me a breakdown of my 2023 spend
              </div>

              <div className="mr-auto flex w-full max-w-[min(100%,36rem)] gap-2.5">
                <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <HugeiconsIcon
                    icon={ArtificialIntelligence01Icon}
                    className="size-3.5"
                  />
                </div>
                <div className={ASSISTANT_MESSAGE_CLASS}>
                  <p className="text-muted-foreground">
                    Here’s your 2023 spend by month. December was your peak at
                    about{" "}
                    <span className="font-medium text-foreground">$1,840</span>{" "}
                    — mostly from infrastructure and design tools. The trend is
                    up <span className="text-primary">~12% vs. mid-year</span>.
                  </p>
                  <div className="h-px w-full bg-border" />
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

              <div
                className={cn(
                  "ml-auto max-w-[min(100%,32rem)]",
                  USER_MESSAGE_CLASS,
                )}
              >
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
                      <Card key={svc.name}>
                        <CardHeader className="space-y-1 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 items-center justify-center rounded-md border border-border bg-muted/50">
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
                        <CardFooter className="border-t border-border pt-2 text-[0.625rem] font-medium text-primary">
                          Under budget (${svc.under} left)
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 z-10 shrink-0 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md supports-[backdrop-filter]:bg-background/90 sm:px-6">
            <div className="mx-auto max-w-3xl space-y-2">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-2 py-1.5 shadow-sm">
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

        <aside className="hidden min-h-0 w-72 shrink-0 border-l border-border bg-card lg:flex lg:flex-col">
          <div className="border-b border-border p-4">
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
            <Card className="border-primary/20 bg-linear-to-br from-primary/8 via-primary/4 to-chart-1/10 shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start gap-2">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
                    <HugeiconsIcon
                      icon={SlackIcon}
                      className="size-4 text-foreground"
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
          className="size-9 rounded-full shadow-md"
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
