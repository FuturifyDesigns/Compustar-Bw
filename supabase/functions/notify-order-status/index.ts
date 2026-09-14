// Secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import {
  clampText,
  corsHeaders,
  escapeHtml,
  isValidEmail,
  jsonResponse,
  readJsonBody
} from '../_shared/security.ts';
import { sendTransactionalEmail } from '../_shared/email.ts';

const STATUS_LABELS: Record<string, string> = {
  new: 'Received',
  confirmed: 'Confirmed',
  preparing: 'Being prepared',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

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
            · WhatsApp <a href="https://wa.me/26776004665" style="color:#98080f;text-decoration:none;">+267 7600 4665</a>
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
    const parsed = await readJsonBody(req, 20_000);
    if (!parsed.ok) return jsonResponse(req, { ok: false, error: parsed.error }, 400);
    const body = parsed.body;

    const authHeader = req.headers.get('Authorization') || '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    if (!authHeader || !supabaseUrl || !anonKey) {
      return jsonResponse(req, { ok: false, error: 'Unauthorized' }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return jsonResponse(req, { ok: false, error: 'Sign in required' }, 401);
    }

    const { data: profile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .maybeSingle();
    if (profile?.role !== 'admin') {
      return jsonResponse(req, { ok: false, error: 'Admin only' }, 403);
    }

    const orderId = clampText(body.orderId, 80);
    const status = clampText(body.status, 40).toLowerCase();
    const statusNote = clampText(body.statusNote, 2000);
    const customerEmail = clampText(body.customerEmail, 254).toLowerCase();
    const customerName = clampText(body.customerName, 120) || 'there';

    if (!orderId || !STATUS_LABELS[status]) {
      return jsonResponse(req, { ok: false, error: 'Invalid order or status' }, 400);
    }
    if (!customerEmail || !isValidEmail(customerEmail)) {
      return jsonResponse(req, { ok: false, error: 'Invalid customer email' }, 400);
    }

    const ref = orderId.slice(0, 8).toUpperCase();
    const statusLabel = STATUS_LABELS[status];
    const noteBlock = statusNote
      ? `<p style="margin:16px 0 0;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#69727f;">Note from Compustar</p>
         <div style="background:#f8f9fb;border:1px solid #e6e9ef;border-radius:10px;padding:14px 16px;font-size:14px;line-height:1.6;white-space:pre-wrap;margin-top:6px;">${escapeHtml(statusNote)}</div>`
      : '';

    const html = emailShell({
      title: `Order update · ${statusLabel}`,
      preheader: `Request ${ref} is now ${statusLabel}`,
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">Hi ${escapeHtml(customerName)},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Your Compustar order request <strong>${escapeHtml(ref)}</strong> is now <strong>${escapeHtml(statusLabel)}</strong>.</p>
        ${noteBlock}
        <p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:#69727f;">Questions? WhatsApp us on <a href="https://wa.me/26776004665" style="color:#98080f;text-decoration:none;">+267 7600 4665</a>.</p>
      `
    });

    const sent = await sendTransactionalEmail({
      to: [{ email: customerEmail, name: customerName }],
      subject: `Order ${ref} update · ${statusLabel}`,
      html,
      kind: 'order_status',
      meta: { orderId, status }
    });

    if (!sent.ok) {
      return jsonResponse(req, { ok: false, error: 'Could not email customer', detail: sent.detail }, 502);
    }

    return jsonResponse(req, { ok: true, emailMode: sent.mode || 'api' });
  } catch (error) {
    console.error(error);
    return jsonResponse(req, { ok: false, error: 'Unexpected error' }, 500);
  }
});
