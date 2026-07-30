import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Full prefix match — all sub-routes are also public
const PUBLIC_PATHS = [
  "/",
  "/features",
  "/pricing",
  "/demo",
  "/login",
  "/signup",
  "/forgot-password",
  "/change-password",
  "/onboarding",
  "/invite/complete",
  "/family/login",
  "/client/login",
  "/carer-login",
  "/about",
  "/custom-app",
  "/white-label",
  "/contact",
  "/faq",
  "/privacy",
  "/terms",
  "/solutions",
  "/cookies",
];

// Exact-match only — sub-routes are protected dashboard pages
const PUBLIC_EXACT_ONLY = ["/reports", "/gp-connect"];

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

  const { supabaseResponse, user, supabase } = await updateSession(request);

  const isPublicPath =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PUBLIC_EXACT_ONLY.some((p) => pathname === p);

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname.startsWith("/superadmin/")) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "superadmin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
