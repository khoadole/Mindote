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

  useEffect(() => {
    const supabase = createClient();

    // Get initial user
    supabase.auth.getSession().then(({ data: { session } }) => {
      currentUserIdRef.current = session?.user?.id || null;
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUserId = session?.user?.id || null;

      // If user changed (login/logout/switch account), clear all queries
      if (currentUserIdRef.current !== newUserId) {
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
