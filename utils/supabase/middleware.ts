import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth check for callback route - let it handle its own auth
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next({ request });
  }

  // Debug environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Only log in development and when there's an issue
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables in middleware");

    // If env vars missing, just pass through without auth
    const response = NextResponse.next({ request });
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return response;
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any) {
          // Set cookies in both request (for downstream) and response (for browser)
          cookiesToSet.forEach(({ name, value, options }: any) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    });

    // IMPORTANT: Use getUser() instead of getSession() for security
    // getUser() validates the JWT with Supabase server
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Log errors in development
    if (process.env.NODE_ENV === "development" && error) {
      console.log("[Middleware] Auth error:", error.message);
    }

    // Public routes that don't require authentication
    const publicRoutes = ["/", "/auth"];
    const isPublicRoute = publicRoutes.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    );

    // Redirect unauthenticated users to home page
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Redirect authenticated users away from auth pages to dashboard
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
    return NextResponse.next({ request });
  }
}
