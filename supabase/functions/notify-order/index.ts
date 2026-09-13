// Supabase Edge Function: notify-order
// Secrets: BREVO_API_KEY, BREVO_SENDER_EMAIL, BREVO_SENDER_NAME, ADMIN_EMAILS
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY');
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL') || 'futurifydesigns@gmail.com';
    const senderName = Deno.env.get('BREVO_SENDER_NAME') || 'Compustar Botswana';
    const body = await req.json();
    const order = body.order || {};
    const orderId = body.orderId || '';

    // Staff order alerts go to Compustar only (not the Brevo sender address)
    const staffEmails = parseEmails(
      body.adminEmail,
      body.adminEmails,
      Deno.env.get('ADMIN_EMAILS'),
      Deno.env.get('ADMIN_EMAIL'),
      'compustarbw@gmail.com'
    );

    const lines = (order.items || [])
      .map((item) => `${item.qty}× ${item.title}`)
      .join('<br/>');
    const textLines = (order.items || [])
      .map((item) => `• ${item.qty}× ${item.title}`)
      .join('\n');
    const fulfillmentDetail = order.fulfillment === 'pickup'
      ? `Pickup when: ${order.pickup_when || '—'}`
      : `Delivery address: ${order.delivery_address || '—'}`;

    const whatsappPhone = Deno.env.get('WHATSAPP_PHONE') || '26776004665';
    const whatsappText = [
      'New Compustar order request',
      `Ref: ${String(orderId).slice(0, 8).toUpperCase()}`,
      order.customer_name,
      order.customer_phone,
      order.customer_email,
      String(order.fulfillment || '').toUpperCase(),
      order.fulfillment === 'pickup' ? order.pickup_when : order.delivery_address,
      '',
      textLines,
      order.notes ? `\nNotes: ${order.notes}` : ''
    ].filter(Boolean).join('\n');
    const whatsappShareUrl = order.whatsapp_share_url
      || `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(whatsappText)}`;

    const html = `
      <h2>New Compustar order request</h2>
      <p><strong>Ref:</strong> ${orderId}</p>
      <p><strong>Name:</strong> ${order.customer_name}</p>
      <p><strong>Email:</strong> ${order.customer_email}</p>
      <p><strong>Phone:</strong> ${order.customer_phone}</p>
      <p><strong>Fulfillment:</strong> ${order.fulfillment}</p>
      <p>${fulfillmentDetail}</p>
      <p><strong>Notes:</strong> ${order.notes || '—'}</p>
      <p><strong>Items:</strong><br/>${lines}</p>
      <p><a href="${whatsappShareUrl}">Open this order on WhatsApp</a></p>
    `;

    if (!BREVO_API_KEY) {
      return new Response(JSON.stringify({ ok: false, error: 'BREVO_API_KEY missing' }), {
        status: 500,
        headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    // One staff email to Compustar + admin
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
        subject: `New order request — ${order.customer_name || 'Customer'}`,
        htmlContent: html
      })
    });
    if (!staffRes.ok) {
      throw new Error(`Brevo staff email error: ${await staffRes.text()}`);
    }

    // Customer confirmation copy
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
          subject: 'We received your Compustar order request',
          htmlContent: `
            <p>Hi ${order.customer_name || 'there'},</p>
            <p>Thanks for your order request. Compustar will confirm availability and contact you shortly.</p>
            <p><strong>Reference:</strong> ${String(orderId).slice(0, 8).toUpperCase()}</p>
            <p>${fulfillmentDetail}</p>
            <p>${lines}</p>
          `
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
