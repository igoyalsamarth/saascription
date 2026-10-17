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
import { Link, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";

import { readApiError } from "@/lib/api-error";
import { LISTING_CATEGORIES, type ListingCategory } from "@/lib/listings";
import { SELLER_SCROLL_CONTENT } from "@/lib/page-layout";
import { useCreateSellerSaas } from "@/services/listings";

import { PageHeader } from "./page-header";

type FormErrors = {
  name?: string;
  websiteUrl?: string;
  iconUrl?: string;
};

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function AddSaasPage() {
  const createSaas = useCreateSellerSaas();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const [categories, setCategories] = useState<ListingCategory[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  function toggleCategory(slug: ListingCategory) {
    setCategories((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug);
      }
      if (current.length >= 3) {
        return current;
      }
      return [...current, slug];
    });
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    const trimmedName = name.trim();
    const trimmedWebsite = websiteUrl.trim();
    const trimmedIcon = iconUrl.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = "Enter a product name.";
    }
    if (trimmedWebsite && !isHttpUrl(trimmedWebsite)) {
      nextErrors.websiteUrl = "Enter a full URL starting with https://.";
    }
    if (trimmedIcon && !isHttpUrl(trimmedIcon)) {
      nextErrors.iconUrl = "Enter a full image URL starting with https://.";
    }

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    try {
      await createSaas.mutateAsync({
        name: trimmedName,
        websiteUrl: trimmedWebsite,
        iconUrl: trimmedIcon,
        categories,
      });
      void navigate({ to: "/listings" });
    } catch (error) {
      setFormError(await readApiError(error, "Could not save this product."));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-muted/30">
      <PageHeader
        title="Add SaaS"
        description="New products show up on your listings"
      />
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
            <form onSubmit={onSubmit}>
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
                <Field>
                  <FieldLabel>Categories</FieldLabel>
                  <FieldDescription>Choose up to 3.</FieldDescription>
                  <div className="flex flex-wrap gap-2">
                    {LISTING_CATEGORIES.map((category) => {
                      const selected = categories.includes(category.slug);
                      return (
                        <Button
                          key={category.slug}
                          type="button"
                          size="sm"
                          variant={selected ? "default" : "outline"}
                          disabled={!selected && categories.length >= 3}
                          onClick={() => toggleCategory(category.slug)}
                        >
                          {category.label}
                        </Button>
                      );
                    })}
                  </div>
                </Field>
                {formError ? <FieldError>{formError}</FieldError> : null}
                <div className="flex items-center gap-2 pt-2">
                  <Button type="submit" disabled={createSaas.isPending}>
                    {createSaas.isPending ? "Saving…" : "Add to listings"}
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
