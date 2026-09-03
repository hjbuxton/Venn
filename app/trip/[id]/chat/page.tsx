import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { ChatRoom } from "@/components/ChatRoom";
import type { Message, Trip, TripMember, User, VennRecommendation } from "@/types/database";

interface MessageRow extends Message {
  users: { name: string } | null;
  venn_recommendations: Pick<VennRecommendation, "id" | "recommendations_json" | "triggered_by"> | null;
}

interface MemberRow extends TripMember {
  users: Pick<User, "name"> | null;
}

export default async function ChatPage({
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
    redirect(`/login?redirect=${encodeURIComponent(`/trip/${id}/chat`)}`);
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

  const groupReady = trip.status !== "collecting";

  // Only the organiser gets early access to chat while the group is still
  // collecting (see app/trip/[id]/page.tsx) — anyone else who lands here
  // directly goes back to the normal waiting screen.
  if (!groupReady && trip.organiser_id !== authUser.id) {
    redirect(`/trip/${id}`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", authUser.id)
    .single();

  let recommendationsStale = false;
  let waitingInfo: { submittedCount: number; groupSize: number; inviteUrl: string } | null = null;

  if (groupReady) {
    const { data: lastPreferencesUpdate } = await supabase.rpc(
      "get_trip_preferences_last_updated",
      { p_trip_id: id }
    );

    recommendationsStale = Boolean(
      trip.recommendations_generated_at &&
        lastPreferencesUpdate &&
        new Date(lastPreferencesUpdate as string) > new Date(trip.recommendations_generated_at)
    );
  } else {
    const { data: members } = await supabase
      .from("trip_members")
      .select("id, trip_id, user_id, joined_at, preferences_submitted, users(name)")
      .eq("trip_id", id)
      .returns<MemberRow[]>();

    const headersList = await headers();
    const host = headersList.get("host");
    const protocol =
      host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https";

    waitingInfo = {
      submittedCount: (members ?? []).filter((m) => m.preferences_submitted).length,
      groupSize: trip.group_size,
      inviteUrl: `${protocol}://${host}/join/${trip.invite_code}`,
    };
  }

  const { data: messages } = await supabase
    .from("messages")
    .select(
      "id, trip_id, user_id, content, message_type, recommendation_id, created_at, users(name), venn_recommendations(id, recommendations_json, triggered_by)"
    )
    .eq("trip_id", id)
    .order("created_at", { ascending: true })
    .returns<MessageRow[]>();

  const initialMessages: Message[] = (messages || []).map((m) => ({
    id: m.id,
    trip_id: m.trip_id,
    user_id: m.user_id,
    content: m.content,
    message_type: m.message_type,
    created_at: m.created_at,
    user: m.users ? { id: m.user_id ?? "", email: "", name: m.users.name, created_at: "" } : undefined,
    recommendation: m.venn_recommendations
      ? {
          id: m.venn_recommendations.id,
          trip_id: m.trip_id,
          triggered_by: m.venn_recommendations.triggered_by,
          recommendations_json: m.venn_recommendations.recommendations_json,
          created_at: m.created_at,
        }
      : undefined,
  }));

  return (
    <div className="flex flex-col flex-1 h-dvh">
      <AppHeader userName={profile?.name} />
      <ChatRoom
        tripId={trip.id}
        tripName={trip.name}
        currentUserId={authUser.id}
        initialMessages={initialMessages}
        recommendationsStale={recommendationsStale}
        groupReady={groupReady}
        waitingInfo={waitingInfo}
      />
    </div>
  );
}
