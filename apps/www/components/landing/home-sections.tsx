import {
  BarChartIcon,
  Calendar03Icon,
  CancelCircleIcon,
  CheckmarkCircle02Icon,
  FlashIcon,
  Notification03Icon,
  PiggyBankIcon,
  Rocket01Icon,
  Shapes01Icon,
  Shield01Icon,
  SparklesIcon,
  SquareArrowRight02Icon,
  Target02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { buttonVariants } from "@saascription/ui";
import Link from "next/link";
import { appSignInUrl } from "@/lib/site";
import { cn } from "@/lib/utils";

function DashboardOverviewMock() {
  const rows = [
    { letter: "A", name: "Adobe CC", cat: "Design Tools", price: "$54.99/mo" },
    { letter: "S", name: "Slack", cat: "Communication", price: "$12.50/mo" },
    { letter: "N", name: "Notion", cat: "Productivity", price: "$10.00/mo" },
  ] as const;
  return (
    <div className="animate-landing-dashboard-float rounded-3xl border border-border/80 bg-card/90 p-4 shadow-lg backdrop-blur-sm will-change-transform sm:p-5">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
        <p className="text-sm font-semibold text-foreground">
          Dashboard Overview
        </p>
        <div className="flex items-center gap-1 text-muted-foreground">
          <HugeiconsIcon icon={Notification03Icon} size={18} />
          <HugeiconsIcon icon={Calendar03Icon} size={18} />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="rounded-xl bg-muted/40 px-2 py-3 sm:px-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Active
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            24
            <span className="ml-1 text-xs font-medium text-primary">+2</span>
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 px-2 py-3 sm:px-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Monthly
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            $329.94
            <span className="ml-1 text-xs font-medium text-muted-foreground">
              -$15
            </span>
          </p>
        </div>
        <div className="rounded-xl bg-muted/40 px-2 py-3 sm:px-3">
          <p className="text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground">
            Savings
          </p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-foreground sm:text-xl">
            $845
            <span className="ml-1 text-[0.65rem] font-medium text-primary">
              AI
            </span>
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r) => (
          <li
            key={r.name}
            className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2.5"
          >
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-sm font-bold text-primary"
              aria-hidden
            >
              {r.letter}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {r.name}
              </p>
              <p className="text-xs text-muted-foreground">{r.cat}</p>
            </div>
            <p className="shrink-0 text-xs font-medium tabular-nums text-foreground">
              {r.price}
            </p>
          </li>
        ))}
      </ul>
      <div className="animate-landing-ai-pulse mt-3 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2.5 transition-[box-shadow,border-color] duration-300 ease-in-out">
        <HugeiconsIcon
          icon={SparklesIcon}
          size={18}
          className="shrink-0 text-primary"
        />
        <p className="min-w-0 flex-1 text-xs leading-snug text-foreground">
          <span className="font-medium text-primary">AI Insight</span>
          <span className="text-muted-foreground"> · </span>
          Save $15/mo. Switch Slack to annual billing.
        </p>
        <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-[0.65rem] font-medium text-primary">
          Apply
        </span>
      </div>
    </div>
  );
}

const whyFeatures = [
  {
    title: "All Tools in One Place",
    description:
      "Browse hundreds of SaaS and AI tools organized by category for easy discovery and management.",
    icon: Shapes01Icon,
  },
  {
    title: "Smart Tracking",
    description:
      "Monitor your subscriptions and spending effortlessly with our automated tracking system.",
    icon: BarChartIcon,
  },
  {
    title: "Secure & Private",
    description:
      "Your financial data is encrypted with bank-level security and protected at all times.",
    icon: Shield01Icon,
  },
  {
    title: "Optimize Costs",
    description:
      "Identify unused subscriptions and duplicate tools to immediately save money every month.",
    icon: FlashIcon,
  },
] as const;

const howSteps = [
  {
    n: 1,
    title: "Connect",
    description: "Securely connect all your SaaS accounts and bank feeds.",
  },
  {
    n: 2,
    title: "Track",
    description:
      "Automatically track active subscriptions and recurring costs.",
  },
  {
    n: 3,
    title: "Analyze",
    description: "Get detailed insights on your spending patterns and usage.",
  },
  {
    n: 4,
    title: "Save",
    description:
      "Reduce costs by cancelling unused tools and managing renewals.",
  },
] as const;

