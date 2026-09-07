import { createClient } from "@/lib/supabase/server";
import { AuthCard } from "@/components/AuthCard";

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const supabase = await createClient();

  let success = false;

  if (token) {
    const { data } = await supabase.rpc("unsubscribe_by_token", { p_token: token });
    success = Boolean(data);
  }

  return (
    <AuthCard title={success ? "You're unsubscribed" : "Link not recognised"}>
      <p className="text-sm text-ink-2 text-center leading-relaxed">
        {success
          ? "You won't get any more nudge or activity emails from Venn. You can still see everything by checking the app directly."
          : "This unsubscribe link doesn't match an account. If you're still getting emails you don't want, use the link in the most recent one, or get in touch."}
      </p>
    </AuthCard>
  );
}
