import { Calendar01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Button,
  buttonVariants,
  Calendar,
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
} from "@saascription/ui";
import { HTTPError } from "ky";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  validateSubscriptions,
} from "../lib/subscriptions";
import {
  useReplaceWorkspaceSubscriptionsMutation,
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

export function ConfigureSubscriptionsPage() {
  const subscriptionsQuery = useWorkspaceSubscriptionsQuery();
  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<
    Record<string, RowFieldErrors>
  >({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const initialized = useRef(false);

  const replaceMutation = useReplaceWorkspaceSubscriptionsMutation({
    onSuccess: (data) => {
      setRows(data.subscriptions);
      setBaseline(serializeSubscriptionsSnapshot(data.subscriptions));
      setRowErrors({});
      setSaveError(null);
    },
    onError: async (e) => {
      if (e instanceof HTTPError) {
        try {
          const j = (await e.response.json()) as { error?: string };
          setSaveError(j.error ?? e.message);
        } catch {
          setSaveError(e.message);
        }
      } else {
        setSaveError(e instanceof Error ? e.message : "Save failed");
      }
    },
  });

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
    setBaseline(serializeSubscriptionsSnapshot(list));
  }, [subscriptionsQuery.isSuccess, subscriptionsQuery.data]);

  const isDirty =
    baseline !== null &&
    serializeSubscriptionsSnapshot(rows) !== baseline;

  const hasValidationErrors =
    Object.keys(validateSubscriptions(rows)).length > 0;

  const ready =
    subscriptionsQuery.isSuccess && baseline !== null && initialized.current;

  const saveDisabled =
    !ready ||
    !isDirty ||
    hasValidationErrors ||
    replaceMutation.isPending;

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptySubscriptionRow()]);
    setSaveError(null);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setRowErrors((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSaveError(null);
  }, []);

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
      setSaveError(null);
    },
    [],
  );

  const handleSave = useCallback(() => {
    const errors = validateSubscriptions(rows);
    if (Object.keys(errors).length > 0) {
      setRowErrors(errors);
      return;
    }
    setRowErrors({});
    replaceMutation.mutate(rows);
  }, [rows, replaceMutation]);

  const loadError =
    subscriptionsQuery.isError && subscriptionsQuery.error
      ? subscriptionsQuery.error instanceof Error
        ? subscriptionsQuery.error.message
        : "Could not load subscriptions."
      : null;

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
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Back
          </Link>
        </div>
      </header>
      <div className={DASH_SCROLL_CONTENT}>
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-6">
          <p className="max-w-2xl text-sm text-muted-foreground">
            Enter each subscription below. Pick the next billing date from the
            calendar; other fields are required.{" "}
            <span className="font-medium text-foreground">Save</span> writes to
            your workspace; the save button stays off while everything matches the
            server.
          </p>

          {loadError ? (
            <p className="text-sm text-destructive">{loadError}</p>
          ) : null}
          {saveError ? (
            <p className="text-sm text-destructive">{saveError}</p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={addRow}
                disabled={!subscriptionsQuery.isSuccess}
              >
                Add subscription
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saveDisabled}
              >
                Save
              </Button>
              {ready && !isDirty ? (
                <span className="text-xs font-medium text-muted-foreground">
                  Up to date
                </span>
              ) : null}
            </div>
            {subscriptionsQuery.isPending ? (
              <span className="text-xs text-muted-foreground">Loading…</span>
            ) : ready && rows.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No rows yet — add one to get started.
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            {rows.map((row, index) => {
              const err = rowErrors[row.id];
              return (
                <div
                  key={row.id}
                  className="rounded-lg border border-border/80 bg-background p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Subscription {index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-destructive"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Remove subscription ${index + 1}`}
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                      Remove
                    </Button>
                  </div>
                  <FieldGroup className="gap-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field data-invalid={err?.name ? true : undefined}>
                        <FieldLabel htmlFor={`sub-name-${row.id}`}>
                          SaaS / product <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={`sub-name-${row.id}`}
                          required
                          placeholder="e.g. Notion, AWS, Spotify"
                          aria-invalid={err?.name ? true : undefined}
                          value={row.name}
                          onChange={(e) =>
                            patchRow(row.id, { name: e.target.value })
                          }
                        />
                        {err?.name ? <FieldError>{err.name}</FieldError> : null}
                      </Field>
                      <Field data-invalid={err?.amount ? true : undefined}>
                        <FieldLabel htmlFor={`sub-amount-${row.id}`}>
                          Amount <span className="text-destructive">*</span>
                        </FieldLabel>
                        <Input
                          id={`sub-amount-${row.id}`}
                          required
                          inputMode="decimal"
                          placeholder="e.g. 49 or 49.99"
                          aria-invalid={err?.amount ? true : undefined}
                          value={row.amount}
                          onChange={(e) =>
                            patchRow(row.id, { amount: e.target.value })
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
                          Billing <span className="text-destructive">*</span>
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
                      <Field data-invalid={err?.nextBillingAt ? true : undefined}>
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
