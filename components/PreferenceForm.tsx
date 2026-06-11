"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Label, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ChipToggle } from "@/components/ui/ChipToggle";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import {
  BUDGET_LABELS,
  DISTANCE_LABELS,
  VIBE_LABELS,
  type BudgetRange,
  type DateRange,
  type Distance,
  type TripVibe,
} from "@/types/database";

const VIBE_OPTIONS = (Object.keys(VIBE_LABELS) as TripVibe[]).map((value) => ({
  value,
  label: VIBE_LABELS[value],
}));

export function PreferenceForm({
  tripId,
  travelWindow,
}: {
  tripId: string;
  travelWindow: DateRange | null;
}) {
  const router = useRouter();

  const [budgetRange, setBudgetRange] = useState<BudgetRange>("300_500");
  const [availableDates, setAvailableDates] = useState<DateRange | null>(travelWindow);
  const [tripVibes, setTripVibes] = useState<string[]>([]);
  const [dealBreakers, setDealBreakers] = useState("");
  const [distance, setDistance] = useState<Distance>("europe");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!availableDates) {
      setError("Please select your available dates.");
      return;
    }
    if (tripVibes.length === 0) {
      setError("Pick at least one trip vibe.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: prefError } = await supabase.from("preferences").upsert(
      {
        trip_id: tripId,
        user_id: user.id,
        budget_range: budgetRange,
        available_dates: availableDates,
        trip_vibes: tripVibes,
        deal_breakers: dealBreakers || null,
        distance,
      },
      { onConflict: "trip_id,user_id" }
    );

    if (prefError) {
      setLoading(false);
      setError(prefError.message);
      return;
    }

    const { error: memberError } = await supabase
      .from("trip_members")
      .update({ preferences_submitted: true })
      .eq("trip_id", tripId)
      .eq("user_id", user.id);

    setLoading(false);

    if (memberError) {
      setError(memberError.message);
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <div>
        <Label>Budget per person</Label>
        <Select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value as BudgetRange)}>
          {(Object.keys(BUDGET_LABELS) as BudgetRange[]).map((value) => (
            <option key={value} value={value}>
              {BUDGET_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label>When are you available?</Label>
        <DateRangePicker
          value={availableDates}
          onChange={setAvailableDates}
          placeholder="Select your available dates"
        />
      </div>

      <div>
        <Label>What&apos;s your trip vibe? (pick as many as you like)</Label>
        <ChipToggle options={VIBE_OPTIONS} value={tripVibes} onChange={setTripVibes} />
      </div>

      <div>
        <Label>How far are you willing to travel?</Label>
        <Select value={distance} onChange={(e) => setDistance(e.target.value as Distance)}>
          {(Object.keys(DISTANCE_LABELS) as Distance[]).map((value) => (
            <option key={value} value={value}>
              {DISTANCE_LABELS[value]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="deal_breakers">
          Any deal breakers? <span className="font-normal text-ink-3">(optional)</span>
        </Label>
        <Textarea
          id="deal_breakers"
          rows={3}
          value={dealBreakers}
          onChange={(e) => setDealBreakers(e.target.value)}
          placeholder="e.g. no hostels, need a pool, can't fly long-haul..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Submitting..." : "Submit my preferences"}
      </Button>
    </form>
  );
}
