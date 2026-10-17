import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { readApiError } from "@/lib/api-error";
import { useClient } from "@/lib/client";
import type { ListingCategory } from "@/lib/listings";

export const sellerListingKeys = {
  all: ["seller-listings"] as const,
  list: () => [...sellerListingKeys.all, "list"] as const,
  detail: (id: string) => [...sellerListingKeys.all, "detail", id] as const,
};

export type SellerListing = {
  id: string;
  name: string;
  websiteUrl: string;
  iconUrl: string;
  categories: string[];
  createdAt: string;
  subscribers: number;
  monthlyRevenue: number;
};

type ApiSellerSaas = {
  id: string;
  name: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  categories: string[];
  createdAt: string;
  subscribers: number;
  monthlyRevenueCents: number;
};

export type CreateSellerSaasInput = {
  name: string;
  websiteUrl: string;
  iconUrl: string;
  categories: ListingCategory[];
};

function toListing(row: ApiSellerSaas): SellerListing {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.websiteUrl ?? "",
    iconUrl: row.iconUrl ?? "",
    categories: row.categories,
    createdAt: row.createdAt,
    subscribers: row.subscribers,
    monthlyRevenue: row.monthlyRevenueCents / 100,
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
    mutationFn: async (input: CreateSellerSaasInput) => {
      const res = await client
        .post("saas", { json: input })
        .json<{ saas: ApiSellerSaas }>();
      return toListing(res.saas);
    },
    onSuccess: (listing) => {
      queryClient.setQueryData(sellerListingKeys.detail(listing.id), listing);
      void queryClient.invalidateQueries({
        queryKey: sellerListingKeys.list(),
      });
    },
  });
}
