import type {
  BillingInterval,
  SubscriptionRow,
} from "@/lib/subscriptions";
import type {
  CalendarBillingInterval,
  CalendarRenewalItem,
} from "@/services/calendar";
import type { DashboardCategoryKey, DashboardOverview } from "@/services/dashboard";
import type {
  SpendsAnalytics,
  SpendsCategoryKey,
  SpendsHighestRow,
  SpendsMonthsWindow,
} from "@/services/spends";

function costCents(row: SubscriptionRow): number {
  if (row.costCents !== undefined && row.costCents !== null) {
    return row.costCents;
  }
  const n = Number(row.amount.trim());
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.round(n * 100);
}

function parseSqliteUtcDate(s: string): Date {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return new Date(`${t}T12:00:00.000Z`);
  }
  const iso = t.includes("T") ? t : `${t.replace(" ", "T")}Z`;
  return new Date(iso);
}

function createdMs(row: SubscriptionRow): number {
  if (row.createdAt?.trim()) {
    const d = parseSqliteUtcDate(row.createdAt);
    if (Number.isFinite(d.getTime())) {
      return d.getTime();
    }
  }
  return Date.now();
}

function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function monthlyEquivalentUsd(row: SubscriptionRow): number {
  const dollars = Math.max(0, costCents(row) / 100);
  if (row.interval === "yearly") {
    return dollars / 12;
  }
  return dollars;
}

function renewalAmountUsd(row: SubscriptionRow): number {
  const dollars = Math.max(0, costCents(row) / 100);
  if (row.interval === "yearly") {
    return dollars;
  }
  return dollars;
}

function renewalChargeUsd(row: SubscriptionRow): number {
  return renewalAmountUsd(row);
}

function isNonCancelledSubscription(row: SubscriptionRow): boolean {
  if (row.cancelledAt?.trim()) {
    return false;
  }
  const s = row.status.trim().toLowerCase();
  if (s === "cancelled" || s === "expired" || s === "failed") {
    return false;
  }
  return s === "new" || s === "old";
}

function daysFromTodayToBillingDate(dateStr: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 0;
  }
  const today = new Date();
  const t0 = utcDayStart(today);
  const [y, m, day] = dateStr.split("-").map(Number);
  const t1 = Date.UTC(y, m - 1, day);
  return Math.round((t1 - t0) / 86_400_000);
}

function daysFromUtcToday(dateStr: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return 0;
  }
  const today = new Date();
  const t0 = utcDayStart(today);
  const [y, m, day] = dateStr.split("-").map(Number);
  const t1 = Date.UTC(y, m - 1, day);
  return Math.round((t1 - t0) / 86_400_000);
}

function categorizeSaasName(name: string): DashboardCategoryKey {
  const n = name.toLowerCase();
  if (
    /\b(aws|amazon web services|gcp|google cloud|azure|cloudflare|vercel|netlify|fly\.io|digitalocean|heroku|render|railway|supabase|planetscale|neon|turso|mongodb atlas|redis|elastic|sentry hosting)\b/.test(
      n,
    )
  ) {
    return "cloud";
  }
  if (
    /\b(figma|sketch|invision|framer|adobe|photoshop|illustrator|indesign|after effects|premiere|canva)\b/.test(
      n,
    )
  ) {
    return "design";
  }
  if (
    /\b(slack|zoom|teams|microsoft 365|office 365|google workspace|notion|linear|asana|trello|monday\.com|clickup|jira|confluence|atlassian|hubspot|zendesk|intercom)\b/.test(
      n,
    )
  ) {
    return "productivity";
  }
  if (
    /\b(github|gitlab|bitbucket|jetbrains|vscode|cursor|datadog|stripe|twilio|sendgrid|mailchimp|salesforce|sap|oracle|workday)\b/.test(
      n,
    )
  ) {
    return "software";
  }
  return "other";
}

function dashToSpendsCategory(d: DashboardCategoryKey): SpendsCategoryKey {
  if (d === "cloud") {
    return "infra";
  }
  if (d === "design") {
    return "software";
  }
  if (d === "software") {
    return "software";
  }
  if (d === "productivity") {
    return "productivity";
  }
  return "other";
}

const CATEGORY_LABEL: Record<DashboardCategoryKey, string> = {
  software: "Software",
  cloud: "Cloud",
  design: "Design",
  productivity: "Productivity",
  other: "Other",
};

const SPENDS_CAT_LABEL: Record<SpendsCategoryKey, string> = {
  software: "Software & SaaS",
  productivity: "Productivity",
  infra: "Infrastructure",
  other: "Other",
};

