import { useQuery } from "@tanstack/react-query";

import { useClient } from "@/lib/client";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
};

export type DashboardCategoryKey =
  | "software"
  | "cloud"
  | "design"
  | "productivity"
  | "other";

export type DashboardOverview = {
  activeSubscriptionsCount: number;
  activeSubscriptionsDeltaSinceLastMonth: number;
  totalMonthlySpend: number;
  lifetimeSavings: number;
  spendByMonth: { month: string; spend: number }[];
  monthlySpendSparkline: { i: number; v: number }[];
  categoryBreakdown: {
    name: string;
    value: number;
    key: DashboardCategoryKey;
  }[];
  upcomingRenewals: {
    id: string;
    name: string;
    amount: number;
    inDays: number;
  }[];
  recentActivity: { title: string; subtitle: string } | null;
};

export type DashboardOverviewResponse = {
  dashboard: DashboardOverview;
};

export function useDashboardOverview() {
  const client = useClient();
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: () =>
      client.get("users/me/dashboard").json<DashboardOverviewResponse>(),
    select: (data) => data.dashboard,
  });
}
