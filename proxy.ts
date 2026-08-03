import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

function createNonce() {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

function createCsp(nonce: string) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `script-src-elem 'self' 'nonce-${nonce}' https://js.stripe.com`,
    `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    `style-src-elem 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://api.openai.com https://api.stripe.com",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "manifest-src 'self'",
    "worker-src 'self' blob:",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applyCsp(response: NextResponse, csp: string) {
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

const ALLOWED_REDIRECT_HOSTS = new Set([
  "careroot.co.uk",
  "www.careroot.co.uk",
  "careroot.care",
  "localhost",
  "127.0.0.1",
]);

function getSafeOrigin(request: NextRequest) {
  const host = request.nextUrl.hostname.toLowerCase();
  if (ALLOWED_REDIRECT_HOSTS.has(host)) {
    return request.nextUrl.origin;
  }
  return "https://www.careroot.co.uk";
}

function safeRedirect(request: NextRequest, pathname: string, csp: string, params?: Record<string, string>) {
  const target = new URL(pathname, getSafeOrigin(request));
  for (const [key, value] of Object.entries(params ?? {})) {
    target.searchParams.set(key, value);
  }
  return applyCsp(NextResponse.redirect(target), csp);
}

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

const PUBLIC_EXACT_ONLY = ["/reports", "/gp-connect"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = createNonce();
  const csp = createCsp(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  if (pathname.startsWith("/emergency/")) {
    return applyCsp(NextResponse.next({ request: { headers: requestHeaders } }), csp);
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request, requestHeaders);

  const isPublicPath =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    PUBLIC_EXACT_ONLY.some((p) => pathname === p);

  if (!user && !isPublicPath) {
    return safeRedirect(request, "/login", csp, { redirectTo: pathname });
  }

  if (
    user &&
    (pathname.startsWith("/superadmin/") ||
      pathname.startsWith("/carer") ||
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/clients") ||
      pathname.startsWith("/staff") ||
      pathname.startsWith("/reports") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/rota") ||
      pathname.startsWith("/billing") ||
      pathname.startsWith("/compliance") ||
      pathname.startsWith("/complaints") ||
      pathname.startsWith("/nutrition") ||
      pathname.startsWith("/visits") ||
      pathname.startsWith("/family/dashboard") ||
      pathname.startsWith("/family/client"))
  ) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role as string | undefined;

    if (pathname.startsWith("/superadmin/") && role !== "superadmin") {
      return safeRedirect(request, "/dashboard", csp);
    }

    if (pathname.startsWith("/carer") && !["carer", "senior_carer"].includes(role ?? "")) {
      return safeRedirect(request, "/dashboard", csp);
    }

    const dashboardRoots = [
      "/dashboard",
      "/clients",
      "/staff",
      "/reports",
      "/settings",
      "/rota",
      "/billing",
      "/compliance",
      "/complaints",
      "/nutrition",
      "/visits",
    ];

    if (
      dashboardRoots.some((p) => pathname.startsWith(p)) &&
      ["carer", "senior_carer"].includes(role ?? "")
    ) {
      return safeRedirect(request, "/carer", csp);
    }

    if (
      (pathname.startsWith("/family/dashboard") || pathname.startsWith("/family/client")) &&
      !["family_member", "org_admin", "superadmin"].includes(role ?? "")
    ) {
      return safeRedirect(request, "/dashboard", csp);
    }
  }

  return applyCsp(supabaseResponse, csp);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
