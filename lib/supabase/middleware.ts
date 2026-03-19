import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_ROUTES = ["/login", "/signup"];
const PUBLIC_ROUTES = ["/", ...AUTH_ROUTES];
const DASHBOARD_ROUTES = ["/feed", "/watchlist", "/profile", "/settings"];

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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Redirect unauthenticated users to /login (unless on a public route)
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages to /feed
  if (user && AUTH_ROUTES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    return NextResponse.redirect(url);
  }

  // Onboarding gate: check completion status for dashboard routes and /onboarding
  if (user && (DASHBOARD_ROUTES.includes(pathname) || pathname === "/onboarding")) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("investment_goals")
      .eq("id", user.id)
      .single();

    const hasCompletedOnboarding =
      Array.isArray(profile?.investment_goals) &&
      profile.investment_goals.length > 0;

    // Incomplete onboarding → force to /onboarding
    if (!hasCompletedOnboarding && pathname !== "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // Already onboarded → skip /onboarding, go to feed
    if (hasCompletedOnboarding && pathname === "/onboarding") {
      const url = request.nextUrl.clone();
      url.pathname = "/feed";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
