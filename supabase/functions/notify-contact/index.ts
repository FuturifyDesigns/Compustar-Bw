// Secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, ADMIN_EMAILS
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import {
  clampText,
  corsHeaders,
  enforceRateLimit,
  escapeHtml,
  isHoneypotTripped,
  isValidEmail,
  jsonResponse,
  parseStaffEmails,
  readJsonBody
} from '../_shared/security.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

function emailShell({ title, preheader = '', bodyHtml }: { title: string; preheader?: string; bodyHtml: string }) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111318;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:28px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e6e9ef;border-radius:14px;overflow:hidden;">
        <tr>
          <td style="background:#111318;padding:22px 28px;border-bottom:4px solid #ef1717;">
            <p style="margin:0;color:#f6c84d;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Compustar Botswana</p>
            <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;line-height:1.3;font-weight:700;">${escapeHtml(title)}</h1>
          </td>
        </tr>
        <tr><td style="padding:28px;">${bodyHtml}</td></tr>
        <tr>
          <td style="padding:16px 28px 24px;border-top:1px solid #eef1f5;color:#69727f;font-size:12px;line-height:1.55;">
            Compustar Botswana · Game City Mall &amp; G-West Industrial, Gaborone<br/>
            <a href="https://compustar.co.bw" style="color:#98080f;text-decoration:none;">compustar.co.bw</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return jsonResponse(req, { ok: false, error: 'Method not allowed' }, 405);

  try {
    const parsed = await readJsonBody(req, 12_000);
    if (!parsed.ok) return jsonResponse(req, { ok: false, error: parsed.error }, 400);
    const body = parsed.body;

    if (isHoneypotTripped(body)) {
      return jsonResponse(req, { ok: true });
    }

    const name = clampText(body.name, 120);
    const email = clampText(body.email, 254).toLowerCase();
    const phone = clampText(body.phone, 40);
    const subject = clampText(body.subject, 140) || 'Website enquiry';
    const message = clampText(body.message, 4000);

    if (!name || !email || !message) {
      return jsonResponse(req, { ok: false, error: 'Name, email, and message are required.' }, 400);
    }
    if (!isValidEmail(email)) {
      return jsonResponse(req, { ok: false, error: 'Enter a valid email address.' }, 400);
    }

    const limited = await enforceRateLimit(req, 'contact', 5, 3600, email);
    if (!limited.ok) return jsonResponse(req, { ok: false, error: limited.error }, 429);

    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    if (!BREVO_API_KEY) {
      return jsonResponse(req, { ok: false, error: 'Email service unavailable' }, 500);
    }

    // Never trust client-provided staff recipient lists
    const staffEmails = parseStaffEmails(
      Deno.env.get('ADMIN_EMAILS'),
      Deno.env.get('ADMIN_EMAIL'),
      'compustarbw@gmail.com'
    );

    const staffHtml = emailShell({
      title: 'New website enquiry',
      preheader: `${name}: ${subject}`,
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">A visitor sent a message from the Compustar contact form.</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
          <tr><td style="padding:8px 0;width:110px;color:#69727f;font-size:13px;">Name</td><td style="padding:8px 0;font-size:14px;font-weight:600;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#69727f;font-size:13px;">Email</td><td style="padding:8px 0;font-size:14px;font-weight:600;"><a href="mailto:${escapeHtml(email)}" style="color:#98080f;text-decoration:none;">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#69727f;font-size:13px;">Phone</td><td style="padding:8px 0;font-size:14px;font-weight:600;">${escapeHtml(phone || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#69727f;font-size:13px;">Subject</td><td style="padding:8px 0;font-size:14px;font-weight:600;">${escapeHtml(subject)}</td></tr>
        </table>
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#69727f;">Message</p>
        <div style="background:#f8f9fb;border:1px solid #e6e9ef;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
      `
    });

    const staffSend = await sendTransactionalEmail({
      to: staffEmails.map((addr) => ({ email: addr })),
      replyTo: { email, name },
      subject: `Contact · ${subject} · ${name}`.slice(0, 200),
      html: staffHtml,
      kind: 'contact_staff'
    });
    if (!staffSend.ok) {
      console.error('Brevo staff email error', staffSend.detail);
      return jsonResponse(req, { ok: false, error: 'Could not send message right now.' }, 502);
    }

    const customerHtml = emailShell({
      title: 'We received your message',
      preheader: 'Compustar will get back to you shortly.',
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Thanks for contacting Compustar Botswana. We received your enquiry and will respond as soon as we can.</p>
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#69727f;">Your message</p>
        <div style="background:#f8f9fb;border:1px solid #e6e9ef;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</div>
      `
    });

    await sendTransactionalEmail({
      to: [{ email, name }],
      subject: 'We received your Compustar enquiry',
      html: customerHtml,
      kind: 'contact_customer'
    });

    return jsonResponse(req, { ok: true, emailMode: staffSend.mode || 'api' });
  } catch (error) {
    console.error(error);
    return jsonResponse(req, { ok: false, error: 'Unexpected error' }, 500);
  }
});
