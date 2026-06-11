import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { ChatRoom } from "@/components/ChatRoom";
import type { Message, Trip, VennRecommendation } from "@/types/database";

interface MessageRow extends Message {
  users: { name: string } | null;
  venn_recommendations: Pick<VennRecommendation, "id" | "recommendations_json"> | null;
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

  if (trip.status === "collecting") {
    redirect(`/trip/${id}`);
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", authUser.id)
    .single();

  const { data: messages } = await supabase
    .from("messages")
    .select(
      "id, trip_id, user_id, content, message_type, recommendation_id, created_at, users(name), venn_recommendations(id, recommendations_json)"
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
          triggered_by: "",
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
      />
    </div>
  );
}
