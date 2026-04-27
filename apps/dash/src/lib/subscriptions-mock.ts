import {
  Airplane01Icon,
  BookOpen01Icon,
  BubbleChatIcon,
  Camera01Icon,
  CloudIcon,
  CodeIcon,
  ComputerIcon,
  FigmaIcon,
  GameController01Icon,
  GitBranchIcon,
  GoogleIcon,
  Image01Icon,
  KanbanIcon,
  LayerIcon,
  Message01Icon,
  Mic01Icon,
  MusicNote01Icon,
  PaintBoardIcon,
  ShopSignIcon,
  UserGroupIcon,
  Video01Icon,
} from "@hugeicons/core-free-icons";

export type SubscriptionTabId =
  | "all"
  | "existing"
  | "new"
  | "expiring"
  | "free-trials"
  | "cancelled";

export type SubscriptionStatus = "active" | "cancelled";

type SubscriptionIcon = typeof Video01Icon;

export type SubscriptionRow = {
  id: string;
  name: string;
  category: string;
  /** Hugeicons icon used as a stand-in for a service logo */
  icon: SubscriptionIcon;
  /** Accent for the icon circle: tailwind text-* and bg-* token hints */
  iconTone: { bg: string; text: string };
  planType: string;
  status: SubscriptionStatus;
  isNew: boolean;
  isFreeTrial: boolean;
  /** Days until renewal; undefined if cancelled with no active renewal */
  daysUntilRenewal: number | null;
  /** Display string for a normal next renewal, e.g. "Nov 15, 2024" */
  renewalDateLabel: string;
  /**
   * When renewal is very soon, show an urgent line instead of a calm date
   * (e.g. "Tomorrow", "In 3 days")
   */
  urgentRenewalLabel: string | null;
  costAmount: string;
  costSuffix: string | null;
  /** When cancelled, show "Ends …" in next renewal and strike cost */
  endsOnLabel: string | null;
};

const fmt = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export const SUBSCRIPTION_TABS: { id: SubscriptionTabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "existing", label: "Existing" },
  { id: "new", label: "New" },
  { id: "expiring", label: "Expiring" },
  { id: "free-trials", label: "Free Trials" },
  { id: "cancelled", label: "Cancelled" },
];

