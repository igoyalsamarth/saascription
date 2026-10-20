import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Button,
  buttonVariants,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
} from "@saascription/ui";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { readApiError } from "@/lib/api-error";
import {
  type BillingInterval,
  isKnownCategory,
  LISTING_CATEGORIES,
  type ListingCategory,
} from "@/lib/listings";
import { SELLER_SCROLL_CONTENT } from "@/lib/page-layout";
import type { SellerListing, SellerSaasInput } from "@/services/listings";

import { PageHeader } from "./page-header";

type FormErrors = {
  name?: string;
  iconUrl?: string;
  customCategory?: string;
  packages?: string;
};

type PriceRow = {
  key: string;
  name: string;
  amount: string;
  billingInterval: BillingInterval;
};

const selectClassName =
  "h-7 w-full rounded-md border border-input bg-input/20 px-2 text-xs/relaxed outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 dark:bg-input/30";

const MAX_PRICES = 12;

function websiteForStorage(value: string) {
  return value.trim().replace(/^https:\/\//i, "");
}

function isInsecureHttpWebsite(value: string) {
  return /^http:\/\//i.test(value.trim());
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function blankPriceRow(): PriceRow {
  return {
    key: crypto.randomUUID(),
    name: "",
    amount: "",
    billingInterval: "monthly",
  };
}

function centsToInput(cents: number) {
  const whole = Math.trunc(cents / 100);
  const fraction = Math.abs(cents % 100);
  if (fraction === 0) {
    return String(whole);
  }
  return `${whole}.${String(fraction).padStart(2, "0")}`;
}

function dollarsToCents(raw: string) {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const [whole = "0", fraction = ""] = trimmed.split(".");
  const cents =
    Number(whole) * 100 + Number(fraction.padEnd(2, "0").slice(0, 2));
  if (!Number.isSafeInteger(cents) || cents > 100_000_000) {
    return null;
  }
  return cents;
}

const MAX_LISTING_CATEGORIES = 3;

function cleanCategoryLabel(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function knownSlugForLabel(value: string): ListingCategory | null {
  const key = value.toLowerCase();
  return (
    LISTING_CATEGORIES.find(
      (category) =>
        category.slug === key || category.label.toLowerCase() === key,
    )?.slug ?? null
  );
}

function isCustomCategoryLabel(value: string) {
  return (
    value.length >= 2 &&
    value.length <= 40 &&
    /^[\p{L}\p{N}][\p{L}\p{N}&+.' -]*$/u.test(value)
  );
}

function placeCategory(
  raw: string,
  known: ListingCategory[],
  custom: string[],
): { known: ListingCategory[]; custom: string[]; error?: string } {
  const label = cleanCategoryLabel(raw);
  if (!label) {
    return { known, custom };
  }
  const slug = knownSlugForLabel(label);
  if (slug) {
    if (known.includes(slug)) {
      return { known, custom };
    }
    if (known.length + custom.length >= MAX_LISTING_CATEGORIES) {
      return { known, custom, error: "Choose at most 3 categories." };
    }
    return { known: [...known, slug], custom };
  }
  if (!isCustomCategoryLabel(label)) {
    return {
      known,
      custom,
      error:
        "Enter a category using letters, numbers, and spaces (2–40 characters).",
    };
  }
  if (custom.some((tag) => tag.toLowerCase() === label.toLowerCase())) {
    return { known, custom };
  }
  if (known.length + custom.length >= MAX_LISTING_CATEGORIES) {
    return { known, custom, error: "Choose at most 3 categories." };
  }
  return { known, custom: [...custom, label] };
}

function splitCategories(categories: string[]) {
  const known: ListingCategory[] = [];
  const custom: string[] = [];
  for (const category of categories) {
    if (isKnownCategory(category)) {
      known.push(category);
      continue;
    }
    custom.push(category);
  }
  return { known, custom };
}

function rowsFromListing(listing: SellerListing | undefined): PriceRow[] {
  if (!listing || listing.packages.length === 0) {
    return [];
  }
  return listing.packages.map((pkg) => ({
    key: crypto.randomUUID(),
    name: pkg.name,
    amount: centsToInput(pkg.amountCents),
    billingInterval: pkg.billingInterval,
  }));
}

type ListingFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  initial?: SellerListing;
  isPending: boolean;
  onSubmit: (input: SellerSaasInput) => Promise<void>;
};

export function ListingForm({
  title,
  description,
  submitLabel,
  pendingLabel,
  initial,
  isPending,
  onSubmit,
}: ListingFormProps) {
  const startingCategories = splitCategories(initial?.categories ?? []);
  const [name, setName] = useState(initial?.name ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.websiteUrl ?? "");
  const [iconUrl, setIconUrl] = useState(initial?.iconUrl ?? "");
  const [categories, setCategories] = useState<ListingCategory[]>(
    startingCategories.known,
  );
  const [otherSelected, setOtherSelected] = useState(
    startingCategories.custom.length > 0,
  );
  const [customTags, setCustomTags] = useState<string[]>(
    startingCategories.custom,
  );
  const [customDraft, setCustomDraft] = useState("");
  const [prices, setPrices] = useState<PriceRow[]>(() =>
    rowsFromListing(initial),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const slotsUsed = categories.length + customTags.length;

  function toggleCategory(slug: ListingCategory) {
    setCategories((current) => {
      if (current.includes(slug)) {
        if (current.length === 1) {
          setErrors((existing) => ({
            ...existing,
            customCategory: "Choose at least one category from the list.",
          }));
          return current;
        }
        return current.filter((item) => item !== slug);
      }
      if (current.length + customTags.length >= MAX_LISTING_CATEGORIES) {
        return current;
      }
      setErrors((existing) =>
        existing.customCategory ===
        "Choose at least one category from the list."
          ? { ...existing, customCategory: undefined }
          : existing,
      );
      return [...current, slug];
    });
  }

  function toggleOther() {
    if (otherSelected) {
      setOtherSelected(false);
      setCustomTags([]);
      setCustomDraft("");
      return;
    }
    if (categories.length >= MAX_LISTING_CATEGORIES) {
      return;
    }
    setOtherSelected(true);
  }

  function applyCustomText(value: string, keepRemainder: boolean) {
    const pieces = value.split(",");
    const remainder = keepRemainder ? (pieces.pop() ?? "") : "";
    let nextKnown = categories;
    let nextCustom = customTags;
    for (let index = 0; index < pieces.length; index++) {
      const piece = pieces[index] ?? "";
      const placed = placeCategory(piece, nextKnown, nextCustom);
      if (placed.error && cleanCategoryLabel(piece)) {
        setCategories(nextKnown);
        setCustomTags(nextCustom);
        setCustomDraft(
          [piece, ...pieces.slice(index + 1), remainder]
            .filter((part) => part.length > 0)
            .join(","),
        );
        setErrors((current) => ({
          ...current,
          customCategory: placed.error,
        }));
        return { known: nextKnown, custom: nextCustom, error: placed.error };
      }
      nextKnown = placed.known;
      nextCustom = placed.custom;
    }
    setCategories(nextKnown);
    setCustomTags(nextCustom);
    setCustomDraft(remainder);
    setErrors((current) => ({ ...current, customCategory: undefined }));
    return { known: nextKnown, custom: nextCustom };
  }

  function updatePrice(key: string, patch: Partial<PriceRow>) {
    setPrices((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
  }

  async function onFormSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedWebsite = websiteForStorage(websiteUrl);
    const trimmedIcon = iconUrl.trim();
    if (trimmedName.length < 2) {
      nextErrors.name = "Enter a product name.";
    }
    if (trimmedIcon && !isHttpUrl(trimmedIcon)) {
      nextErrors.iconUrl = "Enter a full image URL starting with https://.";
    }
    let submitKnown = categories;
    let submitCustom = customTags;
    if (otherSelected && cleanCategoryLabel(customDraft)) {
      const placed = placeCategory(customDraft, submitKnown, submitCustom);
      if (placed.error) {
        nextErrors.customCategory = placed.error;
      } else {
        submitKnown = placed.known;
        submitCustom = placed.custom;
      }
    }
    if (submitKnown.length === 0) {
      nextErrors.customCategory = "Choose at least one category from the list.";
    }

    const packages: SellerSaasInput["packages"] = [];
    for (const row of prices) {
      const packageName = row.name.trim();
      const amount = row.amount.trim();
      if (!packageName && !amount) {
        continue;
      }
      const amountCents = dollarsToCents(amount);
      if (!packageName || amountCents == null) {
        nextErrors.packages =
          "Each package needs a name and a price like 29 or 29.99. Use 0 for free.";
        break;
      }
      packages.push({
        name: packageName,
        amountCents,
        billingInterval: row.billingInterval,
      });
    }

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const nextCategories: string[] = [...submitKnown, ...submitCustom];

    try {
      await onSubmit({
        name: trimmedName,
        websiteUrl: trimmedWebsite,
        iconUrl: trimmedIcon,
        categories: nextCategories,
        packages,
      });
    } catch (error) {
      setFormError(await readApiError(error, "Could not save this product."));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <PageHeader title={title} description={description} />
      <div
        className={cn(
          SELLER_SCROLL_CONTENT,
          "mx-auto w-full max-w-2xl p-4 sm:p-6",
        )}
      >
        <Card>
          <CardHeader>
            <CardTitle>Product details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onFormSubmit}>
              <FieldGroup>
                <Field data-invalid={errors.name ? true : undefined}>
                  <FieldLabel htmlFor="saas-name">Name</FieldLabel>
                  <Input
                    id="saas-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Northstar"
                    aria-invalid={errors.name ? true : undefined}
                    autoComplete="off"
                  />
                  <FieldError>{errors.name}</FieldError>
                </Field>
                <Field>
                  <FieldLabel htmlFor="saas-website">Website</FieldLabel>
                  <Input
                    id="saas-website"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="example.com"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Optional. A domain is enough. An https:// prefix is removed
                    when you save.
                  </FieldDescription>
                  {isInsecureHttpWebsite(websiteUrl) ? (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      This address uses http://. It will be saved that way.
                    </p>
                  ) : null}
                </Field>
                <Field data-invalid={errors.iconUrl ? true : undefined}>
                  <FieldLabel htmlFor="saas-icon">Icon URL</FieldLabel>
                  <Input
                    id="saas-icon"
                    value={iconUrl}
                    onChange={(event) => setIconUrl(event.target.value)}
                    placeholder="https://example.com/icon.png"
                    aria-invalid={errors.iconUrl ? true : undefined}
                    autoComplete="off"
                  />
                  <FieldError>{errors.iconUrl}</FieldError>
                </Field>
                <Field data-invalid={errors.customCategory ? true : undefined}>
                  <FieldLabel>Categories</FieldLabel>
                  <FieldDescription>
                    Choose up to 3, including at least one from this list.
                  </FieldDescription>
                  <div className="flex flex-wrap gap-2">
                    {LISTING_CATEGORIES.map((category) => {
                      const selected = categories.includes(category.slug);
                      return (
                        <Button
                          key={category.slug}
                          type="button"
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          disabled={
                            !selected && slotsUsed >= MAX_LISTING_CATEGORIES
                          }
                          onClick={() => toggleCategory(category.slug)}
                        >
                          {category.label}
                        </Button>
                      );
                    })}
                    <Button
                      type="button"
                      size="sm"
                      variant={otherSelected ? "default" : "outline"}
                      disabled={
                        !otherSelected &&
                        categories.length >= MAX_LISTING_CATEGORIES
                      }
                      onClick={toggleOther}
                    >
                      Other
                    </Button>
                  </div>
                  {otherSelected ? (
                    <div
                      className={cn(
                        "flex min-h-7 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-input/20 px-1.5 py-1 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30 dark:bg-input/30",
                        errors.customCategory &&
                          "border-destructive ring-2 ring-destructive/20",
                      )}
                    >
                      {customTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex h-5 items-center gap-1 rounded-md bg-primary px-1.5 text-xs text-primary-foreground"
                        >
                          {tag}
                          <button
                            type="button"
                            className="rounded-sm text-primary-foreground/80 hover:text-primary-foreground"
                            aria-label={`Remove ${tag}`}
                            onClick={() =>
                              setCustomTags((current) =>
                                current.filter((item) => item !== tag),
                              )
                            }
                          >
                            <HugeiconsIcon
                              icon={Cancel01Icon}
                              className="size-3"
                            />
                          </button>
                        </span>
                      ))}
                      <input
                        value={customDraft}
                        onChange={(event) =>
                          applyCustomText(event.target.value, true)
                        }
                        onBlur={() => {
                          if (customDraft.trim()) {
                            applyCustomText(customDraft, false);
                          }
                        }}
                        onKeyDown={(event) => {
                          if (
                            event.key === "Backspace" &&
                            customDraft.length === 0 &&
                            customTags.length > 0
                          ) {
                            event.preventDefault();
                            setCustomTags((current) => current.slice(0, -1));
                          }
                          if (event.key === "Enter" && customDraft.trim()) {
                            event.preventDefault();
                            applyCustomText(customDraft, false);
                          }
                        }}
                        placeholder={
                          customTags.length === 0 ? "Your category" : ""
                        }
                        aria-label="Custom category"
                        aria-invalid={errors.customCategory ? true : undefined}
                        autoComplete="off"
                        className="h-5 min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground md:text-xs/relaxed"
                      />
                    </div>
                  ) : null}
                  <FieldError>{errors.customCategory}</FieldError>
                </Field>
                <Field data-invalid={errors.packages ? true : undefined}>
                  <FieldLabel>Pricing</FieldLabel>
                  <FieldDescription>
                    Add a package for each price, in USD. Leave this empty if
                    you are not listing prices yet.
                  </FieldDescription>
                  <div className="flex flex-col gap-2">
                    {prices.map((row, index) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_7.5rem_auto]"
                      >
                        <Input
                          value={row.name}
                          onChange={(event) =>
                            updatePrice(row.key, { name: event.target.value })
                          }
                          placeholder="Pro"
                          aria-label={`Package ${index + 1} name`}
                          autoComplete="off"
                        />
                        <Input
                          value={row.amount}
                          onChange={(event) =>
                            updatePrice(row.key, { amount: event.target.value })
                          }
                          placeholder="29"
                          inputMode="decimal"
                          aria-label={`Package ${index + 1} price in USD`}
                          autoComplete="off"
                        />
                        <select
                          className={selectClassName}
                          value={row.billingInterval}
                          aria-label={`Package ${index + 1} billing interval`}
                          onChange={(event) =>
                            updatePrice(row.key, {
                              billingInterval:
                                event.target.value === "yearly"
                                  ? "yearly"
                                  : "monthly",
                            })
                          }
                        >
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setPrices((current) =>
                              current.filter((item) => item.key !== row.key),
                            )
                          }
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={prices.length >= MAX_PRICES}
                        onClick={() =>
                          setPrices((current) => [...current, blankPriceRow()])
                        }
                      >
                        Add price
                      </Button>
                    </div>
                  </div>
                  <FieldError>{errors.packages}</FieldError>
                </Field>
                {formError ? <FieldError>{formError}</FieldError> : null}
                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? pendingLabel : submitLabel}
                  </Button>
                  <Link
                    to="/listings"
                    className={buttonVariants({
                      variant: "ghost",
                      size: "default",
                    })}
                  >
                    Cancel
                  </Link>
                </div>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
