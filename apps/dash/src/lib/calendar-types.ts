import type {
  CloudIcon,
  MusicNote01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons";

export type CalendarViewMode = "month" | "week" | "list";

export type CalendarEventTone = "default" | "expiring";

export type CalendarEventItem = {
  id: string;
  year: number;
  month: number;
  day: number;
  name: string;
  amount: string;
  iconClass: string;
  cardBg: string;
  /** Hugeicons; multiple icon exports share the same object shape. */
  icon: typeof Video01Icon | typeof MusicNote01Icon | typeof CloudIcon;
  expiringSubtext?: string;
  manualReview?: boolean;
};