const benefitRows = [
  {
    title: "Save 30% on subscriptions",
    description:
      "Our AI identifies duplicate features and suggests more affordable alternatives.",
    icon: PiggyBankIcon,
  },
  {
    title: "AI-powered tracking",
    description:
      "Automatic detection of upcoming renewals and price hikes across all platforms.",
    icon: Target02Icon,
  },
  {
    title: "Bank-level security",
    description:
      "Your data is encrypted and protected with the highest industry standards.",
    icon: Shield01Icon,
  },
] as const;

const testimonials = [
  {
    quote:
      "Saascription helped us cut our software spend by 25% in the first month. The AI recommendations were spot on.",
    initials: "AJ",
    name: "Alex Johnson",
    role: "CTO, TechStart",
    avatarClass: "bg-chart-3 text-primary-foreground",
  },
  {
    quote:
      "I used to lose track of my free trials all the time. Now I get alerted before I get charged. Amazing tool.",
    initials: "S",
    name: "Sarah Williams",
    role: "Freelance Designer",
    avatarClass: "bg-chart-2 text-primary-foreground",
  },
  {
    quote:
      "The dashboard is beautiful and intuitive. Seeing all our team's subscriptions in one place has been a game-changer.",
    initials: "M",
    name: "Michael Chen",
    role: "Operations Manager, ScaleUp Inc.",
    avatarClass: "bg-chart-4 text-primary-foreground",
  },
] as const;

type PricingPlan = {
  name: string;
  price: string;
  highlight: boolean;
  badge?: string;
  features: readonly { text: string; included: boolean }[];
};

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    price: "$0",
    highlight: false,
    features: [
      { text: "Track up to 5 subscriptions", included: true },
      { text: "Basic alerts", included: true },
      { text: "Automated bank sync", included: false },
    ],
  },
  {
    name: "Professional",
    price: "$29",
    highlight: true,
    badge: "MOST POPULAR",
    features: [
      { text: "Track unlimited subscriptions", included: true },
      { text: "AI Recommendations", included: true },
      { text: "Automated bank sync", included: true },
      { text: "Priority support", included: true },
    ],
  },
  {
    name: "Enterprise",
    price: "$99",
    highlight: false,
    features: [
      { text: "Multi-user access", included: true },
      { text: "SSO Integration", included: true },
      { text: "Dedicated account manager", included: true },
    ],
  },
];

