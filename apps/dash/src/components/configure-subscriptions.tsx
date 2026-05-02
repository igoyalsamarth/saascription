import {
  Calendar01Icon,
  Cancel01Icon,
  Delete02Icon,
  FloppyDiskIcon,
  PencilEdit02Icon,
  Undo02Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Badge,
  Button,
  buttonVariants,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  SidebarTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@saascription/ui";
import { HTTPError } from "ky";
import { Link } from "@tanstack/react-router";
import {
  type ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  DASH_SCROLL_CONTENT,
  DASH_STICKY_HEADER,
  DASH_STICKY_HEADER_PAD,
} from "../lib/dashboard-page-layout";
import {
  emptySubscriptionRow,
  isoDateLocal,
  serializeSubscriptionsSnapshot,
  type BillingInterval,
  type RowFieldErrors,
  type SubscriptionRow,
  validateSubscriptionRow,
} from "../lib/subscriptions";
import {
  useCancelSubscriptionMutation,
  useCreateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useWorkspaceSubscriptionsQuery,
} from "../services/subscriptions";

const intervalOptions: { value: BillingInterval; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "custom", label: "Custom / other" },
];

const selectClass =
  "h-7 w-full min-w-0 rounded-md border border-input bg-input/20 px-2 py-0.5 text-sm transition-colors outline-none " +
  "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-xs/relaxed dark:bg-input/30";

function intervalLabel(v: BillingInterval): string {
  return intervalOptions.find((o) => o.value === v)?.label ?? v;
}

function formatCancelledAt(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) {
    return iso;
  }
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * Icon action tooltips: Base UI defaults to ~600ms open delay; `delay={0}` makes them visible.
 * Hover is attached to a wrapping `span` so disabled buttons (pointer-events: none) still show tips.
 */
function SubscriptionActionTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        render={<span className="inline-flex">{children}</span>}
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function rowsContentEqual(a: SubscriptionRow, b: SubscriptionRow): boolean {
  return (
    serializeSubscriptionsSnapshot([a]) === serializeSubscriptionsSnapshot([b])
  );
}

