"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { generateInviteCode } from "@/lib/utils";

export function NewTripForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [groupSize, setGroupSize] = useState("4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Please select a start and end date.");
      return;
    }
    if (endDate < startDate) {
      setError("End date must be on or after the start date.");
      return;
    }

    const groupSizeValue = Number(groupSize);
    if (!Number.isInteger(groupSizeValue) || groupSizeValue < 2 || groupSizeValue > 20) {
      setError("Please enter a group size between 2 and 20.");
      return;
    }

    const travelWindow = { from: startDate, to: endDate };

    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let trip = null;
    let lastError: { message: string; code?: string } | null = null;

    for (let attempt = 0; attempt < 5 && !trip; attempt++) {
      const { data, error } = await supabase
        .from("trips")
        .insert({
          name,
          organiser_id: user.id,
          travel_window: travelWindow,
          group_size: groupSizeValue,
          invite_code: generateInviteCode(),
        })
        .select()
        .single();

      if (error) {
        lastError = error;
        if (error.code === "23505") continue; // invite_code collision, retry
        break;
      }
      trip = data;
    }

    if (!trip) {
      setLoading(false);
      setError(lastError?.message || "Could not create trip. Please try again.");
      return;
    }

    const { error: memberError } = await supabase.from("trip_members").insert({
      trip_id: trip.id,
      user_id: user.id,
    });

    setLoading(false);

    if (memberError) {
      setError(memberError.message);
      return;
    }

    router.push(`/trip/${trip.id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="name">Trip name</Label>
        <Input
          id="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer trip 2026"
          autoFocus
        />
      </div>

      <div>
        <p className="block text-sm font-semibold text-ink mb-2">Travel window</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="start_date" className="text-xs font-medium text-ink-3">
              Start date
            </Label>
            <Input
              id="start_date"
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="end_date" className="text-xs font-medium text-ink-3">
              End date
            </Label>
            <Input
              id="end_date"
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-ink-3">
          This is just a rough window — everyone&apos;s exact availability is collected
          privately afterwards.
        </p>
      </div>

      <div>
        <Label htmlFor="group_size">How many people (including you)?</Label>
        <Input
          id="group_size"
          type="number"
          inputMode="numeric"
          min={2}
          max={20}
          required
          value={groupSize}
          onChange={(e) => setGroupSize(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Creating trip..." : "Create trip & continue"}
      </Button>
    </form>
  );
}