function lastSixMonthBuckets(now: Date): { label: string; endMs: number }[] {
  const out: { label: string; endMs: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - i;
    const first = new Date(Date.UTC(y, m, 1));
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    );
    const label = first.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    const endMs = utcDayStart(lastDay) + 86_400_000 - 1;
    out.push({ label, endMs });
  }
  return out;
}

function lastNMonthBuckets(
  now: Date,
  n: number,
): { label: string; endMs: number }[] {
  const out: { label: string; endMs: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() - i;
    const first = new Date(Date.UTC(y, m, 1));
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    );
    const label = first.toLocaleString("en-US", {
      month: "short",
      timeZone: "UTC",
    });
    const endMs = utcDayStart(lastDay) + 86_400_000 - 1;
    out.push({ label, endMs });
  }
  return out;
}

function formatRelativeTime(isoMs: number, nowMs: number): string {
  const sec = Math.round((nowMs - isoMs) / 1000);
  if (sec < 60) {
    return "just now";
  }
  const min = Math.round(sec / 60);
  if (min < 60) {
    return `${min}m ago`;
  }
  const hr = Math.round(min / 60);
  if (hr < 48) {
    return `${hr}h ago`;
  }
  const day = Math.round(hr / 24);
  if (day < 14) {
    return `${day}d ago`;
  }
  return new Date(isoMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

function sparklineFromSpends(spends: number[]): { i: number; v: number }[] {
  const max = Math.max(...spends, 1);
  return spends.map((spend, i) => ({
    i,
    v: max > 0 ? Math.min(3, (spend / max) * 2.8 + 0.2) : 1,
  }));
}

function categorySharesFromSpend(
  buckets: Record<DashboardCategoryKey, number>,
): { name: string; value: number; key: DashboardCategoryKey }[] {
  const total = Object.values(buckets).reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return [];
  }
  const keys: DashboardCategoryKey[] = [
    "software",
    "cloud",
    "design",
    "productivity",
    "other",
  ];
  const nonzero = keys
    .map((key) => ({
      key,
      name: CATEGORY_LABEL[key],
      spend: buckets[key],
    }))
    .filter((r) => r.spend > 0);
  if (nonzero.length === 0) {
    return [];
  }
  const exact = nonzero.map((r) => ({
    ...r,
    pct: (r.spend / total) * 100,
  }));
  const floored = exact.map((r) => ({
    key: r.key,
    name: r.name,
    value: Math.floor(r.pct),
  }));
  const sum = floored.reduce((a, r) => a + r.value, 0);
  const order = exact
    .map((r, i) => ({ i, rem: r.pct - floored[i].value }))
    .sort((a, b) => b.rem - a.rem);
  let need = 100 - sum;
  let j = 0;
  while (need > 0 && order.length > 0) {
    floored[order[j % order.length].i].value += 1;
    need -= 1;
    j += 1;
  }
  return floored;
}

function spendsSharesFromBuckets(
  buckets: Record<SpendsCategoryKey, number>,
): { name: string; value: number; key: SpendsCategoryKey }[] {
  const total = Object.values(buckets).reduce((a, b) => a + b, 0);
  if (total <= 0) {
    return [];
  }
  const keys: SpendsCategoryKey[] = [
    "software",
    "productivity",
    "infra",
    "other",
  ];
  const nonzero = keys
    .map((key) => ({
      key,
      name: SPENDS_CAT_LABEL[key],
      spend: buckets[key],
    }))
    .filter((r) => r.spend > 0);
  if (nonzero.length === 0) {
    return [];
  }
  const exact = nonzero.map((r) => ({
    ...r,
    pct: (r.spend / total) * 100,
  }));
  const floored = exact.map((r) => ({
    key: r.key,
    name: r.name,
    value: Math.floor(r.pct),
  }));
  const sum = floored.reduce((a, r) => a + r.value, 0);
  const order = exact
    .map((r, i) => ({ i, rem: r.pct - floored[i].value }))
    .sort((a, b) => b.rem - a.rem);
  let need = 100 - sum;
  let j = 0;
  while (need > 0 && order.length > 0) {
    floored[order[j % order.length].i].value += 1;
    need -= 1;
    j += 1;
  }
  return floored;
}

function emptyDashboard(now: Date): DashboardOverview {
  const buckets = lastSixMonthBuckets(now);
  const spendByMonth = buckets.map((b) => ({ month: b.label, spend: 0 }));
  return {
    activeSubscriptionsCount: 0,
    activeSubscriptionsDeltaSinceLastMonth: 0,
    totalMonthlySpend: 0,
    lifetimeSavings: 0,
    spendByMonth,
    monthlySpendSparkline: sparklineFromSpends(
      spendByMonth.map((m) => m.spend),
    ),
    categoryBreakdown: [],
    upcomingRenewals: [],
    recentActivity: null,
  };
}

export function buildDashboardOverviewFromSubscriptions(
  rows: SubscriptionRow[],
  now = new Date(),
): DashboardOverview {
  if (rows.length === 0) {
    return emptyDashboard(now);
  }

  const activeRows = rows.filter(isNonCancelledSubscription);
  const activeSubscriptionsCount = activeRows.length;

  const thirtyDaysAgo = now.getTime() - 30 * 86_400_000;
  const activeSubscriptionsDeltaSinceLastMonth = activeRows.filter(
    (r) => createdMs(r) >= thirtyDaysAgo,
  ).length;

  const totalMonthlySpend = Math.round(
    activeRows.reduce((s, r) => s + monthlyEquivalentUsd(r), 0),
  );

  const monthBuckets = lastSixMonthBuckets(now);
  const spendByMonth = monthBuckets.map(({ label, endMs }) => {
    const spend = activeRows
      .filter((r) => createdMs(r) <= endMs)
      .reduce((s, r) => s + monthlyEquivalentUsd(r), 0);
    return { month: label, spend: Math.round(spend) };
  });

  const monthlySpendSparkline = sparklineFromSpends(
    spendByMonth.map((m) => m.spend),
  );

  const buckets: Record<DashboardCategoryKey, number> = {
    software: 0,
    cloud: 0,
    design: 0,
    productivity: 0,
    other: 0,
  };
  for (const r of activeRows) {
    const cat = categorizeSaasName(r.name);
    buckets[cat] += monthlyEquivalentUsd(r);
  }
  const categoryBreakdown = categorySharesFromSpend(buckets);

  const upcomingRenewals = [...activeRows]
    .filter(
      (r) =>
        r.nextBillingAt && /^\d{4}-\d{2}-\d{2}$/.test(r.nextBillingAt.trim()),
    )
    .map((r) => ({
      id: r.id,
      name: r.name,
      amount: Math.round(renewalAmountUsd(r)),
      inDays: daysFromTodayToBillingDate(r.nextBillingAt.trim()),
    }))
    .filter((r) => r.inDays >= 0)
    .sort((a, b) => a.inDays - b.inDays)
    .slice(0, 3);

  const sortedByCreated = [...rows].sort(
    (a, b) => createdMs(b) - createdMs(a),
  );
  const latest = sortedByCreated[0];
  let recentActivity: DashboardOverview["recentActivity"] = null;
  if (latest) {
    const created = createdMs(latest);
    recentActivity = {
      title: "Subscription recorded",
      subtitle: `${latest.name} — ${formatRelativeTime(created, now.getTime())}`,
    };
  }

  return {
    activeSubscriptionsCount,
    activeSubscriptionsDeltaSinceLastMonth,
    totalMonthlySpend,
    lifetimeSavings: 0,
    spendByMonth,
    monthlySpendSparkline,
    categoryBreakdown,
    upcomingRenewals,
    recentActivity,
  };
}

function parseBillingInterval(raw: BillingInterval): CalendarBillingInterval {
  if (raw === "yearly" || raw === "monthly" || raw === "custom") {
    return raw;
  }
  return "monthly";
}

export function buildCalendarRenewalsFromSubscriptions(
  rows: SubscriptionRow[],
): CalendarRenewalItem[] {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const sorted = [...rows].sort((a, b) => {
    const na = a.nextBillingAt?.trim() ?? "";
    const nb = b.nextBillingAt?.trim() ?? "";
    return na.localeCompare(nb);
  });

  const renewals: CalendarRenewalItem[] = [];
  for (const r of sorted) {
    if (!isNonCancelledSubscription(r)) {
      continue;
    }
    const nb = r.nextBillingAt?.trim();
    if (!nb || !/^\d{4}-\d{2}-\d{2}$/.test(nb)) {
      continue;
    }

    const billingInterval = parseBillingInterval(r.interval);
    const amountUsd = renewalChargeUsd(r);
    renewals.push({
      subscriptionId: r.id,
      name: r.name,
      renewalDate: nb,
      billingInterval,
      amountUsd,
      amountFormatted: fmt.format(amountUsd),
      inDays: daysFromUtcToday(nb),
    });
  }

  return renewals;
}

function intervalPlanLabel(interval: SubscriptionRow["interval"]): string {
  if (interval === "yearly") {
    return "Yearly billing";
  }
  if (interval === "custom") {
    return "Custom billing";
  }
  return "Monthly billing";
}

function renewalDisplay(nextBillingAt: string | null | undefined): {
  label: string;
  urgent: boolean;
} {
  const nb = nextBillingAt?.trim();
  if (!nb || !/^\d{4}-\d{2}-\d{2}$/.test(nb)) {
    return { label: "—", urgent: false };
  }
  const days = daysFromUtcToday(nb);
  if (days >= 0 && days <= 7) {
    if (days === 0) {
      return { label: "today", urgent: true };
    }
    if (days === 1) {
      return { label: "in 1 day", urgent: true };
    }
    return { label: `in ${days} days`, urgent: true };
  }
  const d = new Date(`${nb}T12:00:00.000Z`);
  const label = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return { label, urgent: false };
}

function spendsCategoryDisplayName(key: SpendsCategoryKey): string {
  return SPENDS_CAT_LABEL[key];
}

function monthOverMonthPct(series: number[]): number | null {
  if (series.length < 2) {
    return null;
  }
  const last = series[series.length - 1] ?? 0;
  const prev = series[series.length - 2] ?? 0;
  if (prev === 0) {
    return null;
  }
  return Math.round(((last - prev) / prev) * 1000) / 10;
}

function emptySpends(months: SpendsMonthsWindow, now: Date): SpendsAnalytics {
  const spendByMonth = lastNMonthBuckets(now, months).map((b) => ({
    month: b.label,
    spend: 0,
  }));
  return {
    rangeMonths: months,
    spendByMonth,
    totalMonthlySpend: 0,
    monthOverMonthPercentChange: null,
    categoryBreakdown: [],
    highestSpends: [],
    savings: {
      monthlySavingsUsd: 0,
      cancelledSubscriptionsCount: 0,
      opportunities: [],
    },
  };
}

export function buildSpendsAnalyticsFromSubscriptions(
  rows: SubscriptionRow[],
  months: SpendsMonthsWindow,
  now = new Date(),
): SpendsAnalytics {
  const cancelledSubscriptionsCount = rows.filter(
    (r) => r.status.trim().toLowerCase() === "cancelled",
  ).length;

  if (rows.length === 0) {
    const empty = emptySpends(months, now);
    return {
      ...empty,
      savings: { ...empty.savings, cancelledSubscriptionsCount },
    };
  }

  const activeRows = rows.filter(isNonCancelledSubscription);

  const totalMonthlySpend = Math.round(
    activeRows.reduce((s, r) => s + monthlyEquivalentUsd(r), 0),
  );

  const monthBuckets = lastNMonthBuckets(now, months);
  const spendByMonth = monthBuckets.map(({ label, endMs }) => {
    const spend = activeRows
      .filter((r) => createdMs(r) <= endMs)
      .reduce((s, r) => s + monthlyEquivalentUsd(r), 0);
    return { month: label, spend: Math.round(spend) };
  });

  const mom = monthOverMonthPct(spendByMonth.map((m) => m.spend));

  const buckets: Record<SpendsCategoryKey, number> = {
    software: 0,
    productivity: 0,
    infra: 0,
    other: 0,
  };
  for (const r of activeRows) {
    const dashCat = categorizeSaasName(r.name);
    const sk = dashToSpendsCategory(dashCat);
    buckets[sk] += monthlyEquivalentUsd(r);
  }
  const categoryBreakdown = spendsSharesFromBuckets(buckets);

  const ranked = [...activeRows]
    .map((r) => {
      const monthly = monthlyEquivalentUsd(r);
      const dashCat = categorizeSaasName(r.name);
      const sk = dashToSpendsCategory(dashCat);
      const ren = renewalDisplay(r.nextBillingAt);
      return {
        subscriptionId: r.id,
        service: r.name,
        sub: intervalPlanLabel(r.interval),
        category: spendsCategoryDisplayName(sk),
        renewalLabel: ren.label,
        renewalUrgent: ren.urgent,
        cost: monthly,
        _rank: monthly,
      };
    })
    .sort((a, b) => b._rank - a._rank)
    .slice(0, 4);

  const highestSpends: SpendsHighestRow[] = ranked.map(
    ({
      subscriptionId,
      service,
      sub,
      category,
      renewalLabel,
      renewalUrgent,
      cost,
    }) => ({
      subscriptionId,
      service,
      sub,
      category,
      renewalLabel,
      renewalUrgent,
      cost: Math.round(cost * 100) / 100,
    }),
  );

  return {
    rangeMonths: months,
    spendByMonth,
    totalMonthlySpend,
    monthOverMonthPercentChange: mom,
    categoryBreakdown,
    highestSpends,
    savings: {
      monthlySavingsUsd: 0,
      cancelledSubscriptionsCount,
      opportunities: [],
    },
  };
}
