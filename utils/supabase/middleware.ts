import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Chỉ set cookies vào response
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

  // Log chỉ trong development
  if (process.env.NODE_ENV === "development") {
    console.log("Auth check:", { userId: user?.id, error: error?.message });
  }

  const { pathname } = request.nextUrl;

  // Public routes
  const publicRoutes = ["/", "/auth"];
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect nếu chưa đăng nhập và không phải public route
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    // Có thể lưu redirect URL để quay lại sau khi login
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect nếu đã đăng nhập và đang ở auth/home
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
}
