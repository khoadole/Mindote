import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { cache } from "react";

function getUserIdFromAuthCookieValue(cookieValue: string): string | null {
  let tokenToParse = cookieValue;

  if (cookieValue.startsWith("base64-")) {
    const base64Data = cookieValue.substring(7);
    const sessionJson = atob(base64Data);
    const sessionObject = JSON.parse(sessionJson);

    if (sessionObject.access_token) {
      tokenToParse = sessionObject.access_token;
    }
  }

  const parts = tokenToParse.split(".");

  if (parts.length !== 3) {
    return null;
  }

  const payload = JSON.parse(atob(parts[1]));

  if (payload.sub && payload.exp && payload.exp > Date.now() / 1000) {
    return payload.sub;
  }

  return null;
}

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
  const cookieStore = await cookies();
  const isDev = process.env.NODE_ENV === "development";

  // Fast path: Extract user ID from access token (0ms vs 400ms!)
  const allCookies = cookieStore.getAll();

  // ✅ FIX: Supabase splits large JWT tokens into chunks (.0, .1, .2, etc)
  // We need to find and combine them
  let foundAuthCookie = false;
  const baseCookieName = allCookies
    .find((c) => c.name.match(/sb-.+-auth-token\.\d+$/))
    ?.name.replace(/\.\d+$/, "");

  if (baseCookieName) {
    // Collect all chunks in order (.0, .1, .2, ...)
    const chunks: string[] = [];
    let chunkIndex = 0;

    while (true) {
      const chunkCookie = allCookies.find(
        (c) => c.name === `${baseCookieName}.${chunkIndex}`
      );
      if (!chunkCookie) break;
      chunks.push(chunkCookie.value);
      chunkIndex++;
    }

    if (chunks.length > 0) {
      foundAuthCookie = true;
      const fullToken = chunks.join("");

      try {
        const parsedUserId = getUserIdFromAuthCookieValue(fullToken);

        if (parsedUserId) {
          return parsedUserId;
        }
      } catch (e) {
        // Only log errors in development
        if (isDev) {
          console.log(
            `[getUserId] JWT parse failed:`,
            e instanceof Error ? e.message : e
          );
        }
      }
    }
  } else {
    // Fallback: try to find single (non-chunked) auth cookie
    const authCookie = allCookies.find(
      (c) =>
        // Pattern 1: Supabase standard pattern (non-chunked)
        (c.name.startsWith("sb-") && c.name.endsWith("-auth-token")) ||
        // Pattern 2: Legacy/alternative patterns (fallback)
        c.name.includes("access-token") ||
        c.name.includes("supabase-auth-token")
    );

    if (authCookie?.value) {
      foundAuthCookie = true;
      try {
        const parsedUserId = getUserIdFromAuthCookieValue(authCookie.value);

        if (parsedUserId) {
          return parsedUserId;
        }
      } catch (e) {
        // Silently fail and fall through to slow path
      }
    }
  }

  if (!foundAuthCookie) {
    if (isDev) {
      console.log(`[getUserId] No Supabase auth cookie found`);
    }
    throw new Error("Unauthorized");
  }

  // Slow path fallback: Call Supabase API (~400ms network call)
  if (isDev) {
    console.log(`[getUserId] ⚠️ Falling back to slow path (Supabase API call)`);
  }
  const startTime = Date.now();
  const user = await getAuthenticatedUser();
  if (isDev) {
    console.log(`[getUserId] Slow path took ${Date.now() - startTime}ms`);
  }
  return user.id;
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
