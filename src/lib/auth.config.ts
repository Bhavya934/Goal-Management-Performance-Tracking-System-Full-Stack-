import type { NextAuthConfig } from "next-auth";

// Edge-compatible auth config (no Node.js-only imports like prisma or bcryptjs)
// This is used by the middleware which runs in Edge Runtime on Vercel
export const authConfig = {
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [], // Providers are added in the full auth.ts (not needed for middleware)
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      // Public routes
      const publicRoutes = ["/login", "/register"];
      const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
      const isApiAuth = nextUrl.pathname.startsWith("/api/auth");

      // Allow public routes and auth API
      if (isPublicRoute || isApiAuth) {
        return true;
      }

      // Redirect unauthenticated users
      if (!isLoggedIn) {
        return false; // NextAuth will redirect to signIn page
      }

      // Role-based route protection
      if (nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      if (
        nextUrl.pathname.startsWith("/manager") &&
        role !== "MANAGER" &&
        role !== "ADMIN"
      ) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
