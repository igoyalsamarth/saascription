import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { readApiError } from "@/lib/api-error";
import { useClient } from "@/lib/client";
import type {
  BillingInterval,
  ListingPackage,
  ListingStatus,
} from "@/lib/listings";

export const sellerListingKeys = {
  all: ["seller-listings"] as const,
  list: () => [...sellerListingKeys.all, "list"] as const,
  detail: (id: string) => [...sellerListingKeys.all, "detail", id] as const,
  review: () => [...sellerListingKeys.all, "review"] as const,
};

export type SellerListing = {
  id: string;
  name: string;
  websiteUrl: string;
  iconUrl: string;
  categories: string[];
  status: ListingStatus;
  packages: ListingPackage[];
  createdAt: string;
  subscribers: number;
  monthlyRevenue: number;
  creatorId: string | null;
  creatorEmail: string | null;
};

type ApiSellerPackage = {
  name: string;
  amountCents: number;
  currency: string;
  billingInterval: BillingInterval;
};

type ApiSellerSaas = {
  id: string;
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string[];
  status?: ListingStatus;
  packages?: ApiSellerPackage[];
  createdAt: string;
  subscribers: number;
  monthlyRevenueCents: number;
  creatorId?: string | null;
  creatorEmail?: string | null;
};

export type SellerSaasInput = {
  name: string;
  websiteUrl: string;
  iconUrl: string;
  categories: string[];
  packages: Array<{
    name: string;
    amountCents: number;
    billingInterval: BillingInterval;
  }>;
};

function toListing(row: ApiSellerSaas): SellerListing {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.websiteUrl ?? "",
    iconUrl: row.iconUrl ?? "",
    categories: row.categories ?? [],
    status: row.status === "published" ? "published" : "review",
    packages: (row.packages ?? []).map((pkg) => ({
      name: pkg.name,
      amountCents: pkg.amountCents,
      currency: pkg.currency || "USD",
      billingInterval: pkg.billingInterval === "yearly" ? "yearly" : "monthly",
    })),
    createdAt: row.createdAt,
    subscribers: row.subscribers,
    monthlyRevenue: row.monthlyRevenueCents / 100,
    creatorId: row.creatorId ?? null,
    creatorEmail: row.creatorEmail ?? null,
  };
}

export function useSellerListings() {
  const client = useClient();
  return useQuery({
    queryKey: sellerListingKeys.list(),
    queryFn: async () => {
      try {
        const res = await client
          .get("saas/mine")
          .json<{ saas: ApiSellerSaas[] }>();
        return res.saas.map(toListing);
      } catch (error) {
        throw new Error(
          await readApiError(error, "Could not load your listings."),
        );
      }
    },
  });
}

export function useSellerListing(id: string) {
  const client = useClient();
  return useQuery({
    queryKey: sellerListingKeys.detail(id),
    enabled: id.length > 0,
    queryFn: async () => {
      try {
        const res = await client
          .get(`saas/mine/${id}`)
          .json<{ saas: ApiSellerSaas }>();
        return toListing(res.saas);
      } catch (error) {
        throw new Error(
          await readApiError(error, "Could not load this product."),
        );
      }
    },
  });
}

export function useCreateSellerSaas() {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SellerSaasInput) => {
      const res = await client
        .post("saas", { json: input })
        .json<{ saas: ApiSellerSaas }>();
      return toListing(res.saas);
    },
    onSuccess: (listing) => {
      queryClient.setQueryData(sellerListingKeys.detail(listing.id), listing);
      void queryClient.invalidateQueries({ queryKey: sellerListingKeys.all });
    },
  });
}

export function useUpdateSellerSaas() {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SellerSaasInput & { id: string }) => {
      const { id, ...body } = input;
      const res = await client
        .patch(`saas/mine/${id}`, { json: body })
        .json<{ saas: ApiSellerSaas }>();
      return toListing(res.saas);
    },
    onSuccess: (listing) => {
      queryClient.setQueryData(sellerListingKeys.detail(listing.id), listing);
      void queryClient.invalidateQueries({ queryKey: sellerListingKeys.all });
    },
  });
}

export function useDeleteSellerSaas() {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await client.delete(`saas/mine/${id}`);
      } catch (error) {
        throw new Error(
          await readApiError(error, "Could not delete this listing."),
        );
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: sellerListingKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: sellerListingKeys.all });
    },
  });
}

export function useReviewListings(enabled: boolean) {
  const client = useClient();
  return useQuery({
    queryKey: sellerListingKeys.review(),
    enabled,
    queryFn: async () => {
      try {
        const res = await client
          .get("saas/review")
          .json<{ saas: ApiSellerSaas[] }>();
        return res.saas.map(toListing);
      } catch (error) {
        throw new Error(
          await readApiError(error, "Could not load listings in review."),
        );
      }
    },
  });
}

export function usePublishSellerSaas() {
  const client = useClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        const res = await client
          .post(`saas/review/${id}/publish`)
          .json<{ saas: ApiSellerSaas }>();
        return toListing(res.saas);
      } catch (error) {
        throw new Error(
          await readApiError(error, "Could not publish this listing."),
        );
      }
    },
    onSuccess: (listing) => {
      queryClient.setQueryData(sellerListingKeys.detail(listing.id), listing);
      void queryClient.invalidateQueries({ queryKey: sellerListingKeys.all });
    },
  });
}
