import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { LinkButton } from "@/components/ui/Button";
import { TripStatusBadge } from "@/components/TripStatusBadge";
import { VennMark } from "@/components/VennMark";
import { formatDateRange } from "@/lib/utils";
import type { Trip, TripStatus } from "@/types/database";

interface TripMembership {
  trip_id: string;
  preferences_submitted: boolean;
  trips: (Trip & { trip_members: { count: number }[] }) | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("name")
    .eq("id", authUser.id)
    .single();

  const { data: memberships } = await supabase
    .from("trip_members")
    .select(
      "trip_id, preferences_submitted, trips(id, name, travel_window, group_size, status, invite_code, organiser_id, created_at, trip_members(count))"
    )
    .eq("user_id", authUser.id)
    .order("joined_at", { ascending: false })
    .returns<TripMembership[]>();

  const trips = (memberships || []).filter((m) => m.trips !== null);

  return (
    <div className="flex flex-col flex-1">
      <AppHeader userName={profile?.name} />

      <main className="flex-1 mx-auto w-full max-w-5xl px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-ink">Your trips</h1>
            <p className="mt-1 text-ink-3">
              Create a new trip or jump back into one you&apos;re planning.
            </p>
          </div>
          <LinkButton href="/trip/new" size="lg">
            Start a trip
          </LinkButton>
        </div>

        {trips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white p-12 text-center">
            <VennMark size={36} className="mx-auto mb-4" />
            <h2 className="text-lg font-bold text-ink">No trips yet</h2>
            <p className="mt-2 text-sm text-ink-3 max-w-sm mx-auto">
              Start a trip to invite your friends, or use an invite link someone has
              shared with you.
            </p>
            <div className="mt-6">
              <LinkButton href="/trip/new">Start your first trip</LinkButton>
            </div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-5">
            {trips.map((membership) => {
              const trip = membership.trips!;
              const memberCount = trip.trip_members?.[0]?.count ?? 0;
              const href =
                trip.status === "ready" ? `/trip/${trip.id}/chat` : `/trip/${trip.id}`;

              return (
                <Link
                  key={trip.id}
                  href={href}
                  className="group rounded-2xl border border-line bg-white p-6 hover:border-brand hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-lg text-ink group-hover:text-brand transition-colors">
                      {trip.name}
                    </h3>
                    <TripStatusBadge status={trip.status as TripStatus} />
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-ink-3">
                    {trip.travel_window && (
                      <p>
                        {formatDateRange(trip.travel_window.from, trip.travel_window.to)}
                      </p>
                    )}
                    <p>
                      {memberCount} of {trip.group_size} joined
                      {!membership.preferences_submitted && " · Your preferences are needed"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
