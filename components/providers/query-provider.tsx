"use client";

import React, { useState, useCallback } from "react";
import {
  QueryClientProvider,
  QueryCache,
  MutationCache,
  QueryClient,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ErrorModal } from "@/components/ui/ErrorModal";

interface QueryProviderProps {
  children: React.ReactNode;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Terjadi kesalahan yang tidak diketahui";
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [errorState, setErrorState] = useState<{
    open: boolean;
    message: string;
  }>({ open: false, message: "" });

  const showError = useCallback((error: unknown) => {
    setErrorState({ open: true, message: extractErrorMessage(error) });
  }, []);

  const closeError = useCallback(() => {
    setErrorState({ open: false, message: "" });
  }, []);

  // Build a QueryClient with global error handlers on caches.
  // We use React.useState to keep a stable singleton across renders.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => showError(error),
        }),
        mutationCache: new MutationCache({
          onError: (error) => showError(error),
        }),
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ErrorModal
        open={errorState.open}
        message={errorState.message}
        onClose={closeError}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
