import { useQuery } from "@tanstack/react-query";

import { useClient } from "@/lib/client";

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

export type SpendsAnalyticsResponse = {
  spends: SpendsAnalytics;
};

export const spendsKeys = {
  all: ["spends"] as const,
  analytics: (months: SpendsMonthsWindow) =>
    [...spendsKeys.all, "analytics", months] as const,
};

export function useSpendsAnalytics(months: SpendsMonthsWindow) {
  const client = useClient();
  return useQuery({
    queryKey: spendsKeys.analytics(months),
    queryFn: () =>
      client
        .get("users/me/spends", { searchParams: { months: String(months) } })
        .json<SpendsAnalyticsResponse>(),
    select: (data) => data.spends,
  });
}
