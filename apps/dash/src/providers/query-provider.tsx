import { useAuth } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";

import { setApiTokenGetter } from "#/lib/api-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

export default function QueryProvider({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();

  // Sync during render so `api` ky hooks see a token getter before child effects run
  // (do not call React hooks from ky `beforeRequest`).
  setApiTokenGetter(() => getToken());

  useEffect(() => {
    return () => {
      setApiTokenGetter(null);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
