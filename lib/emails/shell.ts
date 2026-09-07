// Shared branded shell for notification emails (organiser nudge, activity
// digest). Matches the visual conventions established in
// supabase/templates/confirm-signup.html: table-based layout, MSO/Outlook
// conditionals, brand blue CTA button. Unlike that template (Go-templated,
// pasted into the Supabase dashboard), this one is rendered by app code, so
// callers pass already-escaped dynamic content — see escapeHtml.ts.
export function renderEmailShell({
  preheader,
  headline,
  bodyHtml,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: {
  preheader: string;
  headline: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  unsubscribeUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${headline}</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  body, table, td { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #f7f8fa; }
  table { border-collapse: collapse; }
  a { text-decoration: none; }
  @media only screen and (max-width: 480px) {
    .venn-container { width: 100% !important; }
    .venn-card { padding: 32px 24px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f7f8fa;">
  <span style="display:none; font-size:1px; color:#f7f8fa; line-height:1px; max-height:0; max-width:0; opacity:0; overflow:hidden;">
    ${preheader}
  </span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f7f8fa;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" class="venn-container" style="width:480px; max-width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding-bottom:28px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:0; line-height:0;">
                    <span style="display:inline-block; width:20px; height:20px; border-radius:50%; background-color:#87a9f4; vertical-align:middle;"></span><span style="display:inline-block; width:20px; height:20px; border-radius:50%; background-color:#87a9f4; margin-left:-8px; vertical-align:middle;"></span>
                  </td>
                  <td style="padding-left:8px; font-size:20px; line-height:20px; font-weight:800; color:#111827; letter-spacing:-0.02em; vertical-align:middle;">Venn</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="venn-card" style="background-color:#ffffff; border:1px solid #e5e7eb; border-radius:16px; padding:40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="font-size:24px; line-height:32px; font-weight:800; color:#111827; letter-spacing:-0.01em; padding-bottom:12px;">
                    ${headline}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:15px; line-height:24px; color:#6b7280; padding-bottom:28px;">
                    ${bodyHtml}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${ctaUrl}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="20%" strokecolor="#2563eb" fillcolor="#2563eb">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">${ctaLabel}</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="${ctaUrl}" target="_blank" style="display:inline-block; background-color:#2563eb; color:#ffffff; font-size:15px; line-height:20px; font-weight:700; padding:14px 32px; border-radius:10px;">${ctaLabel}</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px; font-size:12px; line-height:18px; color:#9ca3af;">
              Venn &middot; Group travel, sorted.<br />
              <a href="https://venntravel.co.uk" style="color:#9ca3af; text-decoration:underline;">venntravel.co.uk</a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:12px; font-size:12px; line-height:18px; color:#9ca3af;">
              <a href="${unsubscribeUrl}" style="color:#9ca3af; text-decoration:underline;">Turn off these notifications</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
