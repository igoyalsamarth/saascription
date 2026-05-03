import {
  CloudIcon,
  MusicNote01Icon,
  ShoppingBag01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons";

import type { CalendarRenewalItem } from "@/services/calendar";

import type { CalendarEventItem } from "./calendar-types";

function pickCalendarVisual(name: string, urgent: boolean) {
  if (urgent) {
    return {
      icon: CloudIcon,
      iconClass: "text-amber-600",
      cardBg: "bg-amber-100/80 dark:bg-amber-950/30",
    };
  }
  const n = name.toLowerCase();
  if (/\b(netflix|hulu|disney|youtube|stream|video|hbo|prime)\b/.test(n)) {
    return {
      icon: Video01Icon,
      iconClass: "text-rose-600",
      cardBg: "bg-primary/8 dark:bg-primary/10",
    };
  }
  if (/\b(spotify|apple music|soundcloud|audio|music)\b/.test(n)) {
    return {
      icon: MusicNote01Icon,
      iconClass: "text-emerald-600",
      cardBg: "bg-primary/8 dark:bg-primary/10",
    };
  }
  if (/\b(aws|azure|gcp|cloud|hosting|vercel)\b/.test(n)) {
    return {
      icon: CloudIcon,
      iconClass: "text-sky-600",
      cardBg: "bg-primary/8 dark:bg-primary/10",
    };
  }
  return {
    icon: ShoppingBag01Icon,
    iconClass: "text-muted-foreground",
    cardBg: "bg-primary/8 dark:bg-primary/10",
  };
}

export function renewalRecordToCalendarEvent(
  r: CalendarRenewalItem,
): CalendarEventItem {
  const [yy, mm, dd] = r.renewalDate.split("-").map(Number);
  const urgentWindow = r.inDays >= 0 && r.inDays <= 7;
  const overdue = r.inDays < 0;
  const urgent = urgentWindow || overdue;
  const vis = pickCalendarVisual(r.name, urgent);
  return {
    id: r.subscriptionId,
    year: yy,
    month: mm - 1,
    day: dd,
    name: r.name,
    amount: r.amountFormatted,
    amountUsd: r.amountUsd,
    ...vis,
    expiringSubtext: overdue
      ? "Overdue"
      : urgentWindow
        ? "Renewing soon"
        : undefined,
    manualReview: overdue,
  };
}

export function renewalsToCalendarEvents(
  renewals: CalendarRenewalItem[],
): CalendarEventItem[] {
  return renewals.map(renewalRecordToCalendarEvent);
}
