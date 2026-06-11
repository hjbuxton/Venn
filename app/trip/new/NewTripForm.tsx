"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { generateInviteCode } from "@/lib/utils";
import type { DateRange } from "@/types/database";

export function NewTripForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [travelWindow, setTravelWindow] = useState<DateRange | null>(null);
  const [groupSize, setGroupSize] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!travelWindow) {
      setError("Please select a travel window.");
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

    let trip = null;
    let lastError: { message: string; code?: string } | null = null;

    for (let attempt = 0; attempt < 5 && !trip; attempt++) {
      const { data, error } = await supabase
        .from("trips")
        .insert({
          name,
          organiser_id: user.id,
          travel_window: travelWindow,
          group_size: groupSize,
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
        <Label>Travel window</Label>
        <DateRangePicker
          value={travelWindow}
          onChange={setTravelWindow}
          placeholder="Roughly when could this happen?"
        />
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
          min={2}
          max={20}
          required
          value={groupSize}
          onChange={(e) => setGroupSize(Number(e.target.value))}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? "Creating trip..." : "Create trip & continue"}
      </Button>
    </form>
  );
}
