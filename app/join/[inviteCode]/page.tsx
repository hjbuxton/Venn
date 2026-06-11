import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VennLogo, VennMark } from "@/components/VennMark";
import { LinkButton } from "@/components/ui/Button";
import { formatDateRange } from "@/lib/utils";
import { JoinTripButton } from "./JoinTripButton";

interface TripPreview {
  id: string;
  name: string;
  travel_window: { from: string; to: string } | null;
  group_size: number;
  status: string;
  member_count: number;
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ inviteCode: string }>;
}) {
  const { inviteCode } = await params;
  const supabase = await createClient();

  const { data: previews } = await supabase.rpc("get_trip_by_invite_code", {
    p_invite_code: inviteCode,
  });

  const trip = (previews?.[0] as TripPreview | undefined) ?? null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (trip && user) {
    const { data: membership } = await supabase
      .from("trip_members")
      .select("trip_id")
      .eq("trip_id", trip.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (membership) {
      redirect(`/trip/${trip.id}`);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <VennLogo />
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-white p-8 shadow-sm text-center">
          {!trip ? (
            <>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                Invite link not found
              </h1>
              <p className="mt-2 text-sm text-ink-3">
                This invite link looks invalid or may have expired. Ask whoever invited
                you for a fresh link.
              </p>
              <div className="mt-8">
                <LinkButton href="/dashboard" variant="secondary" className="w-full">
                  Go to dashboard
                </LinkButton>
              </div>
            </>
          ) : (
            <>
              <VennMark size={36} className="mx-auto mb-4" />
              <p className="text-sm font-semibold text-brand uppercase tracking-wide">
                You&apos;re invited to
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-ink">
                {trip.name}
              </h1>
              <div className="mt-3 space-y-1 text-sm text-ink-3">
                {trip.travel_window && (
                  <p>{formatDateRange(trip.travel_window.from, trip.travel_window.to)}</p>
                )}
                <p>
                  {trip.member_count} of {trip.group_size} people have joined
                </p>
              </div>

              <div className="mt-8 space-y-3">
                {user ? (
                  <JoinTripButton inviteCode={inviteCode} />
                ) : (
                  <>
                    <LinkButton
                      href={`/signup?redirect=${encodeURIComponent(`/join/${inviteCode}`)}`}
                      size="lg"
                      className="w-full"
                    >
                      Sign up to join
                    </LinkButton>
                    <LinkButton
                      href={`/login?redirect=${encodeURIComponent(`/join/${inviteCode}`)}`}
                      variant="secondary"
                      size="lg"
                      className="w-full"
                    >
                      I already have an account
                    </LinkButton>
                  </>
                )}
              </div>

              <p className="mt-6 text-xs text-ink-3 leading-relaxed">
                Your budget and preferences will be completely private — nobody in the
                group will see your answers.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
