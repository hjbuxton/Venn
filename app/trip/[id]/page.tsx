import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { PreferenceForm } from "@/components/PreferenceForm";
import { WaitingScreen } from "@/components/WaitingScreen";
import type { Trip, TripMember, User } from "@/types/database";

interface MemberRow extends TripMember {
  users: Pick<User, "name"> | null;
}

export default async function TripPage({
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
    redirect(`/login?redirect=${encodeURIComponent(`/trip/${id}`)}`);
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("*")
    .eq("id", id)
    .single<Trip>();

  if (!trip) {
    notFound();
  }

  const { data: members } = await supabase
    .from("trip_members")
    .select("id, trip_id, user_id, joined_at, preferences_submitted, users(name)")
    .eq("trip_id", id)
    .order("joined_at", { ascending: true })
    .returns<MemberRow[]>();

  const myMembership = members?.find((m) => m.user_id === authUser.id);

  if (!myMembership) {
    redirect("/dashboard");
  }

  if (trip.status === "ready" || trip.status === "planned") {
    redirect(`/trip/${id}/chat`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", authUser.id)
    .single();

  if (!myMembership.preferences_submitted) {
    return (
      <div className="flex flex-col flex-1">
        <AppHeader userName={profile?.name} />
        <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">
              What do you actually want?
            </h1>
            <p className="mt-2 text-ink-3">
              Your answers are completely private. Nobody in your group will see what
              you enter here.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
            <PreferenceForm tripId={trip.id} travelWindow={trip.travel_window} />
          </div>
        </main>
      </div>
    );
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";
  const inviteUrl = `${protocol}://${host}/join/${trip.invite_code}`;

  const memberList = (members || []).map((member) => ({
    name:
      member.user_id === authUser.id
        ? "You"
        : member.users?.name ?? "Someone",
    submitted: member.preferences_submitted,
  }));

  return (
    <div className="flex flex-col flex-1">
      <AppHeader userName={profile?.name} />
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
        <WaitingScreen
          tripName={trip.name}
          members={memberList}
          groupSize={trip.group_size}
          inviteUrl={inviteUrl}
        />
      </main>
    </div>
  );
}
