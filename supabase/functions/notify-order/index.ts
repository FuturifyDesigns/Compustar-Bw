// Supabase Edge Function: notify-order
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

function formatWhatsApp(order, orderId) {
  const ref = String(orderId || '').slice(0, 8).toUpperCase() || 'PENDING';
  const isPickup = String(order.fulfillment || '').toLowerCase() === 'pickup';
  const itemLines = (order.items || []).map((item, i) => {
    const qty = item.qty || 1;
    const title = item.title || 'Item';
    const price = item.price != null && item.price !== ''
      ? ` — ${item.currency || 'BWP'} ${item.price}`
      : '';
    return `${i + 1}. ${qty}× ${title}${price}`;
  });

  const lines = [
    '*Compustar Botswana — Order Request*',
    `Reference: *${ref}*`,
    '',
    '*Customer*',
    `Name: ${order.customer_name || '—'}`,
    `Phone: ${order.customer_phone || '—'}`,
    `Email: ${order.customer_email || '—'}`,
    '',
    '*Fulfillment*',
    isPickup ? 'Type: Store pickup' : 'Type: Delivery',
    isPickup
      ? `Collect when: ${order.pickup_when || '—'}`
      : `Delivery address: ${order.delivery_address || '—'}`,
    '',
    '*Items*',
    ...(itemLines.length ? itemLines : ['(No items listed)'])
  ];

  if (order.notes && String(order.notes).trim()) {
    lines.push('', '*Notes*', String(order.notes).trim());
  }

  lines.push('', '_Please confirm availability and quote._');
  return lines.join('\n');
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
            · WhatsApp <a href="https://wa.me/26776004665" style="color:#98080f;text-decoration:none;">+267 7600 4665</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTable(items) {
  const rows = (items || []).map((item) => {
    const qty = escapeHtml(item.qty || 1);
    const title = escapeHtml(item.title || 'Item');
    const price = item.price != null && item.price !== ''
      ? `${escapeHtml(item.currency || 'BWP')} ${escapeHtml(item.price)}`
      : '—';
    return `<tr>
      <td style="padding:10px 12px;border-bottom:1px solid #eef1f5;font-size:14px;">${title}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef1f5;font-size:14px;text-align:center;white-space:nowrap;">${qty}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #eef1f5;font-size:14px;text-align:right;white-space:nowrap;">${price}</td>
    </tr>`;
  }).join('');

  if (!rows) {
    return `<p style="margin:0;color:#69727f;font-size:14px;">No items listed.</p>`;
  }

  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e6e9ef;border-radius:10px;overflow:hidden;margin:8px 0 0;">
    <tr style="background:#f8f9fb;">
      <th align="left" style="padding:10px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#69727f;">Item</th>
      <th align="center" style="padding:10px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#69727f;">Qty</th>
      <th align="right" style="padding:10px 12px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#69727f;">Price</th>
    </tr>
    ${rows}
  </table>`;
}

function detailRow(label, value) {
  return `<tr>
    <td style="padding:8px 0;width:120px;vertical-align:top;color:#69727f;font-size:13px;">${escapeHtml(label)}</td>
    <td style="padding:8px 0;font-size:14px;font-weight:600;color:#111318;">${value}</td>
  </tr>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'futurifydesigns@gmail.com';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Compustar Botswana';
    const body = await req.json();
    const order = body.order || {};
    const orderId = body.orderId || '';
    const ref = String(orderId).slice(0, 8).toUpperCase() || '—';
    const isPickup = String(order.fulfillment || '').toLowerCase() === 'pickup';

    const staffEmails = parseEmails(
      body.adminEmail,
      body.adminEmails,
      Deno.env.get('ADMIN_EMAILS'),
      Deno.env.get('ADMIN_EMAIL'),
      'compustarbw@gmail.com'
    );

    const fulfillmentLabel = isPickup ? 'Store pickup' : 'Delivery';
    const fulfillmentDetail = isPickup
      ? escapeHtml(order.pickup_when || '—')
      : escapeHtml(order.delivery_address || '—');
    const fulfillmentDetailLabel = isPickup ? 'Collect when' : 'Delivery address';

    const whatsappPhone = Deno.env.get('WHATSAPP_PHONE') || '26776004665';
    const whatsappText = formatWhatsApp(order, orderId);
    const whatsappShareUrl = order.whatsapp_share_url
      || `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;

    const detailsTable = `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 18px;">
        ${detailRow('Reference', `<span style="font-family:ui-monospace,Consolas,monospace;letter-spacing:.04em;">${escapeHtml(ref)}</span>`)}
        ${detailRow('Name', escapeHtml(order.customer_name || '—'))}
        ${detailRow('Email', `<a href="mailto:${escapeHtml(order.customer_email || '')}" style="color:#98080f;text-decoration:none;">${escapeHtml(order.customer_email || '—')}</a>`)}
        ${detailRow('Phone', `<a href="tel:${escapeHtml(order.customer_phone || '')}" style="color:#98080f;text-decoration:none;">${escapeHtml(order.customer_phone || '—')}</a>`)}
        ${detailRow('Fulfillment', escapeHtml(fulfillmentLabel))}
        ${detailRow(fulfillmentDetailLabel, fulfillmentDetail)}
        ${order.notes ? detailRow('Notes', escapeHtml(order.notes)) : ''}
      </table>
    `;

    const staffHtml = emailShell({
      title: 'New order request',
      preheader: `Order ${ref} from ${order.customer_name || 'customer'}`,
      bodyHtml: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">A customer submitted an order request on compustar.co.bw.</p>
        ${detailsTable}
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#69727f;">Requested items</p>
        ${itemsTable(order.items)}
        <table role="presentation" cellspacing="0" cellpadding="0" style="margin:22px 0 0;">
          <tr>
            <td style="background:#111318;border-radius:10px;">
              <a href="${escapeHtml(whatsappShareUrl)}" style="display:inline-block;padding:12px 18px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">Open on WhatsApp</a>
            </td>
          </tr>
        </table>
      `
    });

    const customerHtml = emailShell({
      title: 'We received your request',
      preheader: `Your Compustar order reference is ${ref}`,
      bodyHtml: `
        <p style="margin:0 0 12px;font-size:15px;line-height:1.55;">Hi ${escapeHtml(order.customer_name || 'there')},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.55;">Thanks for your order request. Compustar will confirm availability and contact you shortly. This is not a payment receipt.</p>
        ${detailsTable}
        <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#69727f;">Your items</p>
        ${itemsTable(order.items)}
        <p style="margin:20px 0 0;font-size:13px;line-height:1.55;color:#69727f;">Questions? WhatsApp us on <a href="https://wa.me/26776004665" style="color:#98080f;text-decoration:none;">+267 7600 4665</a>.</p>
      `
    });

    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'BREVO_API_KEY missing' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const staffRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: staffEmails.map((email) => ({ email })),
        subject: `New order request · ${ref} · ${order.customer_name || 'Customer'}`,
        htmlContent: staffHtml
      })
    });
    if (!staffRes.ok) {
      throw new Error(`Brevo staff email error: ${await staffRes.text()}`);
    }

    if (order.customer_email) {
      const customerRes = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'api-key': BREVO_API_KEY
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: order.customer_email, name: order.customer_name || 'Customer' }],
          subject: `Order request received · ${ref}`,
          htmlContent: customerHtml
        })
      });
      if (!customerRes.ok) {
        throw new Error(`Brevo customer email error: ${await customerRes.text()}`);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      staffEmails,
      whatsappShareUrl
    }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: String(error?.message || error) }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' }
    });
  }
});
