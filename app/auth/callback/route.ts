import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureUserExists } from "@/lib/ensure-user";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const cookieStore = await cookies();

    // Create Supabase client with cookie handling
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // ✅ FIX: Ensure user exists in database BEFORE redirecting
      // This prevents "User not found" errors when clicking Premium upgrade
      // immediately after Google OAuth login
      console.log(`[OAuth Callback] Ensuring user ${data.user.id} exists in database...`);
      
      let userCreated = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!userCreated && retryCount < maxRetries) {
        try {
          await ensureUserExists(data.user.id);
          userCreated = true;
          console.log(`[OAuth Callback] ✅ User ${data.user.id} ensured in database`);
        } catch (ensureError) {
          retryCount++;
          console.error(`[OAuth Callback] Attempt ${retryCount}/${maxRetries} failed:`, ensureError);
          
          if (retryCount < maxRetries) {
            // Wait a bit before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
          } else {
            // If all retries fail, show error to user
            console.error("[OAuth Callback] ❌ Failed to create user after all retries");
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
          }
        }
      }

      // Redirect to the next URL or dashboard on success
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      // Create response with redirect
      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      } else {
        redirectUrl = `${origin}${next}`;
      }

      // Create redirect response
      const response = NextResponse.redirect(redirectUrl);

      // ✅ FIX: Don't manually copy cookies with httpOnly=true
      // Supabase SSR already handles cookies correctly with proper flags
      // Manual copying with httpOnly prevents client-side session detection
      
      // Add cache control headers to prevent stale cached redirects
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      );
      response.headers.set("Pragma", "no-cache");
      return response;
    }

    // If there's an error, log it and redirect to error page
    console.error("Error exchanging code for session:", error);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
