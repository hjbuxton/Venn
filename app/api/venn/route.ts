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
  type VennResponse,
  type VennRecommendationItem,
} from "@/types/database";

interface PreferenceRow {
  budget_range: BudgetRange;
  available_dates: DateRange;
  trip_vibes: TripVibe[];
  deal_breakers: string | null;
  distance: Distance;
}

interface HistoryRow {
  content: string;
  message_type: "text" | "venn_card" | "system";
  users: { name: string } | null;
  venn_recommendations: { recommendations_json: VennResponse } | null;
}

const SYSTEM_PROMPT = `You are Venn, an AI travel planning assistant embedded in a group chat for friends planning a trip together.

You have access to:
- An anonymised summary of everyone's private preferences (budget, available dates, trip vibes, distance willing to travel, and any deal breakers). This data is strictly confidential: never reveal, reference, or imply any individual's specific preference to the group, never name a group member in connection with any preference, and never speculate about who holds which preference.
- The last messages in the group chat, for context.
- The message that just triggered you (it will mention @Venn).

Preferences will often differ across the group - some may want it warmer, others cooler; some higher budget, others lower. This is normal and NOT something to surface. Never describe the group as having a "conflict," "disagreement," or "split," and never ask the group to discuss or resolve differing preferences themselves - finding the compromise is your job, done silently, not something to hand back to them. Concretely:
- If a single destination reasonably satisfies the range of preferences, recommend it with general reasoning about the destination itself (climate, cost, activities, etc.) - never reasoning framed as "your group wants X and Y" or otherwise tied back to what anyone asked for.
- If no single destination fits everyone well, present 2-3 options spanning the range (e.g. one milder, one warmer; one cheaper, one pricier), framed as variety for the group to pick from - not as evidence that preferences differ.
- Never state a budget figure, date range, or other preference range in a way that would let someone work out another member's specific input from it (e.g. don't say "the group's budget is £300-£1,200 per person").

Work out what the group is asking for, then respond with exactly one of the following JSON shapes - and nothing else. No markdown, no commentary, no code fences. Just the raw JSON object.

1. Recommendations - the group wants trip ideas, or wants you to update or filter previous trip ideas based on a new constraint:
{
  "type": "recommendations",
  "message": "optional short acknowledgement of the request, e.g. 'Got it, filtering for trips under £400 per person...' - omit if not needed",
  "trips": [
    {
      "destination": "City name",
      "country": "Country name",
      "dates": "A specific date range within the group's overlapping availability, e.g. '12-16 Sep 2026'",
      "nights": 4,
      "accommodation_type": "Short description of a specific type of place to stay, e.g. 'Beachfront 6-bed apartment'",
      "price_per_person": "Estimated price per person, e.g. '£450'",
      "why_it_fits": "1-2 sentences of general reasoning about the destination itself (climate, cost, activities) - never phrased as 'your group wants X' or tied back to anyone's specific input",
      "checkin": "Check-in date in strict YYYY-MM-DD format, e.g. '2026-09-12'",
      "checkout": "Check-out date in strict YYYY-MM-DD format, e.g. '2026-09-16'"
    }
  ]
}
Return exactly 5 trips for a fresh request, or fewer if filtering down a previous list.

2. Information - the group is asking a factual question about a destination, travel logistics, weather, visas, etc:
{
  "type": "information",
  "headline": "Short title summarising the answer",
  "bullets": ["Point 1", "Point 2", "Point 3"]
}

3. Clarification - the request itself is too vague or ambiguous to act on without more detail (e.g. no destination type or timeframe given). Never use this to ask the group to resolve differing preferences amongst themselves - that's your job, not theirs:
{
  "type": "clarification",
  "message": "A friendly question asking for the detail you need"
}

4. Calculation - the group is asking about costs, splitting bills, budgets, or totals:
{
  "type": "calculation",
  "headline": "Optional short title",
  "breakdown": [
    { "label": "Flights", "amount": "£180 per person" },
    { "label": "Accommodation (4 nights)", "amount": "£120 per person" }
  ],
  "total": "Optional total, e.g. '£450 per person'"
}

Always return valid JSON only, matching exactly one of these four shapes.`;

function summarizeVennResponse(response: VennResponse): string {
  switch (response.type) {
    case "recommendations":
      return [response.message, `Suggested: ${response.trips.map((t) => t.destination).join(", ")}`]
        .filter(Boolean)
        .join(" ");
    case "information":
      return response.headline;
    case "clarification":
      return response.message;
    case "calculation":
      return response.headline ?? "Cost breakdown shared.";
  }
}

export async function POST(request: Request) {
  const { tripId, message } = await request.json();

  if (!tripId || typeof tripId !== "string") {
    return NextResponse.json({ error: "Missing tripId." }, { status: 400 });
  }

  if (!message || typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "Missing message." }, { status: 400 });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from("trip_members")
    .select("user_id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership) {
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

  const preferencesSummary = preferences
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

  const { data: historyData } = await supabase
    .from("messages")
    .select("content, message_type, users(name), venn_recommendations(recommendations_json)")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<HistoryRow[]>();

  const history = (historyData ?? []).slice().reverse();

  const historySummary = history.length
    ? history
        .map((row) => {
          if (row.message_type === "venn_card") {
            const parsed = row.venn_recommendations?.recommendations_json;
            return `Venn: ${parsed ? summarizeVennResponse(parsed) : row.content}`;
          }
          const name = row.users?.name ?? "Someone";
          return `${name}: ${row.content}`;
        })
        .join("\n")
    : "(no previous messages)";

  const userPrompt = `Group's anonymised preferences:

${preferencesSummary}

Recent conversation:
${historySummary}

Triggering message: ${message.trim()}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let result: VennResponse;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error("Venn's response didn't contain valid JSON.");
    }

    const parsed = JSON.parse(jsonMatch[0]) as VennResponse;

    if (!["recommendations", "information", "clarification", "calculation"].includes(parsed.type)) {
      throw new Error("Venn's response had an unrecognised type.");
    }

    if (parsed.type === "recommendations") {
      const trips = parsed.trips as Omit<VennRecommendationItem, "booking_url">[];
      parsed.trips = trips.map((item) => ({
        ...item,
        booking_url: buildBookingUrl({
          destination: [item.destination, item.country].filter(Boolean).join(", "),
          checkin: item.checkin,
          checkout: item.checkout,
        }),
      }));
    }

    result = parsed;
  } catch (err) {
    console.error("Venn AI error:", err);
    return NextResponse.json(
      { error: "Venn couldn't process that right now. Please try again." },
      { status: 502 }
    );
  }

  const { data: recommendation, error: recError } = await supabase
    .from("venn_recommendations")
    .insert({
      trip_id: tripId,
      triggered_by: user.id,
      recommendations_json: result,
    })
    .select("id")
    .single();

  if (recError || !recommendation) {
    return NextResponse.json(
      { error: recError?.message ?? "Failed to save Venn's response." },
      { status: 400 }
    );
  }

  const content = summarizeVennResponse(result) || "Venn replied.";

  const { error: messageError } = await supabase.from("messages").insert({
    trip_id: tripId,
    user_id: user.id,
    content,
    message_type: "venn_card",
    recommendation_id: recommendation.id,
  });

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, recommendationId: recommendation.id });
}
