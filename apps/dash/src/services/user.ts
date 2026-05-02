import { useQuery } from "@tanstack/react-query";

import { useClient } from "#/lib/client";

export const userKeys = {
  all: ["user"] as const,
  me: () => [...userKeys.all, "me"] as const,
};

export type UserMe = {
  id: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
};

export type UserMeResponse = {
  user: UserMe;
};

export function useUserMe() {
  const client = useClient();
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: () => client.get("users/me").json<UserMeResponse>(),
    select: (data) => data.user,
  });
}
