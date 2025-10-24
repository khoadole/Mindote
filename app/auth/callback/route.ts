import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/ensure-user";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
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

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }

    // If there's an error, log it and redirect to error page
    console.error("Error exchanging code for session:", error);
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=callback_failed`);
}
