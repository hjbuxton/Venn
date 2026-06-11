"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export function JoinTripButton({ inviteCode }: { inviteCode: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: tripId, error } = await supabase.rpc("join_trip_by_invite_code", {
      p_invite_code: inviteCode,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    router.push(`/trip/${tripId}`);
    router.refresh();
  }

  return (
    <div>
      <Button onClick={handleJoin} size="lg" className="w-full" disabled={loading}>
        {loading ? "Joining..." : "Join trip"}
      </Button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
