import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/demo",
  "/login",
  "/signup",
  "/forgot-password",
  "/family/login",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Emergency paramedic access — always public
  if (pathname.startsWith("/emergency/")) {
    return NextResponse.next();
  }

  // API routes — let them handle auth themselves
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { supabaseResponse, user } = await updateSession(request);

  // Public marketing and auth pages
  const isPublicPath = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Logged-in users hitting /login or /signup go to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
