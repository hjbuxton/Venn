// Trip names are user-controlled (the organiser types them). Escape before
// interpolating into email HTML — otherwise a crafted trip name could inject
// markup/links into an email sent to someone else's inbox.
export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
