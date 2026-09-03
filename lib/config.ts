// When false (the default), new signups are auto-confirmed and signed in
// immediately after supabase.auth.signUp() — Supabase still sends the
// verification email via the existing Resend-backed flow, but nothing in
// the app blocks on the user actually clicking it. Set
// REQUIRE_EMAIL_VERIFICATION=true (server env only) to restore the
// blocking "check your inbox" behavior with no other code changes.
export const REQUIRE_EMAIL_VERIFICATION = process.env.REQUIRE_EMAIL_VERIFICATION === "true";
