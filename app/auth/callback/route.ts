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
      // Ensure user exists in database (handles Google OAuth user creation)
      try {
        await ensureUserExists(data.user.id);
      } catch (ensureError) {
        console.error("Error ensuring user exists:", ensureError);
        // Continue anyway - the user might still be able to use the app
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

      // Copy all cookies from cookieStore to response
      // This ensures the session cookies are properly set
      cookieStore.getAll().forEach((cookie) => {
        response.cookies.set(cookie.name, cookie.value, {
          path: "/",
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
      });

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
