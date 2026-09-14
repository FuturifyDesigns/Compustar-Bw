/** Natural WhatsApp prefill for Compustar order requests. */
export function formatOrderWhatsApp({
  orderId = '',
  customer_name = '',
  customer_phone = '',
  customer_email = '',
  fulfillment = 'pickup',
  pickup_when = '',
  delivery_address = '',
  notes = '',
  items = []
}) {
  const ref = String(orderId || '').slice(0, 8).toUpperCase() || 'PENDING';
  const isPickup = String(fulfillment).toLowerCase() === 'pickup';
  const itemLines = (items || []).map((item) => {
    const qty = item.qty || 1;
    const title = item.title || 'Item';
    const price = item.price != null && item.price !== ''
      ? ` — ${item.currency || 'BWP'} ${item.price}`
      : '';
    return `• ${qty}× ${title}${price}`;
  });

  const lines = [
    'Hi Compustar,',
    '',
    'I would like to place an order request.',
    '',
    'Items:',
    ...(itemLines.length ? itemLines : ['• (No items listed)']),
    ''
  ];

  if (isPickup) {
    lines.push(`I prefer store pickup${pickup_when ? ` (${pickup_when})` : ''}.`);
  } else {
    lines.push(`I need delivery to: ${delivery_address || '—'}`);
  }

  lines.push(
    '',
    `Reference: ${ref}`,
    '',
    'My details:',
    customer_name || '—',
    customer_phone || '—',
    customer_email || '—'
  );

  if (notes && String(notes).trim()) {
    lines.push('', `Note: ${String(notes).trim()}`);
  }

  lines.push('', 'Please confirm availability and pricing. Thank you.');
  return lines.join('\n');
}

export const ORDER_STATUS_LABELS = {
  new: 'Received',
  confirmed: 'Confirmed',
  preparing: 'Being prepared',
  ready: 'Ready',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

export function orderStatusLabel(status) {
  return ORDER_STATUS_LABELS[status] || status || 'Received';
}
