import { findOrCreateSaasByName } from "./saas";
import {
  backfillPrimaryWorkspaceEmailIfMissing,
  getPrimaryWorkspaceEmailId,
} from "./workspace-emails";

export type SubscriptionStatus =
  | "new"
  | "old"
  | "cancelled"
  | "expired"
  | "failed";

export type SubscriptionRow = {
  id: string;
  saasId: string;
  /** Catalog display name (from `saas.name`). */
  name: string;
  amount: string;
  interval: "monthly" | "yearly" | "custom";
  /** Next billing / renewal day, `YYYY-MM-DD` (also stored as `next_billing_at`). */
  nextBillingAt: string;
  status: SubscriptionStatus;
  /** ISO-ish datetime string when `status === 'cancelled'`. */
  cancelledAt?: string | null;
  /** Stored subscription cost in cents (for analytics). */
  costCents?: number;
  /** When the row was created (`subscriptions.created_at`). */
  createdAt?: string;
};

const MAX_NAME_LEN = 200;
const MAX_AMOUNT_LEN = 32;
const MAX_ID_LEN = 64;
/** Fills required `sub_type` for user-entered rows. */
const USER_ENTERED_SUB_TYPE = "entered" as const;

const ENTERED_STATUS = "new" as const;

function amountOk(s: string): boolean {
  const t = s.trim();
  if (!t) {
    return false;
  }
  const n = Number(t);
  return Number.isFinite(n) && n >= 0;
}

function amountStringToCostCents(amount: string): number {
  const n = Number(amount.trim());
  if (!Number.isFinite(n) || n < 0) {
    return 0;
  }
  return Math.round(n * 100);
}

function costCentsToAmountString(cost: number | null): string {
  if (cost === null || cost === undefined) {
    return "";
  }
  const dollars = cost / 100;
  if (!Number.isFinite(dollars)) {
    return "";
  }
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2);
}

function parseInterval(
  v: unknown,
): "monthly" | "yearly" | "custom" | null {
  if (v === "monthly" || v === "yearly" || v === "custom") {
    return v;
  }
  return null;
}

function isValidNextBillingDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return false;
  }
  const [y, m, d] = s.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  const dt = new Date(s + "T12:00:00.000Z");
  return (
    Number.isFinite(dt.getTime()) &&
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() + 1 === m &&
    dt.getUTCDate() === d
  );
}

export type ParseSubscriptionPayloadResult =
  | { ok: true; row: SubscriptionRow }
  | { ok: false; error: string };

/**
 * Validates one subscription object.
 * If `requireId` is false and `id` is missing, generates a new UUID.
 */
export function parseSubscriptionPayload(
  item: unknown,
  options: { requireId: boolean },
): ParseSubscriptionPayloadResult {
  if (!item || typeof item !== "object") {
    return { ok: false, error: "Expected JSON object" };
  }
  const o = item as Record<string, unknown>;
  let id =
    typeof o.id === "string" && o.id.trim() ? o.id.trim() : "";
  if (options.requireId) {
    if (!id || id.length > MAX_ID_LEN) {
      return { ok: false, error: "id is invalid" };
    }
  } else if (!id) {
    id = crypto.randomUUID();
  } else if (id.length > MAX_ID_LEN) {
    return { ok: false, error: "id is invalid" };
  }

  const name = typeof o.name === "string" ? o.name.trim() : "";
  const amount = typeof o.amount === "string" ? o.amount.trim() : "";
  const nextBillingAt =
    typeof o.nextBillingAt === "string" ? o.nextBillingAt.trim() : "";
  const interval = parseInterval(o.interval);

  if (!name || name.length > MAX_NAME_LEN) {
    return {
      ok: false,
      error: `name is required (max ${MAX_NAME_LEN} chars)`,
    };
  }
  if (!amount || amount.length > MAX_AMOUNT_LEN || !amountOk(amount)) {
    return {
      ok: false,
      error: "amount must be a valid non-negative number",
    };
  }
  if (!interval) {
    return {
      ok: false,
      error: "interval must be monthly, yearly, or custom",
    };
  }
  if (!nextBillingAt || !isValidNextBillingDate(nextBillingAt)) {
    return {
      ok: false,
      error: "nextBillingAt must be a valid date (YYYY-MM-DD)",
    };
  }

  return {
    ok: true,
    row: {
      id,
      saasId: "",
      name,
      amount,
      interval,
      nextBillingAt,
      status: ENTERED_STATUS,
    },
  };
}

