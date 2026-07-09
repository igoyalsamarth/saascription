const ACTIVE_STATUSES = "('new', 'old')";

export type RolloverSubscriptionRow = {
  id: string;
  status: string;
  costCents: number | null;
  currency: string;
  billingInterval: string;
  nextBillingAt: string;
};

export async function listSubscriptionIdsForAutoRollover(
  db: D1Database,
): Promise<string[]> {
  const res = await db
    .prepare(
      `SELECT s.id
       FROM subscriptions s
       WHERE s.status IN ${ACTIVE_STATUSES}
         AND s.next_billing_at IS NOT NULL
         AND trim(s.next_billing_at) != ''
         AND date(s.next_billing_at) <= date('now')
         AND s.billing_interval != 'custom'`,
    )
    .all<{ id: string }>();

  return (res.results ?? []).map((r) => r.id);
}

export async function getSubscriptionForRollover(
  db: D1Database,
  subscriptionId: string,
): Promise<
  | { ok: true; subscription: RolloverSubscriptionRow }
  | {
      ok: false;
      reason: "not_found" | "inactive" | "custom_interval" | "not_due";
    }
> {
  const row = await db
    .prepare(
      `SELECT s.id, s.status, s.cost, s.currency, s.billing_interval, s.next_billing_at
       FROM subscriptions s
       WHERE s.id = ?`,
    )
    .bind(subscriptionId)
    .first<{
      id: string;
      status: string;
      cost: number | null;
      currency: string;
      billing_interval: string | null;
      next_billing_at: string | null;
    }>();

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  if (row.status !== "new" && row.status !== "old") {
    return { ok: false, reason: "inactive" };
  }

  const billingInterval = row.billing_interval ?? "monthly";
  if (billingInterval === "custom") {
    return { ok: false, reason: "custom_interval" };
  }

  const nextBillingAt = row.next_billing_at?.trim().slice(0, 10) ?? "";
  if (!nextBillingAt) {
    return { ok: false, reason: "inactive" };
  }

  const dueCheck = await db
    .prepare(`SELECT 1 AS ok WHERE date(?) <= date('now')`)
    .bind(nextBillingAt)
    .first<{ ok: number }>();

  if (!dueCheck) {
    return { ok: false, reason: "not_due" };
  }

  return {
    ok: true,
    subscription: {
      id: row.id,
      status: row.status,
      costCents: row.cost,
      currency: row.currency,
      billingInterval,
      nextBillingAt,
    },
  };
}
