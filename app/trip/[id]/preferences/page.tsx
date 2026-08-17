import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { PreferenceForm } from "@/components/PreferenceForm";
import type { Preferences, Trip } from "@/types/database";

export default async function EditPreferencesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect(`/login?redirect=${encodeURIComponent(`/trip/${id}/preferences`)}`);
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single<Trip>();

  if (!trip) {
    notFound();
  }

  const { data: membership } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", id)
    .eq("user_id", authUser.id)
    .maybeSingle();

  if (!membership) {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", authUser.id)
    .single();

  const { data: preferences } = await supabase
    .from("preferences")
    .select("*")
    .eq("trip_id", id)
    .eq("user_id", authUser.id)
    .maybeSingle<Preferences>();

  return (
    <div className="flex flex-col flex-1">
      <AppHeader userName={profile?.name} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">
            Edit your preferences
          </h1>
          <p className="mt-2 text-ink-3">
            Your answers are completely private. Nobody in your group will see what
            you enter here.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <PreferenceForm
            tripId={trip.id}
            travelWindow={trip.travel_window}
            initialPreferences={preferences}
            redirectTo={`/trip/${trip.id}`}
            submitLabel="Save changes"
          />
        </div>
      </main>
    </div>
  );
}