export function HomeLandingSections() {
  return (
    <>
      <section
        className="relative overflow-hidden border-b border-border/60"
        aria-labelledby="hero-heading"
      >
        <div
          className="pointer-events-none absolute -top-32 left-1/2 h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-primary/12 blur-3xl dark:bg-primary/20"
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 md:grid-cols-2 md:items-center md:gap-10 md:pt-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-foreground">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden />
              AI-powered management
            </p>
            <h1
              id="hero-heading"
              className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl sm:leading-tight"
            >
              Manage All Your SaaS{" "}
              <span className="text-primary">Subscriptions</span> with AI
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              Discover, track, and optimize all your SaaS tools in one clean
              platform. Take control of your subscriptions with clarity and
              precision.
            </p>
            <div className="mt-9">
              <Link
                href={appSignInUrl}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "h-12 rounded-full px-8 text-sm font-medium sm:h-12",
                )}
              >
                Start Managing Now
                <HugeiconsIcon
                  icon={SquareArrowRight02Icon}
                  size={18}
                  className="ms-1"
                />
              </Link>
            </div>
          </div>
          <div className="relative md:justify-self-end">
            <div
              className="pointer-events-none absolute -right-8 top-8 h-48 w-48 rounded-full bg-chart-2/15 blur-2xl"
              aria-hidden
            />
            <DashboardOverviewMock />
          </div>
        </div>
      </section>

      <section
        id="features"
        className="scroll-mt-20 border-b border-border/60 py-20 sm:py-28"
        aria-labelledby="features-heading"
      >
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2
            id="features-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl"
          >
            Why Choose{" "}
            <span className="bg-linear-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent">
              Saascription?
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            The most powerful way to regain control over your software stack.
          </p>
          <ul className="mt-14 grid gap-6 text-left sm:grid-cols-2">
            {whyFeatures.map((f) => (
              <li
                key={f.title}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HugeiconsIcon icon={f.icon} size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="border-b border-border/60 py-20 sm:py-28"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2
              id="how-heading"
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              How It Works
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Get started in minutes and see immediate results.
            </p>
          </div>
          <div className="relative mt-16">
            <div
              className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-border md:block"
              style={{ marginLeft: "12.5%", marginRight: "12.5%" }}
              aria-hidden
            />
            <ol className="grid gap-10 md:grid-cols-4 md:gap-4">
              {howSteps.map((step) => (
                <li
                  key={step.n}
                  className="relative flex flex-col items-center text-center"
                >
                  <span className="relative z-1 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-bold text-primary">
                    {step.n}
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2 max-w-[16rem] text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section
        className="border-b border-border/60 py-20 sm:py-28"
        aria-labelledby="signup-deep-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="signup-deep-heading"
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
            >
              Join the future of{" "}
              <span className="text-primary">subscription management</span>.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Stop wasting money on unused tools. Start optimizing your SaaS
              stack with precision.
            </p>
          </div>
          <ul className="mx-auto mt-10 max-w-xl space-y-6">
            {benefitRows.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/80 bg-muted/30 text-primary">
                  <HugeiconsIcon icon={b.icon} size={20} />
                </span>
                <div>
                  <p className="font-semibold text-foreground">{b.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {b.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="testimonials"
        className="scroll-mt-20 border-b border-border/60 py-20 sm:py-28"
        aria-labelledby="testimonials-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2
            id="testimonials-heading"
            className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            User Success Stories
          </h2>
          <ul className="mt-14 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <li
                key={t.name}
                className="flex flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
              >
                <div
                  role="img"
                  aria-label="5 out of 5 stars"
                  className="text-sm leading-relaxed text-primary"
                >
                  ★★★★★
                </div>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground">
                  “{t.quote}”
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-full text-xs font-bold",
                      t.avatarClass,
                    )}
                  >
                    {t.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {t.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        id="pricing"
        className="scroll-mt-20 border-b border-border/60 py-20 sm:py-28"
        aria-labelledby="pricing-heading"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2
              id="pricing-heading"
              className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl"
            >
              Simple, <span className="text-primary">straightforward</span>{" "}
              pricing
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
              Choose the plan that fits your needs.
            </p>
          </div>
          <ul className="mt-14 grid gap-6 lg:grid-cols-3">
            {pricingPlans.map((plan) => (
              <li
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm sm:p-8",
                  plan.highlight
                    ? "border-2 border-primary lg:scale-[1.02]"
                    : "border-border/80",
                )}
              >
                {plan.badge ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">
                    {plan.badge}
                  </span>
                ) : null}
                <h3 className="text-lg font-semibold text-foreground">
                  {plan.name}
                </h3>
                <p className="mt-4">
                  <span className="text-4xl font-semibold tabular-nums text-foreground">
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground"> /month</span>
                </p>
                <ul className="mt-6 flex-1 space-y-3">
                  {plan.features.map((feat) => (
                    <li key={feat.text} className="flex gap-2 text-sm">
                      {feat.included ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={18}
                          className="shrink-0 text-primary"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={CancelCircleIcon}
                          size={18}
                          className="shrink-0 text-muted-foreground"
                        />
                      )}
                      <span
                        className={
                          feat.included
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {feat.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={appSignInUrl}
                  className={cn(
                    buttonVariants({
                      variant: plan.highlight ? "default" : "outline",
                      size: "lg",
                    }),
                    "mt-8 w-full rounded-full",
                  )}
                >
                  Get Started
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-20 sm:py-28" aria-labelledby="final-cta-heading">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2
            id="final-cta-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl"
          >
            Ready to <span className="text-primary">Take Control</span>?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of users who are already managing their subscriptions
            smarter.
          </p>
          <Link
            href={appSignInUrl}
            className={cn(
              buttonVariants({ variant: "default", size: "lg" }),
              "mt-8 inline-flex h-12 items-center rounded-full px-8 text-sm font-medium shadow-[0_0_24px_-4px_var(--color-primary)]",
            )}
          >
            <HugeiconsIcon icon={Rocket01Icon} size={18} className="me-2" />
            Get Started Free
          </Link>
        </div>
      </section>
    </>
  );
}
