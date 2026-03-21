import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/signup"];
const PROTECTED_ROUTES = ["/feed", "/watchlist", "/profile", "/settings", "/onboarding"];

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ── Landing page: pass through immediately, no Supabase interaction ──
  // This guarantees no session cookies are created/refreshed for visitors
  // who haven't logged in (including incognito windows).
  if (pathname === "/") {
    return NextResponse.next({ request });
  }

  // ── From here on, every route needs a session check ──
  // Build the response and Supabase client together so setAll can write
  // refreshed tokens into the response cookies.
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

  // Validate the session by calling getUser() — this hits the Supabase
  // auth server and won't trust a stale JWT on its own.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── No valid user ─────────────────────────────────────────────────────
  // IMPORTANT: Never return `supabaseResponse` here — it may contain
  // sb-* Set-Cookie headers injected by the setAll callback during
  // getUser(). Returning those would re-create a ghost session.
  if (!user) {
    if (AUTH_ROUTES.includes(pathname)) {
      // Create a clean response — no Supabase cookies leak through
      const cleanResponse = NextResponse.next({ request });
      deleteAuthCookies(request, cleanResponse);
      return cleanResponse;
    }

    // Every other route without a valid user → redirect to /login
    // and clear any stale sb-* cookies.
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    deleteAuthCookies(request, redirectResponse);
    return redirectResponse;
  }

  // ── Valid user ─────────────────────────────────────────────────────────

  // Authenticated users on auth pages → redirect to /feed
  if (AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  // Onboarding gate: only runs for protected routes and /onboarding
  if (PROTECTED_ROUTES.includes(pathname)) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("investment_goals")
      .eq("id", user.id)
      .single();

    const hasCompletedOnboarding =
      Array.isArray(profile?.investment_goals) &&
      profile.investment_goals.length > 0;

    if (!hasCompletedOnboarding && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    if (hasCompletedOnboarding && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/feed";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

// ── Helper ────────────────────────────────────────────────────────────────

function deleteAuthCookies(request: NextRequest, response: NextResponse) {
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      // Set explicit path=/ to ensure the delete matches the original cookie
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        path: "/",
      });
    }
  }
}
