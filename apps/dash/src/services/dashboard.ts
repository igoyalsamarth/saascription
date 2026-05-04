import { buildDashboardOverviewFromSubscriptions } from "../lib/workspace-subscription-aggregates";
import { useWorkspaceDataBundleQuery } from "@/services/workspace";

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

export function useDashboardOverview() {
  return useWorkspaceDataBundleQuery((data) =>
    buildDashboardOverviewFromSubscriptions(data.subscriptions),
  );
}
