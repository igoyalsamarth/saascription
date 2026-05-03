import type { CalendarEventItem } from "./calendar-types";

export const CALENDAR_SAVINGS_TIP =
  "Review upcoming renewals and switch eligible plans to annual billing when it saves money.";

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

export function eventsForDate(
  events: CalendarEventItem[],
  y: number,
  m: number,
  d: number,
) {
  return events.filter((e) => e.year === y && e.month === m && e.day === d);
}

export function listEventsInMonth(
  events: CalendarEventItem[],
  y: number,
  m: number,
): Array<CalendarEventItem & { date: Date }> {
  return events
    .filter((e) => e.year === y && e.month === m)
    .map((e) => ({
      ...e,
      date: new Date(e.year, e.month, e.day),
    }))
    .sort((a, b) => a.day - b.day);
}

export function listEventsInWeek(
  events: CalendarEventItem[],
  weekStart: Date,
): CalendarEventItem[] {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = addDays(weekStart, 6);
  end.setHours(23, 59, 59, 999);
  const res: CalendarEventItem[] = [];
  for (const e of events) {
    const dt = new Date(e.year, e.month, e.day);
    if (dt >= start && dt <= end) {
      res.push(e);
    }
  }
  return res.sort((a, b) => {
    const ta = new Date(a.year, a.month, a.day).getTime();
    const tb = new Date(b.year, b.month, b.day).getTime();
    if (ta !== tb) {
      return ta - tb;
    }
    return a.name.localeCompare(b.name);
  });
}

export function isSameLocalDay(
  cell: { y: number; m: number; d: number },
  ref: Date,
): boolean {
  return (
    cell.y === ref.getFullYear() &&
    cell.m === ref.getMonth() &&
    cell.d === ref.getDate()
  );
}
