import {
  BarChartIcon,
  Calendar01Icon,
  CreditCardIcon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const features = [
  {
    title: "Unified spend",
    description:
      "See every recurring tool, seat count, and cost in a single, filterable view—no more spreadsheet archaeology.",
    icon: CreditCardIcon,
  },
  {
    title: "Renewal clarity",
    description:
      "Know when contracts renew, who owns them, and when to renegotiate—before the auto-charge hits.",
    icon: Calendar01Icon,
  },
  {
    title: "Team alerts",
    description:
      "Remind the right people before policy windows close, so nothing slips through the cracks.",
    icon: Notification03Icon,
  },
  {
    title: "Actionable reports",
    description:
      "Export and share summaries finance and IT can trust, without copy-paste from a dozen admin consoles.",
    icon: BarChartIcon,
  },
] as const;

export function FeatureGrid() {
  return (
    <section
      id="features"
      className="scroll-mt-20 border-b border-border/60 bg-background py-20 sm:py-28"
      aria-labelledby="features-heading"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2
            id="features-heading"
            className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Built for subscription operations
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            The layer between your bank statement and a dozen vendor dashboards:
            clear, owner-led, and easy to keep current.
          </p>
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <li
              key={f.title}
              className="group flex flex-col rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <HugeiconsIcon
                  icon={f.icon}
                  size={22}
                  className="text-primary"
                />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
