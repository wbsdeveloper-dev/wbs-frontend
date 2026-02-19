import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public and protected routes
const publicRoutes = ["/auth/login", "/landingpage"];
const protectedRoutes = ["/dashboard", "/konfigurasi", "/edit", "/whatsappbot"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("wbs_access_token")?.value;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Redirect to login if trying to access protected route without token
  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to landing page if trying to access login page with valid token
  if (isPublicRoute && accessToken && pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/landingpage", request.url));
  }

  return NextResponse.next();
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled by API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
  ],
};
