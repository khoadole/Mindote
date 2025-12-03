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
  const cookieStore = await cookies();

  // Fast path: Extract user ID from access token (0ms vs 400ms!)
  const allCookies = cookieStore.getAll();

  // Debug: Log all cookie names to find the correct one
  console.log(
    `[getUserId] 🔍 All cookies:`,
    allCookies.map((c) => c.name)
  );

  // ✅ FIX: Supabase splits large JWT tokens into chunks (.0, .1, .2, etc)
  // We need to find and combine them
  const baseCookieName = allCookies.find(
    (c) => c.name.match(/sb-.+-auth-token\.\d+$/)
  )?.name.replace(/\.\d+$/, '');

  if (baseCookieName) {
    console.log(`[getUserId] 🔍 Found chunked token base: ${baseCookieName}`);
    
    // Collect all chunks in order (.0, .1, .2, ...)
    const chunks: string[] = [];
    let chunkIndex = 0;
    
    while (true) {
      const chunkCookie = allCookies.find(c => c.name === `${baseCookieName}.${chunkIndex}`);
      if (!chunkCookie) break;
      chunks.push(chunkCookie.value);
      chunkIndex++;
    }
    
    if (chunks.length > 0) {
      const fullToken = chunks.join('');
      console.log(`[getUserId] ✅ Combined ${chunks.length} chunks into full token`);
      console.log(`[getUserId] 🔍 Token length: ${fullToken.length}, first 50 chars: ${fullToken.substring(0, 50)}...`);
      
      try {
        // ✅ FIX: Supabase stores base64-encoded session object, not raw JWT
        // Format: "base64-<base64_encoded_session_json>"
        let tokenToParse = fullToken;
        
        if (fullToken.startsWith('base64-')) {
          console.log(`[getUserId] 🔍 Detected base64-encoded session, decoding...`);
          const base64Data = fullToken.substring(7); // Remove 'base64-' prefix
          const sessionJson = atob(base64Data);
          const sessionObject = JSON.parse(sessionJson);
          
          console.log(`[getUserId] 🔍 Session object keys:`, Object.keys(sessionObject));
          
          // Extract access_token from session object
          if (sessionObject.access_token) {
            tokenToParse = sessionObject.access_token;
            console.log(`[getUserId] ✅ Extracted access_token from session`);
          } else {
            console.log(`[getUserId] ⚠️ No access_token in session object`);
          }
        }
        
        // Now parse the actual JWT
        const parts = tokenToParse.split(".");
        console.log(`[getUserId] 🔍 JWT parts count: ${parts.length}`);
        
        if (parts.length === 3) {
          console.log(`[getUserId] 🔍 Attempting to decode payload (part[1] length: ${parts[1].length})`);
          const payload = JSON.parse(atob(parts[1]));
          console.log(`[getUserId] 🔍 Payload decoded:`, { sub: payload.sub, exp: payload.exp, currentTime: Date.now() / 1000 });
          
          // Verify token not expired and has sub (user ID)
          if (payload.sub && payload.exp && payload.exp > Date.now() / 1000) {
            console.log(`[getUserId] ✅ Fast path: extracted user ID from JWT token`);
            return payload.sub;
          } else {
            console.log(`[getUserId] ⚠️ Token expired or missing sub:`, { 
              hasSub: !!payload.sub, 
              hasExp: !!payload.exp,
              isExpired: payload.exp ? payload.exp <= Date.now() / 1000 : 'no exp'
            });
          }
        } else {
          console.log(`[getUserId] ⚠️ Invalid JWT format - expected 3 parts, got ${parts.length}`);
        }
      } catch (e) {
        console.log(`[getUserId] ❌ JWT parse failed:`, e instanceof Error ? e.message : e);
        console.log(`[getUserId] 🔍 Error details:`, e);
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

    console.log(`[getUserId] 🔍 Found auth cookie:`, authCookie?.name);

    if (authCookie?.value) {
      try {
        const parts = authCookie.value.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.sub && payload.exp && payload.exp > Date.now() / 1000) {
            console.log(`[getUserId] ✅ Fast path: extracted from JWT token`);
            return payload.sub;
          } else {
            console.log(`[getUserId] ⚠️ Token expired or missing sub`);
          }
        }
      } catch (e) {
        console.log(`[getUserId] ⚠️ JWT parse failed:`, e);
      }
    }
  }

  console.log(`[getUserId] ⚠️ No valid auth token found, falling back to slow path`);

  // Slow path fallback: Call Supabase API (~400ms network call)
  const startTime = Date.now();
  const user = await getAuthenticatedUser();
  console.log(
    `[getUserId] ⚠️ Slow path: getUser() took ${Date.now() - startTime}ms`
  );
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
