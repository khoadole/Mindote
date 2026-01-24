/**
 * ⚡ PERFORMANCE: Client-side Auth Guard Hook
 *
 * Replaces blocking middleware auth check with fast client-side validation.
 * Uses React Query for caching and automatic background revalidation.
 *
 * Benefits:
 * - 🚀 No middleware blocking → Instant page navigation
 * - 💾 5-minute cache → Reduces repeated auth API calls
 * - 🔄 Background refresh → Keeps auth state fresh
 * - ⚡ Optimistic redirects → Better perceived performance
 */

"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthGuardOptions {
  /** If true, redirects unauthenticated users to home */
  requireAuth?: boolean;
  /** If true, redirects authenticated users to dashboard */
  redirectIfAuthenticated?: boolean;
  /** Custom redirect path for unauthenticated users */
  redirectTo?: string;
}

/**
 * Auth guard hook that validates user session without blocking middleware
 *
 * @param options - Configuration for auth behavior
 * @returns Object containing user, loading state, and helper functions
 *
 * @example
 * // In a protected dashboard page:
 * const { user, isLoading } = useAuthGuard({ requireAuth: true });
 *
 * @example
 * // In a landing/auth page:
 * useAuthGuard({ redirectIfAuthenticated: true });
 */
export function useAuthGuard(options: AuthGuardOptions = {}) {
  const {
    requireAuth = false,
    redirectIfAuthenticated = false,
    redirectTo,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const hasRedirected = useRef(false);

  // ✅ React Query caches this for 5 minutes, reducing API calls
  const {
    data: user,
    isLoading,
    error,
  } = useQuery<User | null>({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) {
        console.error("[Auth Guard] Error:", error.message);
        return null;
      }

      return user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - Cache aggressively for performance
    gcTime: 10 * 60 * 1000, // 10 minutes - Keep in memory longer
    retry: 1, // Only retry once to fail fast
    refetchOnWindowFocus: true, // Revalidate when user comes back
    refetchOnReconnect: true, // Revalidate on network reconnect
  });

  // ✅ Handle redirects based on auth state
  useEffect(() => {
    // Skip if still loading or already redirected
    if (isLoading || hasRedirected.current) return;

    // Redirect unauthenticated users
    if (requireAuth && !user) {
      hasRedirected.current = true;
      const redirectPath =
        redirectTo || `/?redirectTo=${encodeURIComponent(pathname)}`;
      router.replace(redirectPath);
      return;
    }

    // Redirect authenticated users away from auth pages
    if (redirectIfAuthenticated && user) {
      hasRedirected.current = true;
      router.replace("/dashboard");
      return;
    }
  }, [
    user,
    isLoading,
    requireAuth,
    redirectIfAuthenticated,
    pathname,
    router,
    redirectTo,
  ]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}

/**
 * Simplified hook for dashboard pages that require authentication
 * Automatically redirects if not authenticated
 *
 * @example
 * const { user, isLoading } = useRequireAuth();
 */
export function useRequireAuth() {
  return useAuthGuard({ requireAuth: true });
}

/**
 * Hook for landing/auth pages that should redirect authenticated users
 *
 * @example
 * useRedirectIfAuthenticated();
 */
export function useRedirectIfAuthenticated() {
  return useAuthGuard({ redirectIfAuthenticated: true });
}
