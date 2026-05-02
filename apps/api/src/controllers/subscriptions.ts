import { findOrCreateSaasByName } from "./saas";
import {
  backfillPrimaryWorkspaceEmailIfMissing,
  getPrimaryWorkspaceEmailId,
} from "./workspace-emails";
import { getWorkspaceForOwner } from "./workspaces";

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
};

const MAX_ROWS = 200;
const MAX_NAME_LEN = 200;
const MAX_AMOUNT_LEN = 32;
const MAX_ID_LEN = 64;
/** Fills required `sub_type` for user-entered rows. */
const USER_ENTERED_SUB_TYPE = "entered" as const;

const ENTERED_STATUS = "old" as const;

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
}): SubscriptionRow | null {
  const interval = parseInterval(r.billing_interval ?? "monthly");
  if (!interval) {
    return null;
  }
  const nb = normalizeNextBillingAt(r.next_billing_at);
  const status = parseSubscriptionStatus(r.status);
  return {
    id: r.sid,
    saasId: r.saas_id,
    name: r.saas_name,
    amount: costCentsToAmountString(r.cost),
    interval,
    nextBillingAt: nb && isValidNextBillingDate(nb) ? nb : "",
    status,
    cancelledAt: r.cancelled_at?.trim() || null,
  };
}

async function resolveWorkspaceMailForOwner(
  db: D1Database,
  ownerUserId: string,
): Promise<
  | { ok: true; wsId: string; workspaceEmailId: string }
  | "no_workspace"
  | "no_user_email"
> {
  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return "no_workspace";
  }

  let workspaceEmailId = await getPrimaryWorkspaceEmailId(db, ws.id);
  if (!workspaceEmailId) {
    const backfill = await backfillPrimaryWorkspaceEmailIfMissing(
      db,
      ws.id,
      ownerUserId,
    );
    if (!backfill.ok) {
      return "no_user_email";
    }
    workspaceEmailId = backfill.id;
  }

  return { ok: true, wsId: ws.id, workspaceEmailId };
}

