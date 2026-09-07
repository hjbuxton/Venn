import { escapeHtml } from "./escapeHtml";
import { renderEmailShell } from "./shell";

export function buildOrganiserNudgeEmail({
  tripName,
  tripUrl,
  inviteUrl,
  unsubscribeUrl,
}: {
  tripName: string;
  tripUrl: string;
  inviteUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(tripName);
  const safeInviteUrl = escapeHtml(inviteUrl);

  return {
    subject: `Don't forget to invite your group to ${tripName}`,
    html: renderEmailShell({
      preheader: `Nobody's joined ${safeName} yet — share your invite link to get started.`,
      headline: "Your trip is waiting on an invite",
      bodyHtml: `You set up <strong style="color:#111827;">${safeName}</strong> and shared your own preferences, but nobody else has joined yet. Share this link with your group so Venn can start finding a trip that works for everyone:<br /><br /><a href="${safeInviteUrl}" style="color:#2563eb; word-break:break-all;">${safeInviteUrl}</a>`,
      ctaLabel: "Go to your trip",
      ctaUrl: tripUrl,
      unsubscribeUrl,
    }),
  };
}
