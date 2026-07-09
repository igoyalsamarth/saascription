import {
  advanceNextBillingDate,
  type BillableInterval,
  isDateOnOrBeforeToday,
} from "./billing-date";
import { getSubscriptionForRollover } from "./queries";

function rolloverExternalRef(
  subscriptionId: string,
  billingDate: string,
): string {
  return `auto_rollover:${subscriptionId}:${billingDate}`;
}

function parseBillableInterval(interval: string): BillableInterval | null {
  if (interval === "monthly" || interval === "yearly") {
    return interval;
  }
  return null;
}

async function rolloverOneCycle(
  db: D1Database,
  subscription: {
    id: string;
    costCents: number | null;
    currency: string;
    billingInterval: string;
    nextBillingAt: string;
  },
): Promise<{ advanced: boolean; newNextBillingAt: string }> {
  const billableInterval = parseBillableInterval(subscription.billingInterval);
  if (!billableInterval) {
    return { advanced: false, newNextBillingAt: subscription.nextBillingAt };
  }

  const billingDate = subscription.nextBillingAt;
  const newNextBillingAt = advanceNextBillingDate(
    billingDate,
    billableInterval,
  );
  const externalRef = rolloverExternalRef(subscription.id, billingDate);
  const transactionId = crypto.randomUUID();
  const amount = subscription.costCents ?? 0;

  const results = await db.batch([
    db
      .prepare(
        `INSERT INTO transactions (
           id, subscription_id, amount, currency, status, external_ref
         )
         SELECT ?, ?, ?, ?, 'completed', ?
         WHERE NOT EXISTS (
           SELECT 1 FROM transactions WHERE external_ref = ?
         )`,
      )
      .bind(
        transactionId,
        subscription.id,
        amount,
        subscription.currency,
        externalRef,
        externalRef,
      ),
    db
      .prepare(
        `UPDATE subscriptions
         SET next_billing_at = ?,
             status = CASE WHEN status = 'new' THEN 'old' ELSE status END,
             updated_at = datetime('now')
         WHERE id = ?
           AND status IN ('new', 'old')
           AND date(next_billing_at) = date(?)`,
      )
      .bind(newNextBillingAt, subscription.id, billingDate),
  ]);

  const updateResult = results[1];
  const advanced =
    updateResult.meta.changes !== undefined && updateResult.meta.changes > 0;

  return { advanced, newNextBillingAt };
}

export async function processAutoRollover(
  env: CloudflareBindings,
  subscriptionId: string,
): Promise<void> {
  let cyclesProcessed = 0;
  let lastNextBillingAt: string | undefined;

  while (true) {
    const result = await getSubscriptionForRollover(env.DB, subscriptionId);
    if (!result.ok) {
      if (cyclesProcessed === 0) {
        console.log(
          `[rollover] skip subscriptionId=${subscriptionId} reason=${result.reason}`,
        );
      }
      break;
    }

    const { subscription } = result;
    const { advanced, newNextBillingAt } = await rolloverOneCycle(
      env.DB,
      subscription,
    );

    if (!advanced) {
      console.log(
        `[rollover] stop subscriptionId=${subscriptionId} reason=no_advance billingDate=${subscription.nextBillingAt}`,
      );
      break;
    }

    cyclesProcessed += 1;
    lastNextBillingAt = newNextBillingAt;

    if (!isDateOnOrBeforeToday(newNextBillingAt)) {
      break;
    }
  }

  if (cyclesProcessed > 0) {
    console.log(
      `[rollover] completed subscriptionId=${subscriptionId} cyclesProcessed=${cyclesProcessed} nextBillingAt=${lastNextBillingAt}`,
    );
  }
}
