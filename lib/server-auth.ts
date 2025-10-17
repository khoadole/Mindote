import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { cache } from "react";

/**
 * Create Supabase client for Server Components
 * Cached per request to reuse the same client instance
 */
export const createServerSupabaseClient = cache(async () => {
  // Check if environment variables exist
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Missing Supabase environment variables");
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
});

/**
 * Get authenticated user from Supabase
 * Cached per request - multiple calls return the same result
 * Returns userId or throws error if not authenticated
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
});

/**
 * Get userId from authenticated user (throws on error)
 * Cached per request - optimized for multiple calls
 * Use this in Server Actions where you want auth to be required
 *
 * ⚠️ PERFORMANCE OPTIMIZATION:
 * Extracts userId directly from JWT token to avoid 400ms network call to Supabase
 */
export const getUserId = cache(async (): Promise<string> => {
  try {
    console.log(`[getUserId] 🔍 Getting user ID via Supabase API`);
    const user = await getAuthenticatedUser();
    console.log(`[getUserId] ✅ Got user ID:`, user.id);
    return user.id;
  } catch (error) {
    console.error(`[getUserId] ❌ Error getting user ID:`, error);
    throw error;
  }
});

/**
 * Get userId or null if not authenticated
 * Use this when auth is optional
 */
export const getUserIdOrNull = cache(async (): Promise<string | null> => {
  try {
    return await getUserId();
  } catch {
    return null;
  }
});
