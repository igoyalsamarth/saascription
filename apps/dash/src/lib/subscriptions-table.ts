import {
  BookOpen01Icon,
  CloudIcon,
  Message01Icon,
  MusicNote01Icon,
  ShoppingBag01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons";

import type { SubscriptionRow as ApiSubscriptionRow } from "@/lib/subscriptions";

export type SubscriptionTabId =
  | "all"
  | "existing"
  | "new"
  | "expiring"
  | "free-trials"
  | "cancelled";

/** Table badge + filters: anything not actively renewing maps here. */
export type SubscriptionTableStatus = "active" | "cancelled";

type SubscriptionIcon = typeof Video01Icon;

export type SubscriptionTableRow = {
  id: string;
  name: string;
  category: string;
  icon: SubscriptionIcon;
  iconTone: { bg: string; text: string };
  planType: string;
  status: SubscriptionTableStatus;
  isNew: boolean;
  isFreeTrial: boolean;
  daysUntilRenewal: number | null;
  renewalDateLabel: string;
  urgentRenewalLabel: string | null;
  costAmount: string;
  costSuffix: string | null;
  endsOnLabel: string | null;
};

export const SUBSCRIPTION_TABS: { id: SubscriptionTabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "existing", label: "Existing" },
  { id: "new", label: "New" },
  { id: "expiring", label: "Expiring" },
  { id: "free-trials", label: "Free Trials" },
  { id: "cancelled", label: "Cancelled" },
];

function fmtLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysFromUtcToday(dateStr: string): number {
  const today = new Date();
  const t0 = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const [y, m, day] = dateStr.split("-").map(Number);
  const t1 = Date.UTC(y, m - 1, day);
  return Math.round((t1 - t0) / 86_400_000);
}

function urgentRenewalLabel(days: number): string | null {
  if (days < 0) {
    return null;
  }
  if (days === 0) {
    return "Today";
  }
  if (days === 1) {
    return "Tomorrow";
  }
  if (days <= 7) {
    return `In ${days} days`;
  }
  return null;
}

