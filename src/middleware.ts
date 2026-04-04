import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth") || pathname === "/api/health") {
    // Redirect authenticated users away from login page
    if (session && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // Protected routes — require auth
  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC: LP users can ONLY access LP portal
  if (session.user.role === "LP" && !pathname.startsWith("/lp-portal")) {
    return NextResponse.redirect(new URL("/lp-portal", req.url));
  }

  // Prevent non-LPs from accessing LP portal
  if (session.user.role !== "LP" && pathname.startsWith("/lp-portal")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
