import {
  buildMonthlyReminderEmail,
  buildNextDayReminderEmail,
  sendEmailViaResend,
} from "./email";
import {
  getSubscriptionForNextDayReminder,
  getUpcomingSubscriptionsForUser,
} from "./queries";
import { isReminderQueueMessage } from "./types";

function currentMonthLabel(now = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(now);
}

function subscriptionsForCurrentMonth<T extends { nextBillingAt: string }>(
  subscriptions: T[],
  now = new Date(),
): T[] {
  const month = now.getUTCMonth();
  const year = now.getUTCFullYear();
  return subscriptions.filter((sub) => {
    const [y, m] = sub.nextBillingAt.split("-").map(Number);
    return y === year && m - 1 === month;
  });
}

async function processMonthlyReminder(
  env: CloudflareBindings,
  userId: string,
): Promise<void> {
  const result = await getUpcomingSubscriptionsForUser(env.DB, userId);
  if (!result.ok) {
    console.log(
      `[reminders] skip monthly userId=${userId} reason=${result.reason}`,
    );
    return;
  }

  const monthlySubs = subscriptionsForCurrentMonth(result.subscriptions);
  if (monthlySubs.length === 0) {
    console.log(`[reminders] skip monthly userId=${userId} reason=no_month_subs`);
    return;
  }

  const email = buildMonthlyReminderEmail({
    recipientName: result.name,
    subscriptions: monthlySubs,
    monthLabel: currentMonthLabel(),
  });
  email.to = result.email;

  const sent = await sendEmailViaResend(env.RESEND_API_KEY, email);
  if (!sent.ok) {
    throw new Error(`monthly reminder failed for ${userId}: ${sent.error}`);
  }

  console.log(
    `[reminders] sent monthly reminder userId=${userId} resendId=${sent.id}`,
  );
}

async function processNextDayReminder(
  env: CloudflareBindings,
  subscriptionId: string,
): Promise<void> {
  const result = await getSubscriptionForNextDayReminder(
    env.DB,
    subscriptionId,
  );
  if (!result.ok) {
    console.log(
      `[reminders] skip next_day subscriptionId=${subscriptionId} reason=${result.reason}`,
    );
    return;
  }

  const email = buildNextDayReminderEmail(result.detail);
  const sent = await sendEmailViaResend(env.RESEND_API_KEY, email);
  if (!sent.ok) {
    throw new Error(
      `next-day reminder failed for ${subscriptionId}: ${sent.error}`,
    );
  }

  console.log(
    `[reminders] sent next-day reminder subscriptionId=${subscriptionId} resendId=${sent.id}`,
  );
}

export async function handleReminderQueue(
  batch: MessageBatch<unknown>,
  env: CloudflareBindings,
): Promise<void> {
  for (const message of batch.messages) {
    try {
      const body = message.body;
      if (!isReminderQueueMessage(body)) {
        console.warn("[reminders] unknown queue message", body);
        message.ack();
        continue;
      }

      if (body.type === "monthly") {
        await processMonthlyReminder(env, body.userId);
      } else {
        await processNextDayReminder(env, body.subscriptionId);
      }

      message.ack();
    } catch (err) {
      console.error("[reminders] queue message failed", err);
      message.retry();
    }
  }
}
