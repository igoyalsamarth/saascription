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
  websiteUrl?: string;
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

function splitCategories(categories: string[]) {
  const known: ListingCategory[] = [];
  let custom = "";
  for (const category of categories) {
    if (isKnownCategory(category)) {
      known.push(category);
      continue;
    }
    if (!custom) {
      custom = category;
    }
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
  const [customCategory, setCustomCategory] = useState(
    startingCategories.custom,
  );
  const [prices, setPrices] = useState<PriceRow[]>(() =>
    rowsFromListing(initial),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const categoryLimit = otherSelected ? 2 : 3;

  function toggleCategory(slug: ListingCategory) {
    setCategories((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }
      if (current.length >= categoryLimit) {
        return current;
      }
      return [...current, slug];
    });
  }

  function toggleOther() {
    if (otherSelected) {
      setOtherSelected(false);
      setCustomCategory("");
      return;
    }
    if (categories.length >= 3) {
      return;
    }
    setOtherSelected(true);
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
    const trimmedWebsite = websiteUrl.trim();
    const trimmedIcon = iconUrl.trim();
    const trimmedCustom = customCategory.trim().replace(/\s+/g, " ");

    if (trimmedName.length < 2) {
      nextErrors.name = "Enter a product name.";
    }
    if (trimmedWebsite && !isHttpUrl(trimmedWebsite)) {
      nextErrors.websiteUrl = "Enter a full URL starting with https://.";
    }
    if (trimmedIcon && !isHttpUrl(trimmedIcon)) {
      nextErrors.iconUrl = "Enter a full image URL starting with https://.";
    }
    if (otherSelected && trimmedCustom.length < 2) {
      nextErrors.customCategory = "Enter your category.";
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

    const nextCategories: string[] = [...categories];
    if (otherSelected && trimmedCustom) {
      nextCategories.push(trimmedCustom);
    }

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
                <Field data-invalid={errors.websiteUrl ? true : undefined}>
                  <FieldLabel htmlFor="saas-website">Website</FieldLabel>
                  <Input
                    id="saas-website"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="https://example.com"
                    aria-invalid={errors.websiteUrl ? true : undefined}
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Optional. Used when this product appears in the catalog.
                  </FieldDescription>
                  <FieldError>{errors.websiteUrl}</FieldError>
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
                    Choose up to 3. Use Other if yours is not listed.
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
                            !selected && categories.length >= categoryLimit
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
                      disabled={!otherSelected && categories.length >= 3}
                      onClick={toggleOther}
                    >
                      Other
                    </Button>
                  </div>
                  {otherSelected ? (
                    <Input
                      value={customCategory}
                      onChange={(event) =>
                        setCustomCategory(event.target.value)
                      }
                      placeholder="Your category"
                      aria-label="Custom category"
                      aria-invalid={errors.customCategory ? true : undefined}
                      autoComplete="off"
                      maxLength={40}
                    />
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
