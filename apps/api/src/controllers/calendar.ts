import { getWorkspaceForOwner } from "./workspaces";

export type CalendarBillingInterval = "monthly" | "yearly" | "custom";

export type CalendarRenewalItem = {
  subscriptionId: string;
  name: string;
  /** `YYYY-MM-DD` local calendar date for display. */
  renewalDate: string;
  billingInterval: CalendarBillingInterval;
  /** Charge for this renewal period in USD (whole dollars + cents). */
  amountUsd: number;
  amountFormatted: string;
  /** Days until renewal from UTC “today”; negative if overdue. */
  inDays: number;
};

export type CalendarPayload = {
  renewals: CalendarRenewalItem[];
};

type SubscriptionCalRow = {
  sid: string;
  saas_name: string;
  cost: number | null;
  billing_interval: string | null;
  next_billing_at: string | null;
  status: string | null;
  cancelled_at: string | null;
};

function parseBillingInterval(raw: string | null): CalendarBillingInterval {
  if (raw === "yearly" || raw === "monthly" || raw === "custom") {
    return raw;
  }
  return "monthly";
}

function renewalChargeUsd(
  costCents: number | null,
  billingInterval: string | null,
): number {
  const dollars = Math.max(0, (costCents ?? 0) / 100);
  if (billingInterval === "yearly") {
    return dollars;
  }
  return dollars;
}

function isCalendarEligibleRow(row: SubscriptionCalRow): boolean {
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

export async function buildCalendarPayload(
  db: D1Database,
  ownerUserId: string,
): Promise<CalendarPayload> {
  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return { renewals: [] };
  }

  const res = await db
    .prepare(
      `SELECT s.id AS sid, sa.name AS saas_name, s.cost, s.billing_interval, s.next_billing_at,
              s.status, s.cancelled_at
       FROM subscriptions s
       INNER JOIN workspace_emails we ON we.id = s.workspace_email_id
       INNER JOIN workspaces w ON w.id = we.workspace_id
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE w.owner_user_id = ?
       ORDER BY s.next_billing_at ASC`,
    )
    .bind(ownerUserId)
    .all<SubscriptionCalRow>();

  const rows = res.results ?? [];
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  const renewals: CalendarRenewalItem[] = [];
  for (const r of rows) {
    if (!isCalendarEligibleRow(r)) {
      continue;
    }
    const nb = r.next_billing_at?.trim();
    if (!nb || !/^\d{4}-\d{2}-\d{2}$/.test(nb)) {
      continue;
    }

    const billingInterval = parseBillingInterval(r.billing_interval);
    const amountUsd = renewalChargeUsd(r.cost, r.billing_interval);
    renewals.push({
      subscriptionId: r.sid,
      name: r.saas_name,
      renewalDate: nb,
      billingInterval,
      amountUsd,
      amountFormatted: fmt.format(amountUsd),
      inDays: daysFromUtcToday(nb),
    });
  }

  return { renewals };
}