function formatCost(amountStr: string): string {
  const n = Number.parseFloat(amountStr.trim());
  if (!Number.isFinite(n)) {
    return amountStr;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

function subscriptionCategory(name: string): string {
  const n = name.toLowerCase();
  if (
    /\b(aws|azure|gcp|google cloud|cloudflare|vercel|netlify|fly\.io|digitalocean|hosting)\b/.test(
      n,
    )
  ) {
    return "Cloud";
  }
  if (/\b(figma|sketch|adobe|canva|design|miro|notion whiteboard)\b/.test(n)) {
    return "Design";
  }
  if (
    /\b(spotify|apple music|netflix|hulu|youtube|disney|stream|video|hbo|prime)\b/.test(
      n,
    )
  ) {
    return "Entertainment";
  }
  if (
    /\b(slack|zoom|teams|google workspace|notion|linear|asana|jira|confluence|monday)\b/.test(
      n,
    )
  ) {
    return "Productivity";
  }
  if (
    /\b(github|gitlab|vscode|jetbrains|datadog|sentry|stripe|twilio)\b/.test(n)
  ) {
    return "Developer tools";
  }
  return "Software";
}

function subscriptionVisual(name: string): {
  icon: SubscriptionIcon;
  iconTone: { bg: string; text: string };
} {
  const n = name.toLowerCase();
  if (/\b(netflix|hulu|disney|youtube|stream|video|hbo|prime)\b/.test(n)) {
    return {
      icon: Video01Icon,
      iconTone: {
        bg: "bg-rose-500/15",
        text: "text-rose-600 dark:text-rose-400",
      },
    };
  }
  if (/\b(spotify|apple music|music|soundcloud)\b/.test(n)) {
    return {
      icon: MusicNote01Icon,
      iconTone: {
        bg: "bg-green-500/15",
        text: "text-green-600 dark:text-green-400",
      },
    };
  }
  if (/\b(slack|teams|zoom|message|chat)\b/.test(n)) {
    return {
      icon: Message01Icon,
      iconTone: {
        bg: "bg-violet-500/15",
        text: "text-violet-600 dark:text-violet-400",
      },
    };
  }
  if (/\b(notion|docs|wiki|book)\b/.test(n)) {
    return {
      icon: BookOpen01Icon,
      iconTone: {
        bg: "bg-stone-500/15",
        text: "text-stone-600 dark:text-stone-300",
      },
    };
  }
  if (/\b(aws|azure|gcp|cloud|vercel|hosting|fly\.io)\b/.test(n)) {
    return {
      icon: CloudIcon,
      iconTone: {
        bg: "bg-amber-500/15",
        text: "text-amber-600 dark:text-amber-500",
      },
    };
  }
  return {
    icon: ShoppingBag01Icon,
    iconTone: {
      bg: "bg-muted",
      text: "text-muted-foreground",
    },
  };
}

function planTypeLabel(r: ApiSubscriptionRow): string {
  if (r.interval === "yearly") {
    return "Yearly";
  }
  if (r.interval === "custom") {
    return "Custom billing";
  }
  return "Monthly";
}

function isEndedLikeStatus(s: ApiSubscriptionRow["status"]): boolean {
  return s === "cancelled" || s === "expired" || s === "failed";
}

function parseCancelledAtDate(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) {
    return null;
  }
  const d = new Date(raw.trim());
  return Number.isFinite(d.getTime()) ? d : null;
}

export function apiSubscriptionToTableRow(
  r: ApiSubscriptionRow,
): SubscriptionTableRow {
  const category = subscriptionCategory(r.name);
  const vis = subscriptionVisual(r.name);
  const uiStatus: SubscriptionTableStatus = isEndedLikeStatus(r.status)
    ? "cancelled"
    : "active";

  const billingActive = r.status === "new" || r.status === "old";
  const nb = r.nextBillingAt?.trim();
  const nbOk = Boolean(nb && /^\d{4}-\d{2}-\d{2}$/.test(nb));

  let daysUntilRenewal: number | null = null;
  let renewalDateLabel = "";
  let urgentRenewal: string | null = null;

  if (billingActive && nbOk && nb) {
    daysUntilRenewal = daysFromUtcToday(nb);
    renewalDateLabel = fmtLong(new Date(`${nb}T12:00:00`));
    urgentRenewal = urgentRenewalLabel(daysUntilRenewal);
  }

  const amountNum = Number.parseFloat(r.amount.trim());
  const isFreeTrial =
    billingActive && Number.isFinite(amountNum) && amountNum === 0;

  let endsOnLabel: string | null = null;
  if (isEndedLikeStatus(r.status)) {
    if (nbOk && nb && daysFromUtcToday(nb) >= 0) {
      endsOnLabel = `Ends ${fmtLong(new Date(`${nb}T12:00:00`))}`;
    } else {
      const end = parseCancelledAtDate(r.cancelledAt);
      if (end) {
        endsOnLabel = `Ended ${fmtLong(end)}`;
      }
    }
  }

  const costSuffix = r.interval === "yearly" ? "/year" : null;

  return {
    id: r.id,
    name: r.name,
    category,
    icon: vis.icon,
    iconTone: vis.iconTone,
    planType: planTypeLabel(r),
    status: uiStatus,
    isNew: r.status === "new",
    isFreeTrial,
    daysUntilRenewal,
    renewalDateLabel,
    urgentRenewalLabel: urgentRenewal,
    costAmount: formatCost(r.amount),
    costSuffix,
    endsOnLabel,
  };
}

export function filterSubscriptions(
  list: SubscriptionTableRow[],
  tab: SubscriptionTabId,
): SubscriptionTableRow[] {
  if (tab === "all") {
    return list;
  }
  if (tab === "existing") {
    return list.filter(
      (row) => row.status === "active" && !row.isNew && !row.isFreeTrial,
    );
  }
  if (tab === "new") {
    return list.filter((row) => row.isNew);
  }
  if (tab === "expiring") {
    return list.filter(
      (row) =>
        row.status === "active" &&
        row.daysUntilRenewal != null &&
        row.daysUntilRenewal >= 0 &&
        row.daysUntilRenewal <= 7,
    );
  }
  if (tab === "free-trials") {
    return list.filter((row) => row.isFreeTrial && row.status === "active");
  }
  if (tab === "cancelled") {
    return list.filter((row) => row.status === "cancelled");
  }
  return list;
}
