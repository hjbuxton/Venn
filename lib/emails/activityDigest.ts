import { escapeHtml } from "./escapeHtml";
import { renderEmailShell } from "./shell";

export function buildActivityDigestEmail({
  tripName,
  unreadCount,
  chatUrl,
  unsubscribeUrl,
}: {
  tripName: string;
  unreadCount: number;
  chatUrl: string;
  unsubscribeUrl: string;
}): { subject: string; html: string } {
  const safeName = escapeHtml(tripName);
  const messageWord = unreadCount === 1 ? "message" : "messages";

  return {
    subject: `${unreadCount} new ${messageWord} in ${tripName}`,
    html: renderEmailShell({
      preheader: `${unreadCount} unread ${messageWord} waiting for you in ${safeName}.`,
      headline: "You've got new activity",
      bodyHtml: `There ${unreadCount === 1 ? "is" : "are"} <strong style="color:#111827;">${unreadCount} unread ${messageWord}</strong> in <strong style="color:#111827;">${safeName}</strong> since you were last there.`,
      ctaLabel: "Open the chat",
      ctaUrl: chatUrl,
      unsubscribeUrl,
    }),
  };
}