/** PATCH body: editable fields only (not status). */
export type SubscriptionPatchFields = Pick<
  SubscriptionRow,
  "name" | "amount" | "interval" | "nextBillingAt"
>;

/** PATCH body: name, amount, interval, nextBillingAt only (no id). */
export function parseSubscriptionFieldsBody(
  body: unknown,
):
  | {
      ok: true;
      fields: SubscriptionPatchFields;
    }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected JSON object" };
  }
  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name.trim() : "";
  const amount = typeof o.amount === "string" ? o.amount.trim() : "";
  const nextBillingAt =
    typeof o.nextBillingAt === "string" ? o.nextBillingAt.trim() : "";
  const interval = parseInterval(o.interval);

  if (!name || name.length > MAX_NAME_LEN) {
    return {
      ok: false,
      error: `name is required (max ${MAX_NAME_LEN} chars)`,
    };
  }
  if (!amount || amount.length > MAX_AMOUNT_LEN || !amountOk(amount)) {
    return {
      ok: false,
      error: "amount must be a valid non-negative number",
    };
  }
  if (!interval) {
    return {
      ok: false,
      error: "interval must be monthly, yearly, or custom",
    };
  }
  if (!nextBillingAt || !isValidNextBillingDate(nextBillingAt)) {
    return {
      ok: false,
      error: "nextBillingAt must be a valid date (YYYY-MM-DD)",
    };
  }

  return {
    ok: true,
    fields: {
      name,
      amount,
      interval,
      nextBillingAt,
    },
  };
}

function normalizeNextBillingAt(raw: string | null | undefined): string {
  if (!raw) {
    return "";
  }
  const t = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(t)) {
    return t.slice(0, 10);
  }
  return t;
}

function parseSubscriptionStatus(raw: string | null): SubscriptionStatus {
  if (
    raw === "new" ||
    raw === "old" ||
    raw === "cancelled" ||
    raw === "expired" ||
    raw === "failed"
  ) {
    return raw;
  }
  return "old";
}

function mapDbRowToSubscriptionRow(r: {
  sid: string;
  saas_id: string;
  saas_name: string;
  cost: number | null;
  billing_interval: string | null;
  next_billing_at: string | null;
  status: string | null;
  cancelled_at: string | null;
  created_at?: string | null;
}): SubscriptionRow | null {
  const interval = parseInterval(r.billing_interval ?? "monthly");
  if (!interval) {
    return null;
  }
  const nb = normalizeNextBillingAt(r.next_billing_at);
  const status = parseSubscriptionStatus(r.status);
  const row: SubscriptionRow = {
    id: r.sid,
    saasId: r.saas_id,
    name: r.saas_name,
    amount: costCentsToAmountString(r.cost),
    interval,
    nextBillingAt: nb && isValidNextBillingDate(nb) ? nb : "",
    status,
    cancelledAt: r.cancelled_at?.trim() || null,
    costCents: r.cost ?? 0,
  };
  const ca = r.created_at?.trim();
  if (ca) {
    row.createdAt = ca;
  }
  return row;
}

async function resolvePrimaryWorkspaceEmailForWorkspace(
  db: D1Database,
  workspaceId: string,
  ownerUserId: string,
): Promise<
  | { ok: true; workspaceEmailId: string }
  | { ok: false; reason: "no_user_email" }
> {
  let workspaceEmailId = await getPrimaryWorkspaceEmailId(db, workspaceId);
  if (!workspaceEmailId) {
    const backfill = await backfillPrimaryWorkspaceEmailIfMissing(
      db,
      workspaceId,
      ownerUserId,
    );
    if (!backfill.ok) {
      return { ok: false, reason: "no_user_email" };
    }
    workspaceEmailId = backfill.id;
  }

  return { ok: true, workspaceEmailId };
}

export async function listSubscriptionsForWorkspace(
  db: D1Database,
  workspaceId: string,
): Promise<SubscriptionRow[]> {
  const res = await db
    .prepare(
      `SELECT s.id AS sid, s.saas_id, sa.name AS saas_name, s.cost,
              s.billing_interval, s.next_billing_at, s.status, s.cancelled_at, s.created_at
       FROM subscriptions s
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE s.workspace_id = ?
       ORDER BY s.created_at ASC`,
    )
    .bind(workspaceId)
    .all<{
      sid: string;
      saas_id: string;
      saas_name: string;
      cost: number | null;
      billing_interval: string | null;
      next_billing_at: string | null;
      status: string | null;
      cancelled_at: string | null;
      created_at?: string | null;
    }>();

  const out: SubscriptionRow[] = [];
  for (const r of res.results ?? []) {
    const mapped = mapDbRowToSubscriptionRow(r);
    if (mapped) {
      out.push(mapped);
    }
  }
  return out;
}

