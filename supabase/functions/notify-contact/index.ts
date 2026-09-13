// Supabase Edge Function: notify-contact
// Secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, ADMIN_EMAILS
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function parseEmails(...chunks) {
  const set = new Set();
  for (const chunk of chunks) {
    String(chunk || '')
      .split(/[,;\s]+/)
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
      .forEach((email) => set.add(email));
  }
  return [...set];
}

function emailShell({ title, preheader = '', bodyHtml }) {
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'futurifydesigns@gmail.com';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Compustar Botswana';
    const body = await req.json();

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const subject = String(body.subject || 'Website enquiry').trim() || 'Website enquiry';
    const message = String(body.message || '').trim();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ ok: false, error: 'Name, email, and message are required.' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const staffEmails = parseEmails(
      body.adminEmail,
      body.adminEmails,
      Deno.env.get('ADMIN_EMAILS'),
      Deno.env.get('ADMIN_EMAIL'),
      'compustarbw@gmail.com'
    );

    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'BREVO_API_KEY missing' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

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

    const staffRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: staffEmails.map((addr) => ({ email: addr })),
        replyTo: { email, name },
        subject: `Contact · ${subject} · ${name}`,
        htmlContent: staffHtml
      })
    });
    if (!staffRes.ok) {
      throw new Error(`Brevo staff email error: ${await staffRes.text()}`);
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

    await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email, name }],
        subject: 'We received your Compustar enquiry',
        htmlContent: customerHtml
      })
    });

    return new Response(JSON.stringify({ ok: true, staffEmails }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
});