async function countSubscriptionsForWorkspace(
  db: D1Database,
  workspaceId: string,
): Promise<number> {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM subscriptions s
       INNER JOIN workspace_emails we ON we.id = s.workspace_email_id
       WHERE we.workspace_id = ?`,
    )
    .bind(workspaceId)
    .first<{ c: number }>();
  return row?.c ?? 0;
}

export async function listSubscriptionsForOwner(
  db: D1Database,
  ownerUserId: string,
): Promise<SubscriptionRow[] | "no_workspace"> {
  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return "no_workspace";
  }

  const res = await db
    .prepare(
      `SELECT s.id AS sid, s.saas_id, sa.name AS saas_name, s.cost,
              s.billing_interval, s.next_billing_at, s.status, s.cancelled_at
       FROM subscriptions s
       INNER JOIN workspace_emails we ON we.id = s.workspace_email_id
       INNER JOIN workspaces w ON w.id = we.workspace_id
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE w.owner_user_id = ?
       ORDER BY s.created_at ASC`,
    )
    .bind(ownerUserId)
    .all<{
      sid: string;
      saas_id: string;
      saas_name: string;
      cost: number | null;
      billing_interval: string | null;
      next_billing_at: string | null;
      status: string | null;
      cancelled_at: string | null;
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

async function getSubscriptionRowByIdForOwner(
  db: D1Database,
  ownerUserId: string,
  subscriptionId: string,
): Promise<SubscriptionRow | null> {
  const r = await db
    .prepare(
      `SELECT s.id AS sid, s.saas_id, sa.name AS saas_name, s.cost,
              s.billing_interval, s.next_billing_at, s.status, s.cancelled_at
       FROM subscriptions s
       INNER JOIN workspace_emails we ON we.id = s.workspace_email_id
       INNER JOIN workspaces w ON w.id = we.workspace_id
       INNER JOIN saas sa ON sa.id = s.saas_id
       WHERE s.id = ? AND w.owner_user_id = ?`,
    )
    .bind(subscriptionId, ownerUserId)
    .first<{
      sid: string;
      saas_id: string;
      saas_name: string;
      cost: number | null;
      billing_interval: string | null;
      next_billing_at: string | null;
      status: string | null;
      cancelled_at: string | null;
    }>();
  if (!r) {
    return null;
  }
  return mapDbRowToSubscriptionRow(r);
}

export async function createSubscriptionForOwner(
  db: D1Database,
  ownerUserId: string,
  row: SubscriptionRow,
): Promise<
  SubscriptionRow | "no_workspace" | "no_user_email" | "limit_reached"
> {
  const ctx = await resolveWorkspaceMailForOwner(db, ownerUserId);
  if (ctx === "no_workspace" || ctx === "no_user_email") {
    return ctx;
  }

  const n = await countSubscriptionsForWorkspace(db, ctx.wsId);
  if (n >= MAX_ROWS) {
    return "limit_reached";
  }

  const saas = await findOrCreateSaasByName(db, row.name);
  const costCents = amountStringToCostCents(row.amount);

  await db
    .prepare(
      `INSERT INTO subscriptions (
         id, workspace_email_id, saas_id, sub_type, status,
         cost, currency, billing_interval, subscribed_at,
         next_billing_at,
         created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, datetime('now'), ?, datetime('now'), datetime('now'))`,
    )
    .bind(
      row.id,
      ctx.workspaceEmailId,
      saas.id,
      USER_ENTERED_SUB_TYPE,
      ENTERED_STATUS,
      costCents,
      row.interval,
      row.nextBillingAt,
    )
    .run();

  const fresh = await getSubscriptionRowByIdForOwner(db, ownerUserId, row.id);
  return (
    fresh ?? {
      id: row.id,
      saasId: saas.id,
      name: saas.name,
      amount: row.amount,
      interval: row.interval,
      nextBillingAt: row.nextBillingAt,
      status: ENTERED_STATUS,
      cancelledAt: null,
    }
  );
}

export async function updateSubscriptionForOwner(
  db: D1Database,
  ownerUserId: string,
  subscriptionId: string,
  fields: SubscriptionPatchFields,
): Promise<
  SubscriptionRow | "no_workspace" | "not_found" | "cannot_edit_cancelled"
> {
  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return "no_workspace";
  }

  const existing = await getSubscriptionRowByIdForOwner(
    db,
    ownerUserId,
    subscriptionId,
  );
  if (!existing) {
    return "not_found";
  }
  if (existing.status === "cancelled") {
    return "cannot_edit_cancelled";
  }

  const saas = await findOrCreateSaasByName(db, fields.name);
  const costCents = amountStringToCostCents(fields.amount);

  await db
    .prepare(
      `UPDATE subscriptions SET
         saas_id = ?,
         cost = ?,
         billing_interval = ?,
         next_billing_at = ?,
         updated_at = datetime('now')
       WHERE id = ?
       AND workspace_email_id IN (
         SELECT we.id FROM workspace_emails we
         INNER JOIN workspaces w ON w.id = we.workspace_id
         WHERE w.owner_user_id = ?
       )`,
    )
    .bind(
      saas.id,
      costCents,
      fields.interval,
      fields.nextBillingAt,
      subscriptionId,
      ownerUserId,
    )
    .run();

  const fresh = await getSubscriptionRowByIdForOwner(
    db,
    ownerUserId,
    subscriptionId,
  );
  return fresh ?? "not_found";
}

export async function deleteSubscriptionForOwner(
  db: D1Database,
  ownerUserId: string,
  subscriptionId: string,
): Promise<boolean> {
  const res = await db
    .prepare(
      `DELETE FROM subscriptions
       WHERE id = ?
       AND workspace_email_id IN (
         SELECT we.id FROM workspace_emails we
         INNER JOIN workspaces w ON w.id = we.workspace_id
         WHERE w.owner_user_id = ?
       )`,
    )
    .bind(subscriptionId, ownerUserId)
    .run();

  return (res.meta?.changes ?? 0) > 0;
}

export async function cancelSubscriptionForOwner(
  db: D1Database,
  ownerUserId: string,
  subscriptionId: string,
): Promise<SubscriptionRow | "no_workspace" | "not_found"> {
  const ws = await getWorkspaceForOwner(db, ownerUserId);
  if (!ws) {
    return "no_workspace";
  }

  const existing = await getSubscriptionRowByIdForOwner(
    db,
    ownerUserId,
    subscriptionId,
  );
  if (!existing) {
    return "not_found";
  }
  if (existing.status === "cancelled") {
    return existing;
  }

  await db
    .prepare(
      `UPDATE subscriptions SET
         status = 'cancelled',
         cancelled_at = datetime('now'),
         updated_at = datetime('now')
       WHERE id = ?
       AND workspace_email_id IN (
         SELECT we.id FROM workspace_emails we
         INNER JOIN workspaces w ON w.id = we.workspace_id
         WHERE w.owner_user_id = ?
       )`,
    )
    .bind(subscriptionId, ownerUserId)
    .run();

  const fresh = await getSubscriptionRowByIdForOwner(
    db,
    ownerUserId,
    subscriptionId,
  );
  return fresh ?? "not_found";
}
