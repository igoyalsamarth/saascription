import { listSubscriptionIdsForAutoRollover } from "../subscriptions/queries";
import {
  listSubscriptionIdsForNextDayReminders,
  listUserIdsForMonthlyReminders,
} from "./queries";
import type { QueueMessage } from "./types";

function utcDateParts(now: Date): { year: number; month: number; day: number } {
  return {
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: now.getUTCDate(),
  };
}

function monthLabel(now: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(now);
}

async function enqueueMessages(
  queue: Queue,
  messages: QueueMessage[],
): Promise<void> {
  const batchSize = 100;
  for (let i = 0; i < messages.length; i += batchSize) {
    const chunk = messages.slice(i, i + batchSize);
    await Promise.all(chunk.map((message) => queue.send(message)));
  }
}

export async function runDailyCron(env: CloudflareBindings): Promise<void> {
  const now = new Date();
  const { day } = utcDateParts(now);
  const messages: QueueMessage[] = [];

  if (day === 1) {
    const userIds = await listUserIdsForMonthlyReminders(env.DB);
    for (const userId of userIds) {
      messages.push({ type: "monthly", userId });
    }
    console.log(
      `[reminders] monthly scan: enqueued ${userIds.length} users for ${monthLabel(now)}`,
    );
  }

  const subscriptionIds = await listSubscriptionIdsForNextDayReminders(env.DB);
  for (const subscriptionId of subscriptionIds) {
    messages.push({ type: "next_day", subscriptionId });
  }
  console.log(
    `[reminders] next-day scan: enqueued ${subscriptionIds.length} subscriptions`,
  );

  const rolloverIds = await listSubscriptionIdsForAutoRollover(env.DB);
  for (const subscriptionId of rolloverIds) {
    messages.push({ reason: "auto_rollover", subscriptionId });
  }
  console.log(`[rollover] scan: enqueued ${rolloverIds.length} subscriptions`);

  if (messages.length > 0) {
    await enqueueMessages(env.QUEUE, messages);
  }
}

export async function handleReminderScheduled(
  _controller: ScheduledController,
  env: CloudflareBindings,
  ctx: ExecutionContext,
): Promise<void> {
  ctx.waitUntil(
    runDailyCron(env).catch((err) => {
      console.error("[cron] scheduled handler failed", err);
    }),
  );
}
