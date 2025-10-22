"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Stale time: 5 phút
            staleTime: 5 * 60 * 1000,
            // Cache time: 10 phút
            gcTime: 10 * 60 * 1000,
            // Retry failed requests 1 lần
            retry: 1,
            // ✅ Refetch khi component mount (fix refresh issue)
            refetchOnMount: true,
            // Refetch on window focus (useful cho real-time feel)
            refetchOnWindowFocus: false,
          },
          mutations: {
            // Retry failed mutations 1 lần
            retry: 1,
          },
        },
      })
  );

  const currentUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentUserIdRef.current = session?.user?.id || null;
      isInitializedRef.current = true;
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;

      // ✅ Only clear cache after initialization AND if user actually changed
      if (
        isInitializedRef.current &&
        currentUserIdRef.current !== null &&
        currentUserIdRef.current !== newUserId
      ) {
        console.log("User changed, clearing React Query cache");
        queryClient.clear();
        currentUserIdRef.current = newUserId;
      }

      // If signed out, clear cache
      if (event === "SIGNED_OUT") {
        console.log("User signed out, clearing React Query cache");
        queryClient.clear();
        currentUserIdRef.current = null;
      }

      // ✅ Update ref without clearing on initial auth load
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN") {
        currentUserIdRef.current = newUserId;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