function SubscriptionNextBillingPicker({
  id,
  value,
  hasError,
  onChange,
}: {
  id: string;
  value: string;
  hasError: boolean;
  onChange: (iso: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => {
    if (!value?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
      return undefined;
    }
    const [y, m, d] = value.trim().split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return Number.isFinite(dt.getTime()) ? dt : undefined;
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "h-7 w-full min-w-0 justify-start gap-2 px-2 font-normal md:text-xs/relaxed",
          !selected && "text-muted-foreground",
          hasError && "border-destructive ring-1 ring-destructive/25",
        )}
        aria-invalid={hasError ? true : undefined}
      >
        <HugeiconsIcon
          icon={Calendar01Icon}
          className="size-3.5 shrink-0 opacity-70"
          aria-hidden
        />
        <span className="truncate">
          {selected
            ? selected.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Pick a date"}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          captionLayout="dropdown"
          defaultMonth={selected}
          selected={selected}
          onSelect={(d) => {
            if (d) {
              onChange(isoDateLocal(d));
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

async function httpErrorMessage(e: unknown): Promise<string> {
  if (e instanceof HTTPError) {
    try {
      const j = (await e.response.json()) as { error?: string };
      return j.error ?? e.message;
    } catch {
      return e.message;
    }
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

type CardMode = "view" | "edit";

export function ConfigureSubscriptionsPage() {
  const subscriptionsQuery = useWorkspaceSubscriptionsQuery();
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [modeById, setModeById] = useState<Record<string, CardMode>>({});
  const [baselineById, setBaselineById] = useState<
    Record<string, SubscriptionRow>
  >({});
  const [pendingIds, setPendingIds] = useState<Set<string>>(() => new Set());
  const [rowErrors, setRowErrors] = useState<
    Record<string, RowFieldErrors>
  >({});
  const [apiErrorById, setApiErrorById] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const initialized = useRef(false);

  const createMutation = useCreateSubscriptionMutation();
  const updateMutation = useUpdateSubscriptionMutation();
  const deleteMutation = useDeleteSubscriptionMutation();
  const cancelSubscriptionMutation = useCancelSubscriptionMutation();

  useEffect(() => {
    if (
      !subscriptionsQuery.isSuccess ||
      !subscriptionsQuery.data ||
      initialized.current
    ) {
      return;
    }
    initialized.current = true;
    const list = subscriptionsQuery.data.subscriptions;
    setRows(list);
    const b: Record<string, SubscriptionRow> = {};
    const m: Record<string, CardMode> = {};
    for (const r of list) {
      b[r.id] = { ...r };
      m[r.id] = "view";
    }
    setBaselineById(b);
    setModeById(m);
  }, [subscriptionsQuery.isSuccess, subscriptionsQuery.data]);

  const patchRow = useCallback(
    (id: string, patch: Partial<SubscriptionRow>) => {
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      );
      setRowErrors((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setApiErrorById((prev) => {
        if (!prev[id]) {
          return prev;
        }
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [],
  );

  const addRow = useCallback(() => {
    const row = emptySubscriptionRow();
    setRows((prev) => [...prev, row]);
    setModeById((m) => ({ ...m, [row.id]: "edit" }));
    setPendingIds((p) => new Set(p).add(row.id));
  }, []);

  const enterEdit = useCallback((id: string) => {
    setModeById((m) => ({ ...m, [id]: "edit" }));
  }, []);

  const cancelCard = useCallback(
    (id: string) => {
      if (pendingIds.has(id)) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        setPendingIds((p) => {
          const n = new Set(p);
          n.delete(id);
          return n;
        });
        setModeById((m) => {
          const next = { ...m };
          delete next[id];
          return next;
        });
      } else {
        const base = baselineById[id];
        if (base) {
          setRows((prev) =>
            prev.map((r) => (r.id === id ? { ...base } : r)),
          );
        }
        setModeById((m) => ({ ...m, [id]: "view" }));
      }
      setRowErrors((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
      setApiErrorById((e) => {
        const next = { ...e };
        delete next[id];
        return next;
      });
    },
    [baselineById, pendingIds],
  );

  const saveCard = useCallback(
    async (id: string) => {
      const row = rows.find((r) => r.id === id);
      if (!row) {
        return;
      }
      if (!pendingIds.has(id) && row.status === "cancelled") {
        return;
      }
      const errors = validateSubscriptionRow(row);
      if (errors) {
        setRowErrors((prev) => ({ ...prev, [id]: errors }));
        return;
      }
      setRowErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setSavingId(id);
      try {
        if (pendingIds.has(id)) {
          const res = await createMutation.mutateAsync(row);
          const saved = res.subscription;
          setPendingIds((p) => {
            const n = new Set(p);
            n.delete(id);
            return n;
          });
          setRows((prev) =>
            prev.map((r) => (r.id === id ? saved : r)),
          );
          setBaselineById((b) => ({ ...b, [saved.id]: { ...saved } }));
          setModeById((m) => ({ ...m, [saved.id]: "view" }));
        } else {
          const res = await updateMutation.mutateAsync({
            id,
            row,
          });
          const saved = res.subscription;
          setRows((prev) =>
            prev.map((r) => (r.id === saved.id ? saved : r)),
          );
          setBaselineById((b) => ({ ...b, [saved.id]: { ...saved } }));
          setModeById((m) => ({ ...m, [saved.id]: "view" }));
        }
        setApiErrorById((e) => {
          const next = { ...e };
          delete next[id];
          return next;
        });
      } catch (e) {
        const msg = await httpErrorMessage(e);
        setApiErrorById((prev) => ({
          ...prev,
          [id]: msg,
        }));
      } finally {
        setSavingId(null);
      }
    },
    [rows, pendingIds, createMutation, updateMutation],
  );

  const cancelSubscriptionCard = useCallback(
    async (id: string) => {
      setSavingId(id);
      try {
        const res = await cancelSubscriptionMutation.mutateAsync(id);
        const saved = res.subscription;
        setRows((prev) =>
          prev.map((r) => (r.id === saved.id ? saved : r)),
        );
        setBaselineById((b) => ({ ...b, [saved.id]: { ...saved } }));
        setModeById((m) => ({ ...m, [saved.id]: "view" }));
        setApiErrorById((e) => {
          const next = { ...e };
          delete next[id];
          return next;
        });
      } catch (e) {
        const msg = await httpErrorMessage(e);
        setApiErrorById((prev) => ({
          ...prev,
          [id]: msg,
        }));
      } finally {
        setSavingId(null);
      }
    },
    [cancelSubscriptionMutation],
  );

  const deleteCard = useCallback(
    async (id: string) => {
      if (pendingIds.has(id)) {
        setRows((prev) => prev.filter((r) => r.id !== id));
        setPendingIds((p) => {
          const n = new Set(p);
          n.delete(id);
          return n;
        });
        setModeById((m) => {
          const next = { ...m };
          delete next[id];
          return next;
        });
        return;
      }
      setSavingId(id);
      try {
        await deleteMutation.mutateAsync(id);
        setRows((prev) => prev.filter((r) => r.id !== id));
        setBaselineById((b) => {
          const next = { ...b };
          delete next[id];
          return next;
        });
        setModeById((m) => {
          const next = { ...m };
          delete next[id];
          return next;
        });
      } catch (e) {
        const msg = await httpErrorMessage(e);
        setApiErrorById((prev) => ({
          ...prev,
          [id]: msg,
        }));
      } finally {
        setSavingId(null);
      }
    },
    [pendingIds, deleteMutation],
  );

  const loadError =
    subscriptionsQuery.isError && subscriptionsQuery.error
      ? subscriptionsQuery.error instanceof Error
        ? subscriptionsQuery.error.message
        : "Could not load subscriptions."
      : null;

  const ready =
    subscriptionsQuery.isSuccess && initialized.current;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
        <header className={DASH_STICKY_HEADER}>
          <div
            className={
              DASH_STICKY_HEADER_PAD +
              " flex flex-wrap items-center justify-between gap-3"
            }
          >
            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger className="-ml-1 md:hidden" />
              <div className="min-w-0">
                <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                  Configure
                </p>
                <h1 className="text-lg font-semibold tracking-tight text-foreground">
                  Your subscriptions
                </h1>
              </div>
            </div>
            <Link
              to="/configure"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
              )}
            >
              Back
            </Link>
          </div>
        </header>
        <div className={DASH_SCROLL_CONTENT}>
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Add subscriptions one at a time. Each card saves on its own. Saved
            cards stay read-only until you edit.
          </p>

          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              onClick={addRow}
              disabled={!subscriptionsQuery.isSuccess}
            >
              Add subscription
            </Button>
            {subscriptionsQuery.isPending ? (
              <span className="text-xs text-muted-foreground">Loading…</span>
            ) : ready && rows.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No subscriptions yet — add one to get started.
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            {rows.map((row, index) => {
              const mode = modeById[row.id] ?? "view";
              const err = rowErrors[row.id];
              const apiErr = apiErrorById[row.id];
              const isPending = pendingIds.has(row.id);
              const baseline = baselineById[row.id];
              const isSaving = savingId === row.id;
              const dirty =
                isPending ||
                !baseline ||
                !rowsContentEqual(row, baseline);

              const validationErr = validateSubscriptionRow(row);
              const invalid = validationErr !== null;
              const saveDisabled =
                isSaving ||
                invalid ||
                (!isPending && !dirty);
              const isCancelled = row.status === "cancelled";

              return (
                <Card
                  key={row.id}
                  className="border-border/80 shadow-sm"
                >
                  {mode === "view" ? (
                    <>
                      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 pb-3">
                        <div className="min-w-0 flex-1">
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <CardTitle className="text-base leading-snug">
                              {row.name || "Untitled"}
                            </CardTitle>
                            {isCancelled ? (
                              <Badge variant="destructive">Cancelled</Badge>
                            ) : null}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1">
                          <SubscriptionActionTooltip label="Edit">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              disabled={isSaving || isCancelled}
                              aria-label="Edit subscription"
                              onClick={() => enterEdit(row.id)}
                            >
                              <HugeiconsIcon
                                icon={PencilEdit02Icon}
                                className="size-3.5"
                                aria-hidden
                              />
                            </Button>
                          </SubscriptionActionTooltip>
                          {!isPending && !isCancelled ? (
                            <SubscriptionActionTooltip label="Cancel">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                disabled={isSaving}
                                aria-label="Cancel"
                                onClick={() =>
                                  cancelSubscriptionCard(row.id)
                                }
                              >
                                <HugeiconsIcon
                                  icon={Cancel01Icon}
                                  className="size-3.5"
                                  aria-hidden
                                />
                              </Button>
                            </SubscriptionActionTooltip>
                          ) : null}
                          <SubscriptionActionTooltip label="Delete">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                              disabled={isSaving}
                              aria-label="Delete subscription"
                              onClick={() => deleteCard(row.id)}
                            >
                              <HugeiconsIcon
                                icon={Delete02Icon}
                                className="size-3.5"
                                aria-hidden
                              />
                            </Button>
                          </SubscriptionActionTooltip>
                        </div>
                      </CardHeader>
                      <CardContent className="grid gap-3 pt-0 text-sm">
                        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-border/60 pb-3">
                          <span className="text-muted-foreground">
                            Amount
                          </span>
                          <span className="font-medium tabular-nums">
                            {row.amount ? `$${row.amount}` : "—"}
                          </span>
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-border/60 pb-3">
                          <span className="text-muted-foreground">
                            Billing
                          </span>
                          <span>{intervalLabel(row.interval)}</span>
                        </div>
                        <div className="flex flex-wrap justify-between gap-x-6 gap-y-1">
                          <span className="text-muted-foreground">
                            Next billing
                          </span>
                          <span>
                            {row.nextBillingAt
                              ? new Date(
                                  row.nextBillingAt + "T12:00:00",
                                ).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                        {isCancelled && row.cancelledAt ? (
                          <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-border/60 pt-3">
                            <span className="text-muted-foreground">
                              Cancelled on
                            </span>
                            <span className="text-sm">
                              {formatCancelledAt(row.cancelledAt)}
                            </span>
                          </div>
                        ) : null}
                        {apiErr ? (
                          <p className="text-sm text-destructive">{apiErr}</p>
                        ) : null}
                      </CardContent>
                    </>
                  ) : (
                    <>
                      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
                        <p className="text-[0.625rem] font-medium uppercase tracking-wide text-muted-foreground">
                          {isPending ? "New subscription" : "Edit"}{" "}
                          <span className="sr-only">{index + 1}</span>
                        </p>
                        <div className="flex flex-wrap gap-1">
                          <SubscriptionActionTooltip label="Save">
                            <Button
                              type="button"
                              size="icon-sm"
                              disabled={
                                saveDisabled ||
                                !subscriptionsQuery.isSuccess
                              }
                              aria-label="Save subscription"
                              onClick={() => saveCard(row.id)}
                            >
                              <HugeiconsIcon
                                icon={FloppyDiskIcon}
                                className="size-3.5"
                                aria-hidden
                              />
                            </Button>
                          </SubscriptionActionTooltip>
                          <SubscriptionActionTooltip label="Discard">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              disabled={isSaving}
                              aria-label="Discard changes"
                              onClick={() => cancelCard(row.id)}
                            >
                              <HugeiconsIcon
                                icon={Undo02Icon}
                                className="size-3.5"
                                aria-hidden
                              />
                            </Button>
                          </SubscriptionActionTooltip>
                          {!isPending ? (
                            <SubscriptionActionTooltip label="Delete">
                              <Button
                                type="button"
                                size="icon-sm"
                                variant="outline"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={isSaving}
                                aria-label="Delete subscription"
                                onClick={() => deleteCard(row.id)}
                              >
                                <HugeiconsIcon
                                  icon={Delete02Icon}
                                  className="size-3.5"
                                  aria-hidden
                                />
                              </Button>
                            </SubscriptionActionTooltip>
                          ) : null}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <FieldGroup className="gap-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field data-invalid={err?.name ? true : undefined}>
                              <FieldLabel htmlFor={`sub-name-${row.id}`}>
                                SaaS / product{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Input
                                id={`sub-name-${row.id}`}
                                required
                                placeholder="e.g. Notion, AWS, Spotify"
                                aria-invalid={err?.name ? true : undefined}
                                value={row.name}
                                onChange={(e) =>
                                  patchRow(row.id, {
                                    name: e.target.value,
                                  })
                                }
                              />
                              {err?.name ? (
                                <FieldError>{err.name}</FieldError>
                              ) : null}
                            </Field>
                            <Field
                              data-invalid={err?.amount ? true : undefined}
                            >
                              <FieldLabel htmlFor={`sub-amount-${row.id}`}>
                                Amount{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <Input
                                id={`sub-amount-${row.id}`}
                                required
                                inputMode="decimal"
                                placeholder="e.g. 49 or 49.99"
                                aria-invalid={err?.amount ? true : undefined}
                                value={row.amount}
                                onChange={(e) =>
                                  patchRow(row.id, {
                                    amount: e.target.value,
                                  })
                                }
                              />
                              {err?.amount ? (
                                <FieldError>{err.amount}</FieldError>
                              ) : null}
                            </Field>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <Field>
                              <FieldLabel htmlFor={`sub-interval-${row.id}`}>
                                Billing{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <select
                                id={`sub-interval-${row.id}`}
                                required
                                className={selectClass}
                                value={row.interval}
                                onChange={(e) =>
                                  patchRow(row.id, {
                                    interval: e.target.value as BillingInterval,
                                  })
                                }
                              >
                                {intervalOptions.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </Field>
                            <Field
                              data-invalid={
                                err?.nextBillingAt ? true : undefined
                              }
                            >
                              <FieldLabel htmlFor={`sub-next-${row.id}`}>
                                Next billing{" "}
                                <span className="text-destructive">*</span>
                              </FieldLabel>
                              <SubscriptionNextBillingPicker
                                id={`sub-next-${row.id}`}
                                value={row.nextBillingAt}
                                hasError={!!err?.nextBillingAt}
                                onChange={(iso) =>
                                  patchRow(row.id, { nextBillingAt: iso })
                                }
                              />
                              {err?.nextBillingAt ? (
                                <FieldError>{err.nextBillingAt}</FieldError>
                              ) : null}
                            </Field>
                          </div>
                        </FieldGroup>
                        {apiErr ? (
                          <p className="mt-3 text-sm text-destructive">
                            {apiErr}
                          </p>
                        ) : null}
                      </CardContent>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
