import { getWorkspaceForOwner } from "./workspaces";

export type SpendsCategoryKey = "software" | "productivity" | "infra" | "other";

export type SpendsMonthsWindow = 3 | 6 | 12;

export type SpendsHighestRow = {
  subscriptionId: string;
  service: string;
  sub: string;
  category: string;
  renewalLabel: string;
  renewalUrgent: boolean;
  /** Normalized monthly USD for ranking and display. */
  cost: number;
};

export type SpendsOpportunity = {
  title: string;
  subtitle: string;
};

export type SpendsAnalyticsPayload = {
  rangeMonths: SpendsMonthsWindow;
  spendByMonth: { month: string; spend: number }[];
  /** Portfolio normalized monthly spend (active subs). */
  totalMonthlySpend: number;
  /** Compare last month in series vs prior; null if not meaningful. */
  monthOverMonthPercentChange: number | null;
  categoryBreakdown: {
    name: string;
    value: number;
    key: SpendsCategoryKey;
  }[];
  highestSpends: SpendsHighestRow[];
  savings: {
    monthlySavingsUsd: number;
    cancelledSubscriptionsCount: number;
    opportunities: SpendsOpportunity[];
  };
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

type DashCat = "software" | "cloud" | "design" | "productivity" | "other";

const SPENDS_CAT_LABEL: Record<SpendsCategoryKey, string> = {
  software: "Software & SaaS",
  productivity: "Productivity",
  infra: "Infrastructure",
  other: "Other",
};

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

function categorizeSaasName(name: string): DashCat {
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

function dashToSpendsCategory(d: DashCat): SpendsCategoryKey {
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

function spendsCategoryDisplayName(key: SpendsCategoryKey): string {
  return SPENDS_CAT_LABEL[key];
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

function intervalPlanLabel(billingInterval: string | null): string {
  const v = billingInterval?.trim().toLowerCase();
  if (v === "yearly") {
    return "Yearly billing";
  }
  if (v === "custom") {
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

function monthOverMonthPct(series: number[]): number | null {
  if (series.length < 2) {
    return null;
  }
  const last = series[series.length - 1] ?? 0;
  const prev = series[series.length - 2] ?? 0;
  if (prev === 0) {
    return last === 0 ? null : null;
  }
  return Math.round(((last - prev) / prev) * 1000) / 10;
}

function parseMonths(raw: string | undefined): SpendsMonthsWindow {
  const n = Number.parseInt(raw ?? "6", 10);
  if (n === 3 || n === 6 || n === 12) {
    return n;
  }
  return 6;
}

function emptyPayload(
  months: SpendsMonthsWindow,
  now: Date,
): SpendsAnalyticsPayload {
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

export async function buildSpendsAnalytics(
  db: D1Database,
  ownerUserId: string,
  months: SpendsMonthsWindow,
): Promise<SpendsAnalyticsPayload> {
  const now = new Date();
  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return emptyPayload(months, now);
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
  const cancelledSubscriptionsCount = rows.filter(
    (r) => r.status?.trim().toLowerCase() === "cancelled",
  ).length;

  if (rows.length === 0) {
    const empty = emptyPayload(months, now);
    return {
      ...empty,
      savings: { ...empty.savings, cancelledSubscriptionsCount },
    };
  }

  const activeRows = rows.filter(isNonCancelledSubscription);

  const totalMonthlySpend = Math.round(
    activeRows.reduce(
      (s, r) => s + monthlyEquivalentUsd(r.cost, r.billing_interval),
      0,
    ),
  );

  const monthBuckets = lastNMonthBuckets(now, months);
  const spendByMonth = monthBuckets.map(({ label, endMs }) => {
    const spend = activeRows
      .filter((r) => parseSqliteUtcDate(r.created_at).getTime() <= endMs)
      .reduce(
        (s, r) => s + monthlyEquivalentUsd(r.cost, r.billing_interval),
        0,
      );
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
    const dashCat = categorizeSaasName(r.saas_name);
    const sk = dashToSpendsCategory(dashCat);
    buckets[sk] += monthlyEquivalentUsd(r.cost, r.billing_interval);
  }
  const categoryBreakdown = spendsSharesFromBuckets(buckets);

  const ranked = [...activeRows]
    .map((r) => {
      const monthly = monthlyEquivalentUsd(r.cost, r.billing_interval);
      const dashCat = categorizeSaasName(r.saas_name);
      const sk = dashToSpendsCategory(dashCat);
      const ren = renewalDisplay(r.next_billing_at);
      return {
        subscriptionId: r.sid,
        service: r.saas_name,
        sub: intervalPlanLabel(r.billing_interval),
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

export function parseSpendsMonthsQuery(
  q: string | undefined,
): SpendsMonthsWindow {
  return parseMonths(q);
}
