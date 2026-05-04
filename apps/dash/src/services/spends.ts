import { buildSpendsAnalyticsFromSubscriptions } from "../lib/workspace-subscription-aggregates";
import { useWorkspaceDataBundleQuery } from "@/services/workspace";

export type SpendsMonthsWindow = 3 | 6 | 12;

export type SpendsCategoryKey = "software" | "productivity" | "infra" | "other";

export type SpendsHighestRow = {
  subscriptionId: string;
  service: string;
  sub: string;
  category: string;
  renewalLabel: string;
  renewalUrgent: boolean;
  cost: number;
};

export type SpendsOpportunity = {
  title: string;
  subtitle: string;
};

export type SpendsAnalytics = {
  rangeMonths: SpendsMonthsWindow;
  spendByMonth: { month: string; spend: number }[];
  totalMonthlySpend: number;
  monthOverMonthPercentChange: number | null;
  categoryBreakdown: {
    name: string;
    value: number;
    key: SpendsCategoryKey;
  }[];
  highestSpends: SpendsHighestRow[];
  savings: {
    monthlySavingsUsd: number;
    cancelledSubscriptionsCount: number;
    opportunities: SpendsOpportunity[];
  };
};

export function useSpendsAnalytics(months: SpendsMonthsWindow) {
  return useWorkspaceDataBundleQuery((data) =>
    buildSpendsAnalyticsFromSubscriptions(
      data.subscriptions,
      months,
    ),
  );
}
