import { findOrCreateSaasByName } from "./saas";
import {
  backfillPrimaryWorkspaceEmailIfMissing,
  getPrimaryWorkspaceEmailId,
} from "./workspace-emails";
import { getWorkspaceForOwner } from "./workspaces";

export type SubscriptionRow = {
  id: string;
  saasId: string;
  /** Catalog display name (from `saas.name`). */
  name: string;
  amount: string;
  interval: "monthly" | "yearly" | "custom";
  /** Next billing / renewal day, `YYYY-MM-DD` (also stored as `next_billing_at`). */
  nextBillingAt: string;
};

const MAX_ROWS = 200;
const MAX_NAME_LEN = 200;
const MAX_AMOUNT_LEN = 32;
const MAX_ID_LEN = 64;
/** Fills required `sub_type` for user-entered rows; category is no longer collected. */
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

/** Request body shape (saasId from client is ignored; name is used to resolve catalog). */
export function parseSubscriptionsBody(
  body: unknown,
): { ok: true; rows: SubscriptionRow[] } | { ok: false; error: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Expected JSON object" };
  }
  const subs = (body as Record<string, unknown>).subscriptions;
  if (!Array.isArray(subs)) {
    return { ok: false, error: "subscriptions must be an array" };
  }
  if (subs.length > MAX_ROWS) {
    return { ok: false, error: `At most ${MAX_ROWS} subscriptions allowed` };
  }

  const rows: SubscriptionRow[] = [];
  for (let i = 0; i < subs.length; i++) {
    const item = subs[i];
    if (!item || typeof item !== "object") {
      return { ok: false, error: `subscriptions[${i}] must be an object` };
    }
    const o = item as Record<string, unknown>;
    const id = typeof o.id === "string" ? o.id.trim() : "";
    const name = typeof o.name === "string" ? o.name.trim() : "";
    const amount = typeof o.amount === "string" ? o.amount.trim() : "";
    const nextBillingAt =
      typeof o.nextBillingAt === "string" ? o.nextBillingAt.trim() : "";
    const interval = parseInterval(o.interval);

    if (!id || id.length > MAX_ID_LEN) {
      return { ok: false, error: `subscriptions[${i}].id is invalid` };
    }
    if (!name || name.length > MAX_NAME_LEN) {
      return {
        ok: false,
        error: `subscriptions[${i}].name is required (max ${MAX_NAME_LEN} chars)`,
      };
    }
    if (!amount || amount.length > MAX_AMOUNT_LEN || !amountOk(amount)) {
      return {
        ok: false,
        error: `subscriptions[${i}].amount must be a valid non-negative number`,
      };
    }
    if (!interval) {
      return {
        ok: false,
        error: `subscriptions[${i}].interval must be monthly, yearly, or custom`,
      };
    }
    if (!nextBillingAt || !isValidNextBillingDate(nextBillingAt)) {
      return {
        ok: false,
        error: `subscriptions[${i}].nextBillingAt must be a valid date (YYYY-MM-DD)`,
      };
    }
    rows.push({
      id,
      saasId: "",
      name,
      amount,
      interval,
      nextBillingAt,
    });
  }

  const seen = new Set<string>();
  for (const r of rows) {
    if (seen.has(r.id)) {
      return { ok: false, error: `Duplicate subscription id: ${r.id}` };
    }
    seen.add(r.id);
  }

  return { ok: true, rows };
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
              s.billing_interval, s.next_billing_at
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
    }>();

  const out: SubscriptionRow[] = [];
  for (const r of res.results ?? []) {
    const interval = parseInterval(r.billing_interval ?? "monthly");
    if (!interval) {
      continue;
    }
    const nb = normalizeNextBillingAt(r.next_billing_at);
    out.push({
      id: r.sid,
      saasId: r.saas_id,
      name: r.saas_name,
      amount: costCentsToAmountString(r.cost),
      interval,
      nextBillingAt: nb && isValidNextBillingDate(nb) ? nb : "",
    });
  }
  return out;
}

export async function replaceSubscriptionsForOwner(
  db: D1Database,
  ownerUserId: string,
  rows: SubscriptionRow[],
): Promise<
  SubscriptionRow[] | "no_workspace" | "no_user_email"
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

  const resolved: {
    id: string;
    saasId: string;
    name: string;
    amount: string;
    interval: string;
    nextBillingAt: string;
    costCents: number;
  }[] = [];

  for (const r of rows) {
    const saas = await findOrCreateSaasByName(db, r.name);
    resolved.push({
      id: r.id,
      saasId: saas.id,
      name: saas.name,
      amount: r.amount,
      interval: r.interval,
      nextBillingAt: r.nextBillingAt,
      costCents: amountStringToCostCents(r.amount),
    });
  }

  const del = db
    .prepare(
      `DELETE FROM subscriptions
       WHERE workspace_email_id IN (
         SELECT id FROM workspace_emails WHERE workspace_id = ?
       )`,
    )
    .bind(ws.id);

  if (resolved.length === 0) {
    await del.run();
    return [];
  }

  const inserts = resolved.map((r) =>
    db
      .prepare(
        `INSERT INTO subscriptions (
           id, workspace_email_id, saas_id, sub_type, status,
           cost, currency, billing_interval, subscribed_at,
           next_billing_at,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'USD', ?, datetime('now'), ?, datetime('now'), datetime('now'))`,
      )
      .bind(
        r.id,
        workspaceEmailId,
        r.saasId,
        USER_ENTERED_SUB_TYPE,
        ENTERED_STATUS,
        r.costCents,
        r.interval,
        r.nextBillingAt,
      ),
  );

  await db.batch([del, ...inserts]);

  return resolved.map((r) => ({
    id: r.id,
    saasId: r.saasId,
    name: r.name,
    amount: r.amount,
    interval: r.interval as SubscriptionRow["interval"],
    nextBillingAt: r.nextBillingAt,
  }));
}
