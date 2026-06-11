import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { NewTripForm } from "./NewTripForm";

export default async function NewTripPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col flex-1">
      <AppHeader userName={profile?.name} />
      <main className="flex-1 mx-auto w-full max-w-xl px-6 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Start a trip</h1>
        <p className="mt-2 text-ink-3">
          Give your trip a name and a rough timeframe. You&apos;ll add your own
          preferences next, then invite your friends.
        </p>
        <div className="mt-8 rounded-2xl border border-line bg-white p-6 sm:p-8">
          <NewTripForm />
        </div>
      </main>
    </div>
  );
}
