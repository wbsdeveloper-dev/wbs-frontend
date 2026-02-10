import {
  QueryClient,
  defaultShouldDehydrateQuery,
  isServer,
} from "@tanstack/react-query";

/**
 * Creates a QueryClient with production-ready defaults.
 *
 * Key design decisions:
 * - staleTime: 60s — prevents re-fetching on the client immediately after
 *   server-side prefetch. Without this, useQuery would refetch as soon as
 *   the component mounts because the data is "stale" by default (staleTime: 0).
 * - gcTime: 5 minutes — how long inactive query data stays in cache.
 * - retry: 1 — limits retries to avoid delays; adjust per use case.
 * - refetchOnWindowFocus: false — avoids surprise refetches during dev/prod.
 *
 * For server components, we create a new QueryClient per request to avoid
 * sharing state between users. For client components, we reuse a singleton.
 */
function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 60 seconds.
        // This prevents the client from immediately re-fetching
        // data that was just prefetched on the server.
        staleTime: 60 * 1000,

        // Cached data is garbage-collected after 5 minutes of inactivity.
        gcTime: 5 * 60 * 1000,

        // Retry failed requests once before showing an error.
        retry: 1,

        // Disable automatic refetch on window focus for predictable behavior.
        refetchOnWindowFocus: false,
      },
      dehydrate: {
        // Include pending queries in dehydration so that the client can
        // pick up server-side prefetches that haven't resolved yet.
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}

// Singleton for client-side (browser) usage.
// On the server, we always create a new client to avoid cross-request leaks.
let browserQueryClient: QueryClient | undefined = undefined;

/**
 * Returns a QueryClient instance.
 * - Server: creates a new client per request (no shared state between users).
 * - Client: reuses a singleton to preserve cache across navigations.
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    // Server: always create a new QueryClient
    return makeQueryClient();
  }

  // Browser: reuse the singleton
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}
