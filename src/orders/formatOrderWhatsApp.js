/** Professional WhatsApp prefill for Compustar order requests. */
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
  const itemLines = (items || []).map((item, i) => {
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
    `Name: ${customer_name || '—'}`,
    `Phone: ${customer_phone || '—'}`,
    `Email: ${customer_email || '—'}`,
    '',
    '*Fulfillment*',
    isPickup ? 'Type: Store pickup' : 'Type: Delivery',
    isPickup
      ? `Collect when: ${pickup_when || '—'}`
      : `Delivery address: ${delivery_address || '—'}`,
    '',
    '*Items*',
    ...(itemLines.length ? itemLines : ['(No items listed)'])
  ];

  if (notes && String(notes).trim()) {
    lines.push('', '*Notes*', String(notes).trim());
  }

  lines.push('', '_Please confirm availability and quote._');
  return lines.join('\n');
}
