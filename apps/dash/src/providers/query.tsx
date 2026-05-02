import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type ReactNode } from "react";


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: true,
    },
  },
});

export default function QueryProvider({ children }: { children: ReactNode }) {

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
