// Absolute base URL for links inside emails, where there's no incoming
// request to derive a host from (Vercel Cron invocations aren't page loads).
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.venntravel.co.uk";

export function buildInviteUrl(inviteCode: string) {
  return `${SITE_URL}/join/${inviteCode}`;
}

export function buildTripUrl(tripId: string) {
  return `${SITE_URL}/trip/${tripId}`;
}

export function buildChatUrl(tripId: string) {
  return `${SITE_URL}/trip/${tripId}/chat`;
}

export function buildUnsubscribeUrl(token: string) {
  return `${SITE_URL}/unsubscribe?token=${token}`;
}
