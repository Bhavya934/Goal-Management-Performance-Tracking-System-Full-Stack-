import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple middleware that checks for the auth session cookie
// without importing next-auth (which pulls in jose/bcryptjs and crashes Edge Runtime on Vercel)
export default function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Check for NextAuth session token cookie
  const sessionToken =
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // Public routes
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

  // Allow public routes and auth API
  if (isPublicRoute || isApiAuth) {
    if (isLoggedIn && isPublicRoute) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
