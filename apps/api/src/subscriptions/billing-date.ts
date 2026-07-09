export type BillableInterval = "monthly" | "yearly";

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatIsoDate(year: number, month: number, day: number): string {
  const y = String(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseIsoDate(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number);
  return { year, month, day };
}

/** Advance a `YYYY-MM-DD` billing date by one interval (UTC calendar math). */
export function advanceNextBillingDate(
  current: string,
  interval: BillableInterval,
): string {
  const { year, month, day } = parseIsoDate(current);

  if (interval === "yearly") {
    const newYear = year + 1;
    const maxDay = daysInMonth(newYear, month);
    return formatIsoDate(newYear, month, Math.min(day, maxDay));
  }

  let newMonth = month + 1;
  let newYear = year;
  if (newMonth > 12) {
    newMonth = 1;
    newYear += 1;
  }
  const maxDay = daysInMonth(newYear, newMonth);
  return formatIsoDate(newYear, newMonth, Math.min(day, maxDay));
}

export function todayUtcIso(now = new Date()): string {
  return formatIsoDate(
    now.getUTCFullYear(),
    now.getUTCMonth() + 1,
    now.getUTCDate(),
  );
}

export function isDateOnOrBeforeToday(iso: string, now = new Date()): boolean {
  return iso <= todayUtcIso(now);
}
