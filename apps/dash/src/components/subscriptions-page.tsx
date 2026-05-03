import {
  Alert01Icon,
  Calendar01Icon,
  Clock01Icon,
  Notification01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  Button,
  buttonVariants,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@saascription/ui";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import {
  apiSubscriptionToTableRow,
  filterSubscriptions,
  SUBSCRIPTION_TABS,
  type SubscriptionTabId,
  type SubscriptionTableRow,
} from "@/lib/subscriptions-table";
import { useWorkspaceSubscriptionsQuery } from "@/services/subscriptions";
import { useUserMe } from "@/services/user";
import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";

const pageSize = 6;

const tabTriggerClass =
  "data-active:font-semibold data-active:text-foreground " +
  "group-data-[variant=line]/tabs-list:after:!bg-primary " +
  "group-data-[variant=line]/tabs-list:data-active:after:!bg-primary";

function useSubscriptionColumns(): ColumnDef<SubscriptionTableRow, unknown>[] {
  return useMemo(
    () => [
      {
        id: "service",
        header: "Service name",
        cell: ({ row }) => {
          const r = row.original;
          return (
            <div className="flex min-w-0 max-w-[220px] items-center gap-3 sm:max-w-xs">
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full",
                  r.iconTone.bg,
                )}
                aria-hidden
              >
                <HugeiconsIcon
                  icon={r.icon}
                  className={cn("size-4", r.iconTone.text)}
                />
              </span>
              <div className="min-w-0 text-left">
                <p className="truncate font-medium text-foreground">{r.name}</p>
                <p className="truncate text-[0.625rem] text-muted-foreground">
                  {r.category}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: "plan",
        header: "Plan type",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.planType}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const s = row.original.status;
          if (s === "active") {
            return (
              <Badge
                variant="secondary"
                className="rounded-md border-0 bg-emerald-500/15 px-2.5 py-0.5 text-[0.625rem] font-medium text-emerald-800 dark:text-emerald-300"
              >
                Active
              </Badge>
            );
          }
          return (
            <Badge
              variant="secondary"
              className="rounded-md border-0 bg-muted px-2.5 py-0.5 text-[0.625rem] font-medium text-muted-foreground"
            >
              Cancelled
            </Badge>
          );
        },
      },
      {
        id: "renewal",
        header: "Next renewal",
        cell: ({ row }) => {
          const r = row.original;
          if (r.status === "cancelled" && r.endsOnLabel) {
            return (
              <span className="text-[0.625rem] text-muted-foreground">
                {r.endsOnLabel}
              </span>
            );
          }
          if (r.urgentRenewalLabel) {
            return (
              <span className="inline-flex items-center gap-1.5 text-[0.625rem] font-medium text-amber-600 dark:text-amber-500">
                {r.urgentRenewalLabel === "Tomorrow" ||
                r.urgentRenewalLabel === "Today" ? (
                  <HugeiconsIcon
                    icon={Alert01Icon}
                    className="size-3.5 shrink-0"
                  />
                ) : (
                  <HugeiconsIcon
                    icon={Clock01Icon}
                    className="size-3.5 shrink-0"
                  />
                )}
                {r.urgentRenewalLabel}
              </span>
            );
          }
          return (
            <span className="text-[0.625rem] text-muted-foreground">
              {r.renewalDateLabel}
            </span>
          );
        },
      },
      {
        id: "cost",
        header: "Cost",
        cell: ({ row }) => {
          const r = row.original;
          const suffix = r.costSuffix ? (
            <span className="font-normal text-muted-foreground">
              {" "}
              {r.costSuffix}
            </span>
          ) : null;
          if (r.status === "cancelled") {
            return (
              <p className="text-[0.625rem] text-muted-foreground line-through">
                {r.costAmount}
                {suffix}
              </p>
            );
          }
          return (
            <p className="font-semibold text-foreground tabular-nums">
              {r.costAmount}
              {suffix}
            </p>
          );
        },
      },
    ],
    [],
  );
}

function tabLabelContent(tab: (typeof SUBSCRIPTION_TABS)[number]) {
  if (tab.id === "expiring") {
    return (
      <span className="inline-flex items-center gap-1.5">
        {tab.label}
        <span
          className="size-1.5 shrink-0 rounded-full bg-amber-400"
          role="img"
          aria-label="You have renewals in the next 7 days"
        />
      </span>
    );
  }
  return tab.label;
}

