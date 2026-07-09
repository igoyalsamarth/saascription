export type ReminderSubscriptionRow = {
  id: string;
  saasName: string;
  costCents: number | null;
  currency: string;
  billingInterval: string;
  nextBillingAt: string;
  workspaceName: string | null;
};

export type NextDaySubscriptionDetail = ReminderSubscriptionRow & {
  recipientEmail: string;
  recipientName: string | null;
};

const ACTIVE_STATUSES = "('new', 'old')";

export async function listUserIdsForMonthlyReminders(
  db: D1Database,
): Promise<string[]> {
  const res = await db
    .prepare(
      `SELECT DISTINCT w.owner_user_id AS user_id
       FROM workspaces w
       INNER JOIN subscriptions s ON s.workspace_id = w.id
       WHERE s.status IN ${ACTIVE_STATUSES}
         AND s.next_billing_at IS NOT NULL
         AND trim(s.next_billing_at) != ''
         AND date(s.next_billing_at) >= date('now')
         AND strftime('%Y-%m', s.next_billing_at) = strftime('%Y-%m', 'now')`,
    )
    .all<{ user_id: string }>();

  return (res.results ?? []).map((r) => r.user_id);
}

export async function listSubscriptionIdsForNextDayReminders(
  db: D1Database,
): Promise<string[]> {
  const res = await db
    .prepare(
      `SELECT s.id
       FROM subscriptions s
       WHERE s.status IN ${ACTIVE_STATUSES}
         AND s.next_billing_at IS NOT NULL
         AND trim(s.next_billing_at) != ''
         AND date(s.next_billing_at) >= date('now', '+1 day')
         AND date(s.next_billing_at) <= date('now', '+2 days')`,
    )
    .all<{ id: string }>();

  return (res.results ?? []).map((r) => r.id);
}

export async function getUpcomingSubscriptionsForUser(
  db: D1Database,
  userId: string,
): Promise<
  | {
      ok: true;
      email: string;
      name: string | null;
      subscriptions: ReminderSubscriptionRow[];
    }
  | { ok: false; reason: "user_not_found" | "no_subscriptions" }
> {
  const user = await db
    .prepare(`SELECT email, name FROM users WHERE id = ?`)
    .bind(userId)
    .first<{ email: string; name: string | null }>();

  if (!user?.email) {
    return { ok: false, reason: "user_not_found" };
  }

  const res = await db
    .prepare(
      `SELECT s.id, sa.name AS saas_name, s.cost, s.currency, s.billing_interval,
              s.next_billing_at, w.name AS workspace_name
       FROM subscriptions s
       INNER JOIN workspaces w ON w.id = s.workspace_id
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE w.owner_user_id = ?
         AND s.status IN ${ACTIVE_STATUSES}
         AND s.next_billing_at IS NOT NULL
         AND trim(s.next_billing_at) != ''
         AND date(s.next_billing_at) >= date('now')
       ORDER BY s.next_billing_at ASC`,
    )
    .bind(userId)
    .all<{
      id: string;
      saas_name: string;
      cost: number | null;
      currency: string;
      billing_interval: string | null;
      next_billing_at: string;
      workspace_name: string | null;
    }>();

  const subscriptions = (res.results ?? []).map((r) => ({
    id: r.id,
    saasName: r.saas_name,
    costCents: r.cost,
    currency: r.currency,
    billingInterval: r.billing_interval ?? "monthly",
    nextBillingAt: r.next_billing_at.slice(0, 10),
    workspaceName: r.workspace_name,
  }));

  if (subscriptions.length === 0) {
    return { ok: false, reason: "no_subscriptions" };
  }

  return {
    ok: true,
    email: user.email,
    name: user.name,
    subscriptions,
  };
}

export async function getSubscriptionForNextDayReminder(
  db: D1Database,
  subscriptionId: string,
): Promise<
  | { ok: true; detail: NextDaySubscriptionDetail }
  | { ok: false; reason: "not_found" | "inactive" | "outside_window" }
> {
  const row = await db
    .prepare(
      `SELECT s.id, s.status, sa.name AS saas_name, s.cost, s.currency,
              s.billing_interval, s.next_billing_at, w.name AS workspace_name,
              u.email AS recipient_email, u.name AS recipient_name
       FROM subscriptions s
       INNER JOIN workspaces w ON w.id = s.workspace_id
       INNER JOIN users u ON u.id = w.owner_user_id
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE s.id = ?`,
    )
    .bind(subscriptionId)
    .first<{
      id: string;
      status: string;
      saas_name: string;
      cost: number | null;
      currency: string;
      billing_interval: string | null;
      next_billing_at: string | null;
      workspace_name: string | null;
      recipient_email: string;
      recipient_name: string | null;
    }>();

  if (!row) {
    return { ok: false, reason: "not_found" };
  }

  if (row.status !== "new" && row.status !== "old") {
    return { ok: false, reason: "inactive" };
  }

  const nextBillingAt = row.next_billing_at?.trim().slice(0, 10) ?? "";
  if (!nextBillingAt) {
    return { ok: false, reason: "inactive" };
  }

  const windowCheck = await db
    .prepare(
      `SELECT 1 AS ok
       WHERE date(?) >= date('now', '+1 day')
         AND date(?) <= date('now', '+2 days')`,
    )
    .bind(nextBillingAt, nextBillingAt)
    .first<{ ok: number }>();

  if (!windowCheck) {
    return { ok: false, reason: "outside_window" };
  }

  if (!row.recipient_email) {
    return { ok: false, reason: "not_found" };
  }

  return {
    ok: true,
    detail: {
      id: row.id,
      saasName: row.saas_name,
      costCents: row.cost,
      currency: row.currency,
      billingInterval: row.billing_interval ?? "monthly",
      nextBillingAt,
      workspaceName: row.workspace_name,
      recipientEmail: row.recipient_email,
      recipientName: row.recipient_name,
    },
  };
}
