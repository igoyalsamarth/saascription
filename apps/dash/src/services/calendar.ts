import { useQuery } from "@tanstack/react-query";

import { useClient } from "@/lib/client";

export const calendarKeys = {
  all: ["calendar"] as const,
  renewals: () => [...calendarKeys.all, "renewals"] as const,
};

export type CalendarBillingInterval = "monthly" | "yearly" | "custom";

export type CalendarRenewalItem = {
  subscriptionId: string;
  name: string;
  renewalDate: string;
  billingInterval: CalendarBillingInterval;
  amountUsd: number;
  amountFormatted: string;
  inDays: number;
};

export type CalendarResponse = {
  calendar: {
    renewals: CalendarRenewalItem[];
  };
};

export function useCalendarRenewals() {
  const client = useClient();
  return useQuery({
    queryKey: calendarKeys.renewals(),
    queryFn: () => client.get("users/me/calendar").json<CalendarResponse>(),
    select: (data) => data.calendar.renewals,
  });
}