export function SubscriptionsPage() {
  const { data: user } = useUserMe();
  const {
    data: subscriptionsPayload,
    isPending,
    isError,
    error,
  } = useWorkspaceSubscriptionsQuery();
  const [tab, setTab] = useState<SubscriptionTabId>("all");
  const [rangeLabel, setRangeLabel] = useState("Last 30 days");

  const userLabel = user?.id
    ? `User ID: ${user.id.length > 20 ? `${user.id.slice(0, 10)}…` : user.id}`
    : "Signed in";

  const tableRows = useMemo(() => {
    const raw = subscriptionsPayload?.subscriptions ?? [];
    return raw.map(apiSubscriptionToTableRow);
  }, [subscriptionsPayload?.subscriptions]);

  const data = useMemo(
    () => filterSubscriptions(tableRows, tab),
    [tableRows, tab],
  );

  const columns = useSubscriptionColumns();

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize } },
  });

  const { pageIndex, pageSize: ps } = table.getState().pagination;
  const total = data.length;
  const from = total === 0 ? 0 : pageIndex * ps + 1;
  const to = Math.min((pageIndex + 1) * ps, total);

  if (isPending) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-muted/30 px-4">
        <p className="text-sm text-muted-foreground">Loading subscriptions…</p>
      </div>
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Could not load subscriptions.";
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 bg-muted/30 px-4">
        <p className="text-sm text-destructive">{message}</p>
        <p className="text-center text-xs text-muted-foreground">
          Try refreshing. If this persists, check that the API is running and
          VITE_API_URL is correct.
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <header
        className={cn(
          DASH_STICKY_HEADER,
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          DASH_STICKY_HEADER_PAD,
        )}
      >
        <div className="flex min-w-0 items-start gap-2 sm:items-center sm:gap-3">
          <SidebarTrigger className="shrink-0 md:hidden" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              Subscriptions
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Track renewals, spend, and status ({userLabel})
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
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
          <DropdownMenu>
            <DropdownMenuTrigger
              className={buttonVariants({
                variant: "outline",
                size: "sm",
                className: "inline-flex gap-1.5",
              })}
            >
              <HugeiconsIcon
                icon={Calendar01Icon}
                className="size-3.5 text-muted-foreground"
              />
              {rangeLabel}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem
                onClick={() => {
                  setRangeLabel("Last 30 days");
                }}
              >
                Last 30 days
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setRangeLabel("Last 90 days");
                }}
              >
                Last 90 days
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div
        className={cn(
          DASH_SCROLL_CONTENT,
          "mx-auto w-full max-w-7xl p-4 sm:p-6",
        )}
      >
        <div className="space-y-4">
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as SubscriptionTabId);
              table.setPageIndex(0);
            }}
            className="w-full gap-0"
          >
            <TabsList
              variant="line"
              className="h-auto w-full flex-wrap justify-start gap-x-1 gap-y-0 border-0 p-0"
            >
              {SUBSCRIPTION_TABS.map((t) => (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={cn(
                    "px-2 text-[0.625rem] sm:text-xs",
                    tabTriggerClass,
                  )}
                >
                  {tabLabelContent(t)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow
                    key={headerGroup.id}
                    className="border-0 hover:bg-transparent"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-11 px-4 text-[0.625rem] font-semibold tracking-wide text-muted-foreground uppercase"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row, i) => (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "border-border/50 text-xs",
                        i % 2 === 1
                          ? "bg-primary/8 dark:bg-primary/10"
                          : "bg-background",
                        "hover:bg-muted/40",
                      )}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-4 py-3.5 align-middle"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No subscriptions in this view.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[0.625rem] text-muted-foreground">
                {total === 0
                  ? "No subscriptions to show"
                  : `Showing ${from}–${to} of ${total} subscription${total === 1 ? "" : "s"}`}
              </p>
              <div className="flex items-center justify-end gap-1">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-8 px-2 text-[0.625rem] text-muted-foreground"
                  onClick={() => {
                    table.previousPage();
                  }}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-[0.625rem] shadow-sm"
                  onClick={() => {
                    table.nextPage();
                  }}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
