import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Check if environment variables exist
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.error("Missing Supabase environment variables");
    return NextResponse.next({
      request,
    });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            // Only set cookies in response
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Get user và handle error
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // ✅ Reduced logging - only log on errors or first request
    if (process.env.NODE_ENV === "development" && error) {
      console.log("Auth error:", error.message);
    }

    const { pathname } = request.nextUrl;

    // Public routes
    const publicRoutes = ["/", "/auth"];
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Redirect if not logged in and not a public route
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      // Redirect back to the intended page after login
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Redirect if logged in and trying to access auth or home page
    if (user && (pathname.startsWith("/auth") || pathname === "/")) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // Security headers
    supabaseResponse.headers.set("X-Frame-Options", "DENY");
    supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
    supabaseResponse.headers.set(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );

    return supabaseResponse;
  } catch (error) {
    console.error("Middleware error:", error);
    // Return a basic response if middleware fails
    return NextResponse.next({
      request,
    });
  }
}
