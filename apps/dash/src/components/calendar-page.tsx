import {
  Add01Icon,
  Alert01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  MoreHorizontalIcon,
  Notification01Icon,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarTrigger,
} from "@saascription/ui";
import { useCallback, useMemo, useState } from "react";
import { useUserMe } from "@/services/user";
import {
  addDays,
  addMonth,
  CALENDAR_DEMO_EVENTS,
  DEMO_TODAY,
  eventsForDate,
  getMonthGrid,
  isDemoToday,
  listEventsInMonth,
  listEventsInWeek,
  SAVINGS_TIP,
  startOfWeekSunday,
} from "../lib/calendar-mock";
import type { CalendarViewMode } from "../lib/calendar-types";
import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

const DEMO_YEAR = 2023;
const DEMO_MONTH = 9;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function weekRangeLabel(start: Date) {
  const end = addDays(start, 6);
  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function CalendarPage() {
  const { data: user } = useUserMe();
  const [year, setYear] = useState(DEMO_YEAR);
  const [month, setMonth] = useState(DEMO_MONTH);
  const [view, setView] = useState<CalendarViewMode>("month");
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeekSunday(new Date(DEMO_YEAR, DEMO_MONTH, 1)),
  );

  const userLabel = user?.id
    ? `User ID: ${user.id.length > 20 ? `${user.id.slice(0, 10)}…` : user.id}`
    : "Signed in";

  const goPrev = useCallback(() => {
    if (view === "week") {
      setWeekStart((s) => addDays(s, -7));
      return;
    }
    const n = addMonth(year, month, -1);
    setYear(n.y);
    setMonth(n.m);
  }, [view, year, month]);

  const goNext = useCallback(() => {
    if (view === "week") {
      setWeekStart((s) => addDays(s, 7));
      return;
    }
    const n = addMonth(year, month, 1);
    setYear(n.y);
    setMonth(n.m);
  }, [view, year, month]);

  const headerLabel = useMemo(() => {
    if (view === "week") {
      return weekRangeLabel(weekStart);
    }
    return `${MONTH_NAMES[month]} ${year}`;
  }, [view, weekStart, month, year]);

  const onViewChange = (v: CalendarViewMode) => {
    setView(v);
    if (v === "week") {
      if (view !== "week") {
        setWeekStart(startOfWeekSunday(new Date(year, month, 1)));
      }
    }
  };

  const monthGrid = useMemo(() => getMonthGrid(year, month), [year, month]);

  const listRows = useMemo(() => listEventsInMonth(year, month), [year, month]);

  const railWeekStart = useMemo(() => {
    if (year === DEMO_YEAR && month === DEMO_MONTH) {
      return startOfWeekSunday(DEMO_TODAY);
    }
    return startOfWeekSunday(new Date(year, month, 1));
  }, [year, month]);

  const weekRailEvents = useMemo(
    () => listEventsInWeek(railWeekStart),
    [railWeekStart],
  );

  const dayTotal = (y: number, m: number, d: number) => {
    const ev = eventsForDate(y, m, d);
    let sum = 0;
    for (const e of ev) {
      const n = Number.parseFloat(e.amount.replace(/[^0-9.]/g, ""));
      if (!Number.isNaN(n)) sum += n;
    }
    return sum;
  };

  const todayAws = useMemo(
    () =>
      CALENDAR_DEMO_EVENTS.find(
        (e) =>
          e.year === DEMO_TODAY.getFullYear() &&
          e.month === DEMO_TODAY.getMonth() &&
          e.day === DEMO_TODAY.getDate() &&
          e.id === "e3",
      ),
    [],
  );
  const todayTotal = dayTotal(
    DEMO_TODAY.getFullYear(),
    DEMO_TODAY.getMonth(),
    DEMO_TODAY.getDate(),
  );

  const weekRowDays = useMemo(() => {
    const d: Date[] = [];
    for (let i = 0; i < 7; i++) {
      d.push(addDays(weekStart, i));
    }
    return d;
  }, [weekStart]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <header
        className={cn(
          DASH_STICKY_HEADER,
          "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4",
          DASH_STICKY_HEADER_PAD,
        )}
      >
        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Subscription Calendar
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">{userLabel}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col flex-wrap items-stretch justify-end gap-2 sm:max-w-3xl sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center justify-center gap-1 sm:min-w-0 sm:flex-1 sm:justify-center">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={goPrev}
              aria-label="Previous"
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                className="size-3.5 text-foreground"
              />
            </Button>
            <span className="min-w-0 truncate text-center text-xs font-medium text-foreground sm:px-2">
              {headerLabel}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              onClick={goNext}
              aria-label="Next"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-3.5 text-foreground"
              />
            </Button>
          </div>

          <div className="flex shrink-0 items-center justify-center gap-0.5 rounded-md border border-border/80 bg-muted/40 p-0.5">
            {(
              [
                ["month", "Month"],
                ["week", "Week"],
                ["list", "List"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onViewChange(id);
                }}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "sm" }),
                  "h-6 rounded-sm px-2.5 text-[0.625rem]",
                  view === id
                    ? "bg-background text-foreground shadow-sm dark:bg-input/50"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="relative"
              aria-label="Notifications"
            >
              <HugeiconsIcon
                icon={Notification01Icon}
                className="size-4 text-foreground"
              />
              <span
                className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary ring-2 ring-background"
                aria-hidden
              />
            </Button>
          </div>
        </div>
      </header>

      <div className={cn(DASH_SCROLL_CONTENT, "p-4 sm:p-6")}>
        <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0 flex-1">
            {view === "month" && (
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                <div className="grid grid-cols-7">
                  {DAY_LABELS.map((d) => (
                    <div
                      key={d}
                      className="border-b border-border/60 py-2 text-center text-[0.625rem] font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      {d}
                    </div>
                  ))}
                  {monthGrid.map((cell, i) => {
                    const evs = eventsForDate(cell.y, cell.m, cell.d);
                    const isToday = isDemoToday(cell);
                    return (
                      <div
                        key={`${cell.y}-${cell.m}-${cell.d}`}
                        className={cn(
                          "min-h-[96px] border-b border-r border-border/50 p-1.5 sm:min-h-[112px] sm:p-2",
                          i % 7 === 0 && "border-l border-border/50",
                          !cell.inMonth && "bg-muted/20",
                        )}
                      >
                        <div className="relative flex items-start justify-between">
                          <span
                            className={cn(
                              "text-[0.625rem] font-medium tabular-nums",
                              cell.inMonth
                                ? "text-foreground"
                                : "text-muted-foreground/70",
                            )}
                          >
                            {cell.d}
                          </span>
                          {isToday && (
                            <span
                              className="mt-0.5 size-1.5 rounded-full bg-primary"
                              title="Today"
                            />
                          )}
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                          {evs.map((e) => (
                            <div
                              key={e.id}
                              className={cn(
                                "flex flex-col gap-0.5 rounded-md border border-border/30 px-1.5 py-1",
                                e.cardBg,
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-background/60">
                                  <HugeiconsIcon
                                    icon={e.icon}
                                    className={cn("size-2.5", e.iconClass)}
                                  />
                                </span>
                                <span className="min-w-0 flex-1 truncate text-[0.625rem] font-medium text-foreground">
                                  {e.name}
                                </span>
                              </div>
                              <span className="pl-6 text-[0.5625rem] text-muted-foreground">
                                {e.amount}
                              </span>
                              {e.expiringSubtext ? (
                                <p className="pl-6 text-[0.5rem] font-medium text-red-600">
                                  {e.expiringSubtext}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "week" && (
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                <div className="grid grid-cols-7 divide-x divide-border/50">
                  {weekRowDays.map((d) => {
                    const y = d.getFullYear();
                    const m = d.getMonth();
                    const day = d.getDate();
                    const evs = eventsForDate(y, m, day);
                    const isToday = isDemoToday({ y, m, d: day });
                    return (
                      <div key={+d} className="min-h-[180px] p-1.5 sm:p-2">
                        <div className="border-b border-border/50 pb-2 text-center">
                          <p className="text-[0.625rem] font-semibold tracking-wide text-muted-foreground uppercase">
                            {DAY_LABELS[d.getDay()]}
                          </p>
                          <div className="relative mt-1 flex items-center justify-center">
                            <span
                              className={cn(
                                "text-sm font-semibold tabular-nums",
                                m === month && y === year
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {day}
                            </span>
                            {isToday && (
                              <span className="absolute -right-1 -top-0.5 size-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                        </div>
                        <div className="mt-1 flex flex-col gap-1">
                          {evs.map((e) => (
                            <div
                              key={e.id}
                              className={cn(
                                "flex flex-col gap-0.5 rounded-md border border-border/30 px-1.5 py-1",
                                e.cardBg,
                              )}
                            >
                              <div className="flex items-center gap-1">
                                <HugeiconsIcon
                                  icon={e.icon}
                                  className={cn("size-2.5", e.iconClass)}
                                />
                                <span className="min-w-0 flex-1 truncate text-[0.625rem] font-medium">
                                  {e.name}
                                </span>
                              </div>
                              <span className="text-[0.5625rem] text-muted-foreground">
                                {e.amount}
                              </span>
                              {e.expiringSubtext ? (
                                <p className="text-[0.5rem] font-medium text-red-600">
                                  {e.expiringSubtext}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {view === "list" && (
              <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
                <div className="border-b border-border/60 px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {MONTH_NAMES[month]} {year}
                  </p>
                  <p className="text-[0.625rem] text-muted-foreground">
                    Renewals in this month
                  </p>
                </div>
                <ul className="divide-y divide-border/60">
                  {listRows.length === 0 ? (
                    <li className="px-4 py-8 text-center text-sm text-muted-foreground">
                      No renewals in this month.
                    </li>
                  ) : (
                    listRows.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted/60">
                          <HugeiconsIcon
                            icon={e.icon}
                            className={cn("size-4", e.iconClass)}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {e.name}
                          </p>
                          <p className="text-[0.625rem] text-muted-foreground">
                            {e.date.toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {e.amount}
                        </p>
                        {e.expiringSubtext ? (
                          <span className="shrink-0 text-[0.625rem] font-medium text-red-600">
                            {e.expiringSubtext}
                          </span>
                        ) : null}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )}
          </div>

          <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-4 lg:max-w-sm lg:self-start">
            <Card className="border-border/80 shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-semibold">
                    Upcoming this week
                  </CardTitle>
                  <CardDescription className="text-[0.625rem]">
                    Renewals in the selected period
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className={buttonVariants({
                      variant: "ghost",
                      size: "icon",
                      className: "size-7 text-muted-foreground",
                    })}
                    aria-label="More"
                  >
                    <HugeiconsIcon
                      icon={MoreHorizontalIcon}
                      className="size-3.5"
                    />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem>Export week</DropdownMenuItem>
                    <DropdownMenuItem>Settings</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="space-y-3">
                {year === DEMO_YEAR && month === DEMO_MONTH && todayAws ? (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="flex size-6 items-center justify-center rounded-full border-2 border-primary/40 bg-primary/10 text-[0.625rem] font-semibold text-foreground">
                        {DEMO_TODAY.getDate()}
                      </span>
                      <span
                        className="mt-0.5 w-px flex-1 min-h-[2rem] bg-border"
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Today,{" "}
                          {DEMO_TODAY.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-[0.625rem] text-muted-foreground">
                          Total:{" "}
                          <span className="font-medium text-foreground">
                            {todayTotal > 0
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: "USD",
                                }).format(todayTotal)
                              : "—"}
                          </span>
                        </p>
                      </div>
                      <div
                        className={cn(
                          "space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/90 p-3 dark:border-amber-900/50 dark:bg-amber-950/40",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-full bg-background/80">
                            <HugeiconsIcon
                              icon={todayAws.icon}
                              className={cn("size-4", todayAws.iconClass)}
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-foreground">
                              {todayAws.name}
                            </p>
                            <p className="text-xs font-medium tabular-nums text-foreground">
                              {todayAws.amount}
                            </p>
                          </div>
                        </div>
                        {todayAws.manualReview ? (
                          <p className="inline-flex items-center gap-1 text-[0.625rem] font-medium text-amber-800 dark:text-amber-400">
                            <HugeiconsIcon
                              icon={Alert01Icon}
                              className="size-3.5"
                            />
                            Manual review needed
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : weekRailEvents.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {weekRailEvents.map((e) => (
                      <li
                        key={e.id}
                        className="flex items-center gap-2 rounded-md border border-border/50 p-2"
                      >
                        <HugeiconsIcon
                          icon={e.icon}
                          className={cn("size-3.5", e.iconClass)}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {e.name}
                        </span>
                        <span className="text-xs tabular-nums">{e.amount}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No renewals in this week for the demo.
                  </p>
                )}
              </CardContent>
              <CardFooter className="border-t border-border/60 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-primary/40 text-primary hover:bg-primary/5"
                >
                  <HugeiconsIcon icon={Add01Icon} className="size-3.5" />
                  Add event
                </Button>
              </CardFooter>
            </Card>

            <Card className="relative overflow-hidden border-border/60 shadow-sm">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-emerald-100/20 to-violet-200/30 dark:from-primary/10 dark:via-emerald-950/20 dark:to-violet-950/30"
                aria-hidden
              />
              <HugeiconsIcon
                icon={ShoppingBag01Icon}
                className="pointer-events-none absolute -right-2 -bottom-2 z-0 size-24 text-foreground/5"
                aria-hidden
              />
              <CardContent className="relative z-[1] p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Savings tip
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {SAVINGS_TIP}
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
