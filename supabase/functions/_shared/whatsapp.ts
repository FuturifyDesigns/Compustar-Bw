/** Optional WhatsApp Cloud API helper for staff order alerts. */
export async function sendWhatsAppStaffAlert({
  text,
  customerPhone = ''
}: {
  text: string;
  customerPhone?: string;
}) {
  const token = Deno.env.get('WHATSAPP_TOKEN') || Deno.env.get('WHATSAPP_ACCESS_TOKEN') || '';
  const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
  const notifyTo = (Deno.env.get('WHATSAPP_NOTIFY_TO') || Deno.env.get('WHATSAPP_PHONE') || '')
    .replace(/\D/g, '');
  const templateName = Deno.env.get('WHATSAPP_ORDER_TEMPLATE') || '';
  const templateLang = Deno.env.get('WHATSAPP_ORDER_TEMPLATE_LANG') || 'en';

  if (!token || !phoneNumberId || !notifyTo) {
    return { ok: false as const, skipped: true as const, detail: 'WhatsApp Cloud API not configured' };
  }

  const bodyText = String(text || '').slice(0, 3500);
  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  // Prefer approved template (required for business-initiated chats).
  if (templateName) {
    const payload = {
      messaging_product: 'whatsapp',
      to: notifyTo,
      type: 'template',
      template: {
        name: templateName,
        language: { code: templateLang },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: bodyText.slice(0, 900) || 'New order request' },
              { type: 'text', text: String(customerPhone || '—').slice(0, 60) }
            ]
          }
        ]
      }
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      return { ok: false as const, skipped: false as const, detail: await res.text() };
    }
    return { ok: true as const, skipped: false as const, detail: '' };
  }

  // Free-form text only works inside an open customer-care window.
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: notifyTo,
      type: 'text',
      text: { body: bodyText, preview_url: false }
    })
  });
  if (!res.ok) {
    return { ok: false as const, skipped: false as const, detail: await res.text() };
  }
  return { ok: true as const, skipped: false as const, detail: '' };
}
