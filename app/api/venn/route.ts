import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildBookingUrl } from "@/lib/booking";
import {
  BUDGET_LABELS,
  DISTANCE_LABELS,
  VIBE_LABELS,
  type BudgetRange,
  type DateRange,
  type Distance,
  type TripVibe,
  type VennRecommendationItem,
} from "@/types/database";

interface PreferenceRow {
  budget_range: BudgetRange;
  available_dates: DateRange;
  trip_vibes: TripVibe[];
  deal_breakers: string | null;
  distance: Distance;
}

export async function POST(request: Request) {
  const { tripId } = await request.json();

  if (!tripId || typeof tripId !== "string") {
    return NextResponse.json({ error: "Missing tripId." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name")
    .eq("id", tripId)
    .single();

  if (!trip) {
    return NextResponse.json({ error: "Trip not found." }, { status: 404 });
  }

  const { data: preferencesData, error: prefsError } = await supabase.rpc(
    "get_trip_preferences_for_ai",
    { p_trip_id: tripId }
  );

  const preferences = preferencesData as PreferenceRow[] | null;

  if (prefsError) {
    return NextResponse.json({ error: prefsError.message }, { status: 400 });
  }

  if (!preferences || preferences.length === 0) {
    return NextResponse.json(
      { error: "No preferences submitted yet for this trip." },
      { status: 400 }
    );
  }

  const summary = preferences
    .map((pref, i) => {
      const vibes = pref.trip_vibes.map((v) => VIBE_LABELS[v] ?? v).join(", ");
      const lines = [
        `Person ${i + 1}:`,
        `- Budget per person: ${BUDGET_LABELS[pref.budget_range] ?? pref.budget_range}`,
        `- Available dates: ${pref.available_dates.from} to ${pref.available_dates.to}`,
        `- Trip vibe: ${vibes || "no preference"}`,
        `- Willing to travel: ${DISTANCE_LABELS[pref.distance] ?? pref.distance}`,
      ];
      if (pref.deal_breakers) {
        lines.push(`- Deal breakers: ${pref.deal_breakers}`);
      }
      return lines.join("\n");
    })
    .join("\n\n");

  const prompt = `You are Venn, a group travel planning AI. Based on the following anonymous group preferences, recommend 5 specific trips that work for everyone in the group. For each trip, find dates, accommodation, and price ranges that would satisfy the overlap of the group's budgets, availability, and vibes.

Group preferences:

${summary}

Return ONLY a JSON array (no markdown, no commentary) of exactly 5 objects, each with this shape:
{
  "destination": "City name",
  "country": "Country name",
  "dates": "A specific date range that fits within the group's overlapping availability, e.g. '12-16 Sep 2026'",
  "checkin": "Check-in date for the dates above, in strict YYYY-MM-DD format, e.g. '2026-09-12'",
  "checkout": "Check-out date for the dates above, in strict YYYY-MM-DD format, e.g. '2026-09-16'",
  "accommodation": "Short description of a specific type of place to stay, e.g. 'Beachfront 6-bed apartment'",
  "description": "1-2 sentence description of why this trip is great for the group",
  "price_per_person": "Estimated price per person, e.g. '£450'",
  "vibe_match": "1 short sentence on why this fits the group's vibes and budgets"
}

Return ONLY the JSON array.`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let recommendations: VennRecommendationItem[];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const jsonMatch = raw.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      throw new Error("Venn's response didn't contain valid JSON.");
    }

    const parsed = JSON.parse(jsonMatch[0]) as Omit<VennRecommendationItem, "booking_url">[];

    recommendations = parsed.map((item) => ({
      ...item,
      booking_url: buildBookingUrl({
        destination: [item.destination, item.country].filter(Boolean).join(", "),
        checkin: item.checkin,
        checkout: item.checkout,
      }),
    }));
  } catch (err) {
    console.error("Venn AI error:", err);
    return NextResponse.json(
      { error: "Venn couldn't find any ideas right now. Please try again." },
      { status: 502 }
    );
  }

  const { data: recommendation, error: recError } = await supabase
    .from("venn_recommendations")
    .insert({
      trip_id: tripId,
      triggered_by: user.id,
      recommendations_json: recommendations,
    })
    .select("id")
    .single();

  if (recError || !recommendation) {
    return NextResponse.json(
      { error: recError?.message ?? "Failed to save recommendations." },
      { status: 400 }
    );
  }

  const { error: messageError } = await supabase.from("messages").insert({
    trip_id: tripId,
    user_id: user.id,
    content: "Here's what Venn found for your group.",
    message_type: "venn_card",
    recommendation_id: recommendation.id,
  });

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, recommendationId: recommendation.id });
}
