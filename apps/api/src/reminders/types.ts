export type MonthlyReminderMessage = {
  type: "monthly";
  userId: string;
};

export type NextDayReminderMessage = {
  type: "next_day";
  subscriptionId: string;
};

export type ReminderQueueMessage =
  | MonthlyReminderMessage
  | NextDayReminderMessage;

export function isReminderQueueMessage(
  value: unknown,
): value is ReminderQueueMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  if (o.type === "monthly") {
    return typeof o.userId === "string" && o.userId.length > 0;
  }
  if (o.type === "next_day") {
    return typeof o.subscriptionId === "string" && o.subscriptionId.length > 0;
  }
  return false;
}
