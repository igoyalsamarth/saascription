import { buildCalendarRenewalsFromSubscriptions } from "../lib/workspace-subscription-aggregates";
import { useWorkspaceDataBundleQuery } from "@/services/workspace";

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

export function useCalendarRenewals() {
  return useWorkspaceDataBundleQuery((data) =>
    buildCalendarRenewalsFromSubscriptions(data.subscriptions),
  );
}
