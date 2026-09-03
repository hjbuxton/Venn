import { NextResponse } from "next/server";
import { REQUIRE_EMAIL_VERIFICATION } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";

// Called right after signup, before a session exists, so this can't be
// gated behind auth — the REQUIRE_EMAIL_VERIFICATION check is what keeps
// this safe: with verification on, it refuses outright regardless of the
// userId passed in.
export async function POST(request: Request) {
  if (REQUIRE_EMAIL_VERIFICATION) {
    return NextResponse.json({ error: "Email verification is required." }, { status: 403 });
  }

  const { userId } = await request.json();

  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "Missing userId." }, { status: 400 });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Auto-confirm error:", err);
    // Temporary diagnostic (booleans/lengths only, never the secret itself)
    // to debug why this is failing in production — remove once resolved.
    return NextResponse.json(
      {
        error: "Could not auto-confirm.",
        debug: {
          message: err instanceof Error ? err.message : String(err),
          hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
          serviceRoleKeyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length ?? 0,
          hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
        },
      },
      { status: 500 }
    );
  }
}
