import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/emails/send";
import { buildOrganiserNudgeEmail } from "@/lib/emails/organiserNudge";
import { buildActivityDigestEmail } from "@/lib/emails/activityDigest";
import { buildInviteUrl, buildTripUrl, buildChatUrl, buildUnsubscribeUrl } from "@/lib/site";

type AdminClient = ReturnType<typeof createAdminClient>;

const NUDGE_AFTER_MS = 24 * 60 * 60 * 1000;

interface TripCandidate {
  id: string;
  name: string;
  invite_code: string;
  organiser_id: string;
}

interface TripMemberRow {
  trip_id: string;
  user_id: string;
  preferences_submitted: boolean;
}

async function sendOrganiserNudges(supabase: AdminClient) {
  const cutoff = new Date(Date.now() - NUDGE_AFTER_MS).toISOString();

  const { data: candidateTrips } = await supabase
    .from("trips")
    .select("id, name, invite_code, organiser_id")
    .is("organiser_nudge_sent_at", null)
    .eq("status", "collecting")
    .lte("created_at", cutoff)
    .returns<TripCandidate[]>();

  if (!candidateTrips || candidateTrips.length === 0) {
    return { checked: 0, sent: 0 };
  }

  const tripIds = candidateTrips.map((t) => t.id);

  const { data: allMembers } = await supabase
    .from("trip_members")
    .select("trip_id, user_id, preferences_submitted")
    .in("trip_id", tripIds)
    .returns<TripMemberRow[]>();

  const membersByTrip = new Map<string, TripMemberRow[]>();
  for (const member of allMembers ?? []) {
    const list = membersByTrip.get(member.trip_id) ?? [];
    list.push(member);
    membersByTrip.set(member.trip_id, list);
  }

  let sent = 0;

  for (const trip of candidateTrips) {
    const members = membersByTrip.get(trip.id) ?? [];
    const isSoloOrganiser =
      members.length === 1 &&
      members[0].user_id === trip.organiser_id &&
      members[0].preferences_submitted;

    if (!isSoloOrganiser) continue;

    const { data: organiser } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", trip.organiser_id)
      .single();

    const { data: settings } = await supabase
      .from("notification_settings")
      .select("email_notifications_enabled, unsubscribe_token")
      .eq("user_id", trip.organiser_id)
      .single();

    if (!organiser || !settings?.email_notifications_enabled) continue;

    const { subject, html } = buildOrganiserNudgeEmail({
      tripName: trip.name,
      tripUrl: buildTripUrl(trip.id),
      inviteUrl: buildInviteUrl(trip.invite_code),
      unsubscribeUrl: buildUnsubscribeUrl(settings.unsubscribe_token),
    });

    const ok = await sendEmail({ to: organiser.email, subject, html });

    if (ok) {
      await supabase
        .from("trips")
        .update({ organiser_nudge_sent_at: new Date().toISOString() })
        .eq("id", trip.id);
      sent++;
    }
  }

  return { checked: candidateTrips.length, sent };
}

interface UnreadCandidate {
  trip_id: string;
  user_id: string;
  trip_name: string;
  unread_count: number;
}

async function sendActivityDigests(supabase: AdminClient) {
  const { data: candidatesData } = await supabase.rpc("get_unread_activity_candidates", {
    p_unread_after: "3 hours",
    p_cooldown: "6 hours",
  });

  const candidates = candidatesData as UnreadCandidate[] | null;

  if (!candidates || candidates.length === 0) {
    return { checked: 0, sent: 0 };
  }

  let sent = 0;

  for (const candidate of candidates) {
    const { data: user } = await supabase
      .from("users")
      .select("email, name")
      .eq("id", candidate.user_id)
      .single();

    const { data: settings } = await supabase
      .from("notification_settings")
      .select("unsubscribe_token")
      .eq("user_id", candidate.user_id)
      .single();

    if (!user || !settings) continue;

    const { subject, html } = buildActivityDigestEmail({
      tripName: candidate.trip_name,
      unreadCount: candidate.unread_count,
      chatUrl: buildChatUrl(candidate.trip_id),
      unsubscribeUrl: buildUnsubscribeUrl(settings.unsubscribe_token),
    });

    const ok = await sendEmail({ to: user.email, subject, html });

    if (ok) {
      await supabase
        .from("trip_members")
        .update({ last_activity_email_sent_at: new Date().toISOString() })
        .eq("trip_id", candidate.trip_id)
        .eq("user_id", candidate.user_id);
      sent++;
    }
  }

  return { checked: candidates.length, sent };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  const [organiserNudges, activityDigests] = await Promise.all([
    sendOrganiserNudges(supabase),
    sendActivityDigests(supabase),
  ]);

  return NextResponse.json({ ok: true, organiserNudges, activityDigests });
}
