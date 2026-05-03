import { getWorkspaceForOwner } from "./workspaces";

export type DashboardCategoryKey =
  | "software"
  | "cloud"
  | "design"
  | "productivity"
  | "other";

export type DashboardOverviewPayload = {
  activeSubscriptionsCount: number;
  /** Subscriptions created in the last 30 days (active status only). */
  activeSubscriptionsDeltaSinceLastMonth: number;
  /** Estimated normalized monthly spend in whole USD (non-cancelled subs only). */
  totalMonthlySpend: number;
  /** Whole USD; hardcoded at 0 until real optimization metrics exist. */
  lifetimeSavings: number;
  spendByMonth: { month: string; spend: number }[];
  monthlySpendSparkline: { i: number; v: number }[];
  categoryBreakdown: {
    name: string;
    value: number;
    key: DashboardCategoryKey;
  }[];
  upcomingRenewals: {
    id: string;
    name: string;
    amount: number;
    inDays: number;
  }[];
  recentActivity: { title: string; subtitle: string } | null;
};

type SubscriptionAggRow = {
  sid: string;
  saas_name: string;
  cost: number | null;
  billing_interval: string | null;
  next_billing_at: string | null;
  status: string | null;
  cancelled_at: string | null;
  created_at: string;
};

const CATEGORY_LABEL: Record<DashboardCategoryKey, string> = {
  software: "Software",
  cloud: "Cloud",
  design: "Design",
  productivity: "Productivity",
  other: "Other",
};

/** Rows that still incur (or are modeled as) recurring spend — excludes cancelled/expired/failed and any row with cancelled_at set. */
function isNonCancelledSubscription(row: SubscriptionAggRow): boolean {
  if (row.cancelled_at?.trim()) {
    return false;
  }
  const s = row.status?.trim().toLowerCase();
  if (!s) {
    return false;
  }
  if (s === "cancelled" || s === "expired" || s === "failed") {
    return false;
  }
  return s === "new" || s === "old";
}

function monthlyEquivalentUsd(
  costCents: number | null,
  billingInterval: string | null,
): number {
  const dollars = Math.max(0, (costCents ?? 0) / 100);
  if (billingInterval === "yearly") {
    return dollars / 12;
  }
  return dollars;
}

/** Renewal charge shown in the UI: one billing period in USD. */
function renewalAmountUsd(
  costCents: number | null,
  billingInterval: string | null,
): number {
  const dollars = Math.max(0, (costCents ?? 0) / 100);
  if (billingInterval === "yearly") {
    return dollars;
  }
  return dollars;
}

function parseSqliteUtcDate(s: string): Date {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return new Date(`${t}T12:00:00.000Z`);
  }
  const iso = t.includes("T") ? t : `${t.replace(" ", "T")}Z`;
  return new Date(iso);
}

function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
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

function emptyOverview(now: Date): DashboardOverviewPayload {
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

export async function buildDashboardOverview(
  db: D1Database,
  ownerUserId: string,
): Promise<DashboardOverviewPayload> {
  const now = new Date();
  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return emptyOverview(now);
  }

  const res = await db
    .prepare(
      `SELECT s.id AS sid, sa.name AS saas_name, s.cost, s.billing_interval, s.next_billing_at,
              s.status, s.cancelled_at, s.created_at
       FROM subscriptions s
       INNER JOIN workspace_emails we ON we.id = s.workspace_email_id
       INNER JOIN workspaces w ON w.id = we.workspace_id
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE w.owner_user_id = ?
       ORDER BY s.created_at ASC`,
    )
    .bind(ownerUserId)
    .all<SubscriptionAggRow>();

  const rows = res.results ?? [];
  if (rows.length === 0) {
    return emptyOverview(now);
  }

  const activeRows = rows.filter(isNonCancelledSubscription);
  const activeSubscriptionsCount = activeRows.length;

  const thirtyDaysAgo = now.getTime() - 30 * 86_400_000;
  const activeSubscriptionsDeltaSinceLastMonth = activeRows.filter(
    (r) => parseSqliteUtcDate(r.created_at).getTime() >= thirtyDaysAgo,
  ).length;

  const totalMonthlySpend = Math.round(
    activeRows.reduce(
      (s, r) => s + monthlyEquivalentUsd(r.cost, r.billing_interval),
      0,
    ),
  );

  const monthBuckets = lastSixMonthBuckets(now);
  const spendByMonth = monthBuckets.map(({ label, endMs }) => {
    const spend = activeRows
      .filter((r) => parseSqliteUtcDate(r.created_at).getTime() <= endMs)
      .reduce(
        (s, r) => s + monthlyEquivalentUsd(r.cost, r.billing_interval),
        0,
      );
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
    const cat = categorizeSaasName(r.saas_name);
    buckets[cat] += monthlyEquivalentUsd(r.cost, r.billing_interval);
  }
  const categoryBreakdown = categorySharesFromSpend(buckets);

  const upcomingRenewals = [...activeRows]
    .filter(
      (r) => r.next_billing_at && /^\d{4}-\d{2}-\d{2}$/.test(r.next_billing_at),
    )
    .map((r) => ({
      id: r.sid,
      name: r.saas_name,
      amount: Math.round(renewalAmountUsd(r.cost, r.billing_interval)),
      inDays: daysFromTodayToBillingDate(r.next_billing_at as string),
    }))
    .filter((r) => r.inDays >= 0)
    .sort((a, b) => a.inDays - b.inDays)
    .slice(0, 3);

  const sortedByCreated = [...rows].sort(
    (a, b) =>
      parseSqliteUtcDate(b.created_at).getTime() -
      parseSqliteUtcDate(a.created_at).getTime(),
  );
  const latest = sortedByCreated[0];
  let recentActivity: DashboardOverviewPayload["recentActivity"] = null;
  if (latest) {
    const createdMs = parseSqliteUtcDate(latest.created_at).getTime();
    recentActivity = {
      title: "Subscription recorded",
      subtitle: `${latest.saas_name} — ${formatRelativeTime(createdMs, now.getTime())}`,
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
