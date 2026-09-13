/**
 * Compustar branded HTML email helpers for Edge Functions / docs.
 * Auth templates are applied to Supabase via scripts/apply-email-templates.mjs
 */

export function emailShell({ title, preheader = '', bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111318;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e9ef;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="background:#111318;padding:22px 28px;border-bottom:4px solid #ef1717;">
              <p style="margin:0;color:#f6c84d;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Compustar Botswana</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;line-height:1.25;font-weight:700;">${title}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #eef1f5;color:#69727f;font-size:12px;line-height:1.5;">
              Compustar Botswana · Game City Mall &amp; G-West Industrial, Gaborone<br/>
              <a href="https://compustar.co.bw" style="color:#98080f;text-decoration:none;">compustar.co.bw</a>
              · WhatsApp <a href="https://wa.me/26776004665" style="color:#98080f;text-decoration:none;">+267 7600 4665</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function ctaButton(href, label) {
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 8px;">
  <tr>
    <td style="background:#111318;border-radius:10px;">
      <a href="${href}" style="display:inline-block;padding:12px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${label}</a>
    </td>
  </tr>
</table>
<p style="margin:0;color:#69727f;font-size:12px;line-height:1.5;">If the button does not work, copy and paste this link into your browser:<br/><a href="${href}" style="color:#98080f;word-break:break-all;">${href}</a></p>`;
}
