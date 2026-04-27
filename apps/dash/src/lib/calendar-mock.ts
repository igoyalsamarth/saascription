import {
  CloudIcon,
  MusicNote01Icon,
  Video01Icon,
} from "@hugeicons/core-free-icons";

import type { CalendarEventItem } from "./calendar-types";

export type { CalendarEventItem, CalendarViewMode } from "./calendar-types";

/** Fixed demo “today” in the product mock (Oct 11, 2023). */
export const DEMO_TODAY = new Date(2023, 9, 11);

export const CALENDAR_DEMO_EVENTS: CalendarEventItem[] = [
  {
    id: "e1",
    year: 2023,
    month: 9,
    day: 2,
    name: "Netflix",
    amount: "$15.99",
    icon: Video01Icon,
    iconClass: "text-rose-600",
    cardBg: "bg-primary/8 dark:bg-primary/10",
  },
  {
    id: "e2",
    year: 2023,
    month: 9,
    day: 4,
    name: "Spotify",
    amount: "$8.99",
    icon: MusicNote01Icon,
    iconClass: "text-emerald-600",
    cardBg: "bg-primary/8 dark:bg-primary/10",
  },
  {
    id: "e3",
    year: 2023,
    month: 9,
    day: 11,
    name: "AWS",
    amount: "$120.50",
    icon: CloudIcon,
    iconClass: "text-amber-600",
    cardBg: "bg-amber-100/80 dark:bg-amber-950/30",
    expiringSubtext: "Expiring Soon",
    manualReview: true,
  },
];

export function eventsForDate(y: number, m: number, d: number) {
  return CALENDAR_DEMO_EVENTS.filter(
    (e) => e.year === y && e.month === m && e.day === d,
  );
}

export function startOfWeekSunday(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const dow = x.getDay();
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function addMonth(y: number, m: number, delta: number) {
  const d = new Date(y, m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
}

type CalendarCell = {
  y: number;
  m: number;
  d: number;
  inMonth: boolean;
};

export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const out: CalendarCell[] = [];
  for (let i = 0; i < startPad; i++) {
    const d = daysInPrev - startPad + i + 1;
    const py = month === 0 ? year - 1 : year;
    const pm = month === 0 ? 11 : month - 1;
    out.push({ y: py, m: pm, d, inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    out.push({ y: year, m: month, d, inMonth: true });
  }
  let t = 1;
  let trY = year;
  let trM = month + 1;
  if (trM > 11) {
    trM = 0;
    trY += 1;
  }
  while (out.length < 42) {
    out.push({ y: trY, m: trM, d: t, inMonth: false });
    t++;
    const maxD = new Date(trY, trM + 1, 0).getDate();
    if (t > maxD) {
      t = 1;
      trM += 1;
      if (trM > 11) {
        trM = 0;
        trY += 1;
      }
    }
  }
  return out;
}

function sameDay(
  a: { y: number; m: number; d: number },
  b: { y: number; m: number; d: number },
) {
  return a.y === b.y && a.m === b.m && a.d === b.d;
}

export function isDemoToday(cell: { y: number; m: number; d: number }) {
  return sameDay(cell, {
    y: DEMO_TODAY.getFullYear(),
    m: DEMO_TODAY.getMonth(),
    d: DEMO_TODAY.getDate(),
  });
}

export const SAVINGS_TIP =
  "Consider switching Figma to annual billing to save 15% before the Oct 17 renewal.";

export function listEventsInMonth(
  y: number,
  m: number,
): Array<CalendarEventItem & { date: Date }> {
  return CALENDAR_DEMO_EVENTS.filter((e) => e.year === y && e.month === m)
    .map((e) => ({
      ...e,
      date: new Date(e.year, e.month, e.day),
    }))
    .sort((a, b) => a.day - b.day);
}

export function listEventsInWeek(weekStart: Date): CalendarEventItem[] {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = addDays(weekStart, 6);
  end.setHours(23, 59, 59, 999);
  const res: CalendarEventItem[] = [];
  for (const e of CALENDAR_DEMO_EVENTS) {
    const dt = new Date(e.year, e.month, e.day);
    if (dt >= start && dt <= end) {
      res.push(e);
    }
  }
  return res.sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.name.localeCompare(b.name);
  });
}