const rows: SubscriptionRow[] = [
  {
    id: "1",
    name: "Netflix",
    category: "Entertainment",
    icon: Video01Icon,
    iconTone: {
      bg: "bg-rose-500/15",
      text: "text-rose-600 dark:text-rose-400",
    },
    planType: "Premium 4K",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 1,
    renewalDateLabel: fmt(daysFromNow(1)),
    urgentRenewalLabel: "Tomorrow",
    costAmount: "$22.99",
    costSuffix: null,
    endsOnLabel: null,
  },
  {
    id: "2",
    name: "Slack",
    category: "Productivity",
    icon: Message01Icon,
    iconTone: {
      bg: "bg-violet-500/15",
      text: "text-violet-600 dark:text-violet-400",
    },
    planType: "Business+",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 3,
    renewalDateLabel: fmt(daysFromNow(3)),
    urgentRenewalLabel: "In 3 days",
    costAmount: "$12.50",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "3",
    name: "Adobe CC",
    category: "Design",
    icon: Image01Icon,
    iconTone: { bg: "bg-red-500/15", text: "text-red-600 dark:text-red-400" },
    planType: "All Apps",
    status: "active",
    isNew: true,
    isFreeTrial: false,
    daysUntilRenewal: 14,
    renewalDateLabel: fmt(daysFromNow(14)),
    urgentRenewalLabel: null,
    costAmount: "$54.99",
    costSuffix: null,
    endsOnLabel: null,
  },
  {
    id: "4",
    name: "Figma",
    category: "Design",
    icon: FigmaIcon,
    iconTone: {
      bg: "bg-fuchsia-500/15",
      text: "text-fuchsia-600 dark:text-fuchsia-400",
    },
    planType: "Organization",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 30,
    renewalDateLabel: fmt(daysFromNow(30)),
    urgentRenewalLabel: null,
    costAmount: "$45.00",
    costSuffix: "/editor",
    endsOnLabel: null,
  },
  {
    id: "5",
    name: "Notion",
    category: "Productivity",
    icon: BookOpen01Icon,
    iconTone: {
      bg: "bg-stone-500/15",
      text: "text-stone-600 dark:text-stone-300",
    },
    planType: "Team",
    status: "cancelled",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: null,
    renewalDateLabel: "",
    urgentRenewalLabel: null,
    costAmount: "$16.00",
    costSuffix: "/user",
    endsOnLabel: `Ends ${fmt(daysFromNow(12))}`,
  },
  {
    id: "6",
    name: "Spotify",
    category: "Entertainment",
    icon: MusicNote01Icon,
    iconTone: {
      bg: "bg-green-500/15",
      text: "text-green-600 dark:text-green-400",
    },
    planType: "Family",
    status: "active",
    isNew: true,
    isFreeTrial: true,
    daysUntilRenewal: 5,
    renewalDateLabel: fmt(daysFromNow(5)),
    urgentRenewalLabel: "In 5 days",
    costAmount: "$0.00",
    costSuffix: "trial",
    endsOnLabel: null,
  },
  {
    id: "7",
    name: "Google Workspace",
    category: "Productivity",
    icon: GoogleIcon,
    iconTone: {
      bg: "bg-blue-500/15",
      text: "text-blue-600 dark:text-blue-400",
    },
    planType: "Business Starter",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 21,
    renewalDateLabel: fmt(daysFromNow(21)),
    urgentRenewalLabel: null,
    costAmount: "$7.20",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "8",
    name: "Linear",
    category: "Productivity",
    icon: KanbanIcon,
    iconTone: {
      bg: "bg-indigo-500/15",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    planType: "Standard",
    status: "active",
    isNew: true,
    isFreeTrial: false,
    daysUntilRenewal: 0,
    renewalDateLabel: fmt(daysFromNow(0)),
    urgentRenewalLabel: "Today",
    costAmount: "$10.00",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "9",
    name: "AWS",
    category: "Cloud",
    icon: CloudIcon,
    iconTone: {
      bg: "bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-500",
    },
    planType: "Usage",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 2,
    renewalDateLabel: fmt(daysFromNow(2)),
    urgentRenewalLabel: "In 2 days",
    costAmount: "$480.00",
    costSuffix: "/mo (est.)",
    endsOnLabel: null,
  },
  {
    id: "10",
    name: "Zoom",
    category: "Communication",
    icon: Video01Icon,
    iconTone: { bg: "bg-sky-500/15", text: "text-sky-600 dark:text-sky-400" },
    planType: "Pro",
    status: "active",
    isNew: false,
    isFreeTrial: true,
    daysUntilRenewal: 6,
    renewalDateLabel: fmt(daysFromNow(6)),
    urgentRenewalLabel: "In 6 days",
    costAmount: "$0.00",
    costSuffix: "trial",
    endsOnLabel: null,
  },
  {
    id: "11",
    name: "Dropbox",
    category: "Storage",
    icon: LayerIcon,
    iconTone: {
      bg: "bg-blue-500/15",
      text: "text-blue-500 dark:text-blue-300",
    },
    planType: "Family",
    status: "cancelled",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: null,
    renewalDateLabel: "",
    urgentRenewalLabel: null,
    costAmount: "$19.99",
    costSuffix: null,
    endsOnLabel: `Ends ${fmt(daysFromNow(45))}`,
  },
  {
    id: "12",
    name: "GitHub",
    category: "Dev tools",
    icon: GitBranchIcon,
    iconTone: { bg: "bg-neutral-500/20", text: "text-foreground" },
    planType: "Team",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 90,
    renewalDateLabel: fmt(daysFromNow(90)),
    urgentRenewalLabel: null,
    costAmount: "$4.00",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "13",
    name: "1Password",
    category: "Security",
    icon: UserGroupIcon,
    iconTone: { bg: "bg-blue-500/15", text: "text-blue-600" },
    planType: "Teams",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 18,
    renewalDateLabel: fmt(daysFromNow(18)),
    urgentRenewalLabel: null,
    costAmount: "$7.99",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "14",
    name: "Loom",
    category: "Communication",
    icon: Video01Icon,
    iconTone: { bg: "bg-purple-500/15", text: "text-purple-600" },
    planType: "Business",
    status: "active",
    isNew: true,
    isFreeTrial: true,
    daysUntilRenewal: 4,
    renewalDateLabel: fmt(daysFromNow(4)),
    urgentRenewalLabel: "In 4 days",
    costAmount: "$0.00",
    costSuffix: "trial",
    endsOnLabel: null,
  },
  {
    id: "15",
    name: "Miro",
    category: "Design",
    icon: PaintBoardIcon,
    iconTone: {
      bg: "bg-yellow-500/15",
      text: "text-yellow-700 dark:text-yellow-400",
    },
    planType: "Business",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 10,
    renewalDateLabel: fmt(daysFromNow(10)),
    urgentRenewalLabel: null,
    costAmount: "$16.00",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "16",
    name: "Vercel",
    category: "Cloud",
    icon: Airplane01Icon,
    iconTone: { bg: "bg-foreground/10", text: "text-foreground" },
    planType: "Pro",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 7,
    renewalDateLabel: fmt(daysFromNow(7)),
    urgentRenewalLabel: "In 1 week",
    costAmount: "$20.00",
    costSuffix: null,
    endsOnLabel: null,
  },
  {
    id: "17",
    name: "Canva",
    category: "Design",
    icon: Camera01Icon,
    iconTone: { bg: "bg-cyan-500/15", text: "text-cyan-600" },
    planType: "Teams",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 11,
    renewalDateLabel: fmt(daysFromNow(11)),
    urgentRenewalLabel: null,
    costAmount: "$12.99",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "18",
    name: "Jira",
    category: "Productivity",
    icon: ShopSignIcon,
    iconTone: { bg: "bg-emerald-500/15", text: "text-emerald-600" },
    planType: "Standard",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 200,
    renewalDateLabel: fmt(daysFromNow(200)),
    urgentRenewalLabel: null,
    costAmount: "$8.15",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "19",
    name: "Datadog",
    category: "Observability",
    icon: ComputerIcon,
    iconTone: { bg: "bg-violet-500/15", text: "text-violet-500" },
    planType: "Pro",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 1,
    renewalDateLabel: fmt(daysFromNow(1)),
    urgentRenewalLabel: "Tomorrow",
    costAmount: "$350.00",
    costSuffix: "/mo",
    endsOnLabel: null,
  },
  {
    id: "20",
    name: "Sentry",
    category: "Observability",
    icon: CodeIcon,
    iconTone: { bg: "bg-orange-500/15", text: "text-orange-600" },
    planType: "Business",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 8,
    renewalDateLabel: fmt(daysFromNow(8)),
    urgentRenewalLabel: null,
    costAmount: "$26.00",
    costSuffix: null,
    endsOnLabel: null,
  },
  {
    id: "21",
    name: "Intercom",
    category: "Support",
    icon: BubbleChatIcon,
    iconTone: { bg: "bg-blue-500/15", text: "text-blue-500" },
    planType: "Essential",
    status: "cancelled",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: null,
    renewalDateLabel: "",
    urgentRenewalLabel: null,
    costAmount: "$79.00",
    costSuffix: null,
    endsOnLabel: `Ends ${fmt(daysFromNow(4))}`,
  },
  {
    id: "22",
    name: "Airtable",
    category: "Productivity",
    icon: LayerIcon,
    iconTone: {
      bg: "bg-yellow-500/10",
      text: "text-yellow-800 dark:text-yellow-400",
    },
    planType: "Team",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 20,
    renewalDateLabel: fmt(daysFromNow(20)),
    urgentRenewalLabel: null,
    costAmount: "$24.00",
    costSuffix: "/user",
    endsOnLabel: null,
  },
  {
    id: "23",
    name: "Descript",
    category: "Media",
    icon: Mic01Icon,
    iconTone: { bg: "bg-pink-500/15", text: "text-pink-600" },
    planType: "Pro",
    status: "active",
    isNew: false,
    isFreeTrial: true,
    daysUntilRenewal: 1,
    renewalDateLabel: fmt(daysFromNow(1)),
    urgentRenewalLabel: "Tomorrow",
    costAmount: "$0.00",
    costSuffix: "trial",
    endsOnLabel: null,
  },
  {
    id: "24",
    name: "Nintendo",
    category: "Entertainment",
    icon: GameController01Icon,
    iconTone: { bg: "bg-red-500/20", text: "text-red-600" },
    planType: "Online+",
    status: "active",
    isNew: false,
    isFreeTrial: false,
    daysUntilRenewal: 60,
    renewalDateLabel: fmt(daysFromNow(60)),
    urgentRenewalLabel: null,
    costAmount: "$3.99",
    costSuffix: null,
    endsOnLabel: null,
  },
];

export const MOCK_SUBSCRIPTIONS: SubscriptionRow[] = rows;

export function filterSubscriptions(
  list: SubscriptionRow[],
  tab: SubscriptionTabId,
): SubscriptionRow[] {
  if (tab === "all") return list;
  if (tab === "existing") {
    return list.filter(
      (r) => r.status === "active" && !r.isNew && !r.isFreeTrial,
    );
  }
  if (tab === "new") return list.filter((r) => r.isNew);
  if (tab === "expiring") {
    return list.filter(
      (r) =>
        r.status === "active" &&
        r.daysUntilRenewal != null &&
        r.daysUntilRenewal >= 0 &&
        r.daysUntilRenewal <= 7,
    );
  }
  if (tab === "free-trials")
    return list.filter((r) => r.isFreeTrial && r.status === "active");
  if (tab === "cancelled") return list.filter((r) => r.status === "cancelled");
  return list;
}