async function getSubscriptionRowByIdForWorkspace(
  db: D1Database,
  workspaceId: string,
  subscriptionId: string,
): Promise<SubscriptionRow | null> {
  const r = await db
    .prepare(
      `SELECT s.id AS sid, s.saas_id, sa.name AS saas_name, s.cost,
              s.billing_interval, s.next_billing_at, s.status, s.cancelled_at, s.created_at
       FROM subscriptions s
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE s.id = ? AND s.workspace_id = ?`,
    )
    .bind(subscriptionId, workspaceId)
    .first<{
      sid: string;
      saas_id: string;
      saas_name: string;
      cost: number | null;
      billing_interval: string | null;
      next_billing_at: string | null;
      status: string | null;
      cancelled_at: string | null;
      created_at: string | null;
    }>();
  if (!r) {
    return null;
  }
  return mapDbRowToSubscriptionRow(r);
}

export async function createSubscriptionForWorkspace(
  db: D1Database,
  workspaceId: string,
  createdByUserId: string,
  body: { id: string; name: string; amount: string; interval: string; nextBillingAt: string },
): Promise<
  { ok: true }
> {

  const saas = await findOrCreateSaasByName(db, body.name);
  const costCents = amountStringToCostCents(body.amount);

  await db
    .prepare(
      `INSERT INTO subscriptions (
         id, created_by, workspace_id, saas_id, sub_type, status,
         cost, currency, billing_interval, subscribed_at,
         next_billing_at,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, 'USD', ?, datetime('now'), ?, datetime('now'), datetime('now'))`,
    )
    .bind(
      body.id,
      createdByUserId,
      workspaceId,
      saas.id,
      USER_ENTERED_SUB_TYPE,
      ENTERED_STATUS,
      costCents,
      body.interval,
      body.nextBillingAt,
    )
    .run();

  return { ok: true };
}

export async function updateSubscriptionForWorkspace(
  db: D1Database,
  workspaceId: string,
  subscriptionId: string,
  body: { name: string; amount: string; interval: string; nextBillingAt: string },
): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const existing = await getSubscriptionRowByIdForWorkspace(
    db,
    workspaceId,
    subscriptionId,
  );
  if (!existing) {
    return { ok: false, error: "Subscription not found" } as const;
  }
  if (existing.status === "cancelled") {
    return { ok: false, error: "Cancelled subscriptions cannot be edited." } as const;
  }

  const saas = await findOrCreateSaasByName(db, body.name);
  const costCents = amountStringToCostCents(body.amount);

  await db
    .prepare(
      `UPDATE subscriptions SET
         saas_id = ?,
         cost = ?,
         billing_interval = ?,
         next_billing_at = ?,
         updated_at = datetime('now')
       WHERE id = ?
       AND workspace_id = ?
       `,
    )
    .bind(
      saas.id,
      costCents,
      body.interval,
      body.nextBillingAt,
      subscriptionId,
      workspaceId,
    )
    .run();

  return { ok: true };
}

export async function deleteSubscriptionForWorkspace(
  db: D1Database,
  workspaceId: string,
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getSubscriptionRowByIdForWorkspace(
    db,
    workspaceId,
    subscriptionId,
  );
  if (!existing) {
    return { ok: false, error: "Subscription not found" } as const;
  }
  await db
    .prepare(
      `DELETE FROM subscriptions
       WHERE id = ?
       AND workspace_id = ?
       `,
    )
    .bind(subscriptionId, workspaceId)
    .run();
  return { ok: true };
}

export async function cancelSubscriptionForWorkspace(
  db: D1Database,
  workspaceId: string,
  subscriptionId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const existing = await getSubscriptionRowByIdForWorkspace(
    db,
    workspaceId,
    subscriptionId,
  );
  if (!existing) {
    return { ok: false, error: "Subscription not found" } as const;
  }
  if (existing.status === "cancelled") {
    return { ok: false, error: "Cancelled subscriptions cannot be cancelled." } as const;
  }

  await db
    .prepare(
      `UPDATE subscriptions SET
         status = 'cancelled',
         cancelled_at = datetime('now'),
         updated_at = datetime('now')
       WHERE id = ?
       AND workspace_id = ?
       `,
    )
    .bind(subscriptionId, workspaceId)
    .run();

  return { ok: true };
}
