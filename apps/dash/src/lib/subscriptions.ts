export type BillingInterval = "monthly" | "yearly" | "custom";

export type SubscriptionRow = {
  id: string;
  /** Set after load/save from the API (catalog id). */
  saasId?: string;
  /** What the user types today; later this may be a dropdown of catalog names. */
  name: string;
  /** Plain text, e.g. "29" or "29.99" */
  amount: string;
  interval: BillingInterval;
  /** Next billing date from calendar; `YYYY-MM-DD`, persisted as `next_billing_at`. */
  nextBillingAt: string;
};

export function isoDateLocal(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function emptySubscriptionRow(): SubscriptionRow {
  return {
    id: crypto.randomUUID(),
    name: "",
    amount: "",
    interval: "monthly",
    nextBillingAt: isoDateLocal(),
  };
}

export type RowFieldErrors = {
  name?: string;
  amount?: string;
  nextBillingAt?: string;
};

function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.trim())) {
    return false;
  }
  const [y, m, d] = s.trim().split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return false;
  }
  const dt = new Date(s.trim() + "T12:00:00");
  return (
    Number.isFinite(dt.getTime()) &&
    dt.getFullYear() === y &&
    dt.getMonth() + 1 === m &&
    dt.getDate() === d
  );
}

/**
 * Normalized snapshot for dirty checks (ignores `saasId`; order matters).
 */
export function serializeSubscriptionsSnapshot(
  rows: SubscriptionRow[],
): string {
  return JSON.stringify(
    rows.map((r) => ({
      id: r.id,
      name: r.name.trim(),
      amount: r.amount.trim(),
      interval: r.interval,
      nextBillingAt: r.nextBillingAt.trim(),
    })),
  );
}

/** Returns a map of row id → field errors. Empty map means all rows are valid. */
export function validateSubscriptions(
  rows: SubscriptionRow[],
): Record<string, RowFieldErrors> {
  const out: Record<string, RowFieldErrors> = {};
  const amountOk = (s: string) => {
    const t = s.trim();
    if (!t) {
      return false;
    }
    const n = Number(t);
    return Number.isFinite(n) && n >= 0;
  };

  for (const r of rows) {
    const e: RowFieldErrors = {};
    if (!r.name.trim()) {
      e.name = "Required";
    }
    if (!r.amount.trim()) {
      e.amount = "Required";
    } else if (!amountOk(r.amount)) {
      e.amount = "Enter a valid amount (e.g. 29 or 29.99)";
    }
    if (!r.nextBillingAt.trim()) {
      e.nextBillingAt = "Pick a date";
    } else if (!isValidIsoDate(r.nextBillingAt)) {
      e.nextBillingAt = "Invalid date";
    }
    if (Object.keys(e).length > 0) {
      out[r.id] = e;
    }
  }
  return out;
}
