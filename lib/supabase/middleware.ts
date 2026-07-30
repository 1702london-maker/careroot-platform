import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Stale/invalid refresh token — clear the session and send to login
      if (
        error.message?.toLowerCase().includes("refresh token") ||
        error.message?.toLowerCase().includes("invalid token") ||
        error.code === "refresh_token_not_found"
      ) {
        await supabase.auth.signOut();
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.search = "";
        const redirect = NextResponse.redirect(loginUrl);
        // Clear Supabase auth cookies so the browser doesn't keep sending them
        supabaseResponse.cookies.getAll().forEach((c) => {
          if (c.name.startsWith("sb-")) redirect.cookies.delete(c.name);
        });
        return { supabaseResponse: redirect, user: null };
      }
    } else {
      user = data.user;
    }
  } catch {
    // Network or unexpected error — treat as unauthenticated, don't crash middleware
  }

  return { supabaseResponse, user, supabase };
}
