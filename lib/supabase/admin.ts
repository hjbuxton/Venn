import { createClient } from "@supabase/supabase-js";

// Service-role client for privileged, server-only operations (e.g.
// auth.admin.*). The service role key bypasses RLS entirely — never import
// this from a client component, and never expose it to the browser.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
