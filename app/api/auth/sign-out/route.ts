import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "global" });

  const response = NextResponse.json({ ok: true });

  // Explicitly clear all Supabase auth cookies server-side
  const cookieNames = ["sb-access-token", "sb-refresh-token"];
  for (const name of cookieNames) {
    response.cookies.set(name, "", { maxAge: 0, path: "/" });
  }

  // Also clear the project-specific sb-* cookies (Supabase SSR uses
  // a cookie name derived from the project URL)
  response.headers.append(
    "Set-Cookie",
    "sb-udmkjeovknidmrmlyvfs-auth-token=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"
  );
  response.headers.append(
    "Set-Cookie",
    "sb-udmkjeovknidmrmlyvfs-auth-token.0=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"
  );
  response.headers.append(
    "Set-Cookie",
    "sb-udmkjeovknidmrmlyvfs-auth-token.1=; Max-Age=0; Path=/; HttpOnly; SameSite=Lax"
  );

  return response;
}
