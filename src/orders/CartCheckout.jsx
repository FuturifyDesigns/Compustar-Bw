import React, { useEffect, useMemo, useState } from 'react';
import { MapPin } from '@phosphor-icons/react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { requireAuthForCart } from '../auth/requireAuthForCart';
import { assertClientCooldown } from '../lib/clientSecurity';
import { formatOrderWhatsApp } from './formatOrderWhatsApp';

const whatsappPhone = '26776004665';

function go(path) {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function mediaSrc(item) {
  const src = item?.image_url || '';
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return `/products/${src}`;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function CartPage() {
  const { items, updateQty, removeItem, count } = useCart();
  const { user, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    requireAuthForCart(user, { nextPath: '/Cart' });
  }, [ready, user]);

  if (!ready || !user) {
    return (
      <section className="section cart-section">
        <div className="cart-wrap">
          <p className="account-lead">Redirecting to sign in…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section cart-section">
      <div className="cart-wrap">
        <p className="kicker">Order request cart</p>
        <h1>Your selected products</h1>
        <p className="account-lead">Add the products you need, then send an order request. Compustar will confirm availability.</p>
        {!count ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button type="button" className="button dark" onClick={() => go('/Products')}>Browse products</button>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.id} className="cart-row">
                  {mediaSrc(item) ? <img src={mediaSrc(item).replace(/\.(jpe?g|png)$/i, '.webp')} alt="" /> : <div className="cart-thumb" />}
                  <div>
                    <strong>{item.title}</strong>
                    {item.category ? <span>{item.category}</span> : null}
                    {item.price != null ? <span>{item.currency} {Number(item.price).toLocaleString()}</span> : <span>Price on request</span>}
                  </div>
                  <label className="cart-qty">
                    Qty
                    <input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.id, e.target.value)} />
                  </label>
                  <button type="button" className="button ghost-dark" onClick={() => removeItem(item.id)}>Remove</button>
                </li>
              ))}
            </ul>
            <div className="cart-actions">
              <button type="button" className="button dark" onClick={() => go('/Checkout')}>Continue to request</button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function CheckoutPage() {
  const { items, clearCart, count } = useCart();
  const { user, profile, ready } = useAuth();
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [touched, setTouched] = useState({});
  const [form, setForm] = useState({
    customer_name: profile?.full_name || '',
    customer_email: user?.email || profile?.email || '',
    customer_phone: profile?.phone || '',
    fulfillment: 'pickup',
    pickup_when: '',
    delivery_address: '',
    delivery_coords: '',
    notes: ''
  });

  useEffect(() => {
    if (!ready) return;
    requireAuthForCart(user, { nextPath: '/Checkout' });
  }, [ready, user]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      customer_name: prev.customer_name || profile?.full_name || '',
      customer_email: prev.customer_email || user?.email || profile?.email || '',
      customer_phone: prev.customer_phone || profile?.phone || ''
    }));
  }, [user, profile]);

  const fieldErrors = useMemo(() => {
    const next = {};
    if (!form.customer_name.trim()) next.customer_name = 'Full name is required.';
    if (!form.customer_email.trim()) next.customer_email = 'Email is required.';
    else if (!isValidEmail(form.customer_email.trim())) next.customer_email = 'Enter a valid email address.';
    if (!form.customer_phone.trim()) next.customer_phone = 'Phone is required.';
    else if (!isValidPhone(form.customer_phone.trim())) next.customer_phone = 'Enter a valid phone number.';
    if (form.fulfillment === 'pickup' && !form.pickup_when.trim()) {
      next.pickup_when = 'Tell us when you plan to collect.';
    }
    if (form.fulfillment === 'delivery' && !form.delivery_address.trim()) {
      next.delivery_address = 'Enter a delivery address or pin your location.';
    }
    return next;
  }, [form]);

  if (!ready || !user) {
    return (
      <section className="section cart-section">
        <div className="cart-wrap">
          <p className="account-lead">Redirecting to sign in…</p>
        </div>
      </section>
    );
  }

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function markTouched(field) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  async function pinCurrentLocation(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setError('');
    if (!navigator.geolocation) {
      setError('Location is not supported on this device. Please type your address.');
      return;
    }

    const scrollY = window.scrollY;
    setLocating(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000
        });
      });
      const { latitude, longitude } = position.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const address = [
        'Current location pinned',
        mapsUrl,
        `Coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
      ].join('\n');

      setForm((prev) => ({
        ...prev,
        fulfillment: 'delivery',
        delivery_address: address,
        delivery_coords: `${latitude},${longitude}`
      }));
      setTouched((prev) => ({ ...prev, delivery_address: true }));
      window.requestAnimationFrame(() => window.scrollTo(0, scrollY));
    } catch (err) {
      const denied = err?.code === 1;
      setError(denied
        ? 'Location permission was denied. Please type your delivery address.'
        : 'Could not get your location. Please type your delivery address.');
    } finally {
      setLocating(false);
      window.requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setTouched({
      customer_name: true,
      customer_email: true,
      customer_phone: true,
      pickup_when: true,
      delivery_address: true
    });
    if (!count) {
      setError('Add at least one product to your cart.');
      return;
    }
    if (Object.keys(fieldErrors).length) {
      setError('Please fix the highlighted fields.');
      return;
    }
    if (!supabaseConfigured || !supabase) {
      setError('Ordering is temporarily unavailable.');
      return;
    }
    const cooldown = assertClientCooldown('order-submit', 45_000);
    if (!cooldown.ok) {
      setError(cooldown.error);
      return;
    }

    setBusy(true);
    try {
      const payloadItems = items.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        price: item.price,
        currency: item.currency,
        qty: item.qty,
        image_url: item.image_url
      }));
      const deliveryText = form.fulfillment === 'delivery'
        ? form.delivery_address.trim()
        : '';
      const baseWhatsApp = {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim(),
        fulfillment: form.fulfillment,
        pickup_when: form.pickup_when.trim(),
        delivery_address: deliveryText,
        notes: form.notes.trim(),
        items: payloadItems
      };

      const row = {
        user_id: user?.id || null,
        customer_name: baseWhatsApp.customer_name,
        customer_email: baseWhatsApp.customer_email,
        customer_phone: baseWhatsApp.customer_phone,
        fulfillment: form.fulfillment,
        pickup_when: form.fulfillment === 'pickup' ? form.pickup_when.trim() : '',
        delivery_address: deliveryText,
        notes: form.notes.trim(),
        status: 'new',
        items: payloadItems,
        whatsapp_share_url: ''
      };

      const { data, error: insertError } = await supabase.from('orders').insert(row).select('id').single();
      if (insertError) throw insertError;

      const whatsapp_share_url = `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        formatOrderWhatsApp({ ...baseWhatsApp, orderId: data.id })
      )}`;
      await supabase.from('orders').update({ whatsapp_share_url }).eq('id', data.id);
      row.whatsapp_share_url = whatsapp_share_url;

      try {
        await supabase.functions.invoke('notify-order', {
          body: {
            orderId: data.id,
            order: row
          }
        });
      } catch {
        /* order is saved even if notify fails */
      }

      clearCart();
      setDone({ id: data.id, whatsapp_share_url });
      window.setTimeout(() => {
        window.open(whatsapp_share_url, '_blank', 'noopener,noreferrer');
      }, 250);
    } catch (err) {
      setError(err.message || 'Could not submit order request');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <section className="section cart-section">
        <div className="cart-wrap">
          <p className="kicker">Request sent</p>
          <h1>Order request submitted.</h1>
          <p className="account-lead">
            Compustar was emailed at compustarbw@gmail.com.
            WhatsApp also opened with your order — tap <strong>Send</strong> so it arrives on chat too.
            Reference: {done.id.slice(0, 8).toUpperCase()}
          </p>
          <div className="cart-actions">
            <a className="button dark" href={done.whatsapp_share_url} target="_blank" rel="noreferrer">Open WhatsApp again</a>
            <button type="button" className="button secondary-dark" onClick={() => go('/Products')}>Back to products</button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="section cart-section checkout-section">
      <div className="cart-wrap checkout-wrap">
        <div className="checkout-head">
          <p className="kicker">Checkout</p>
          <h1>Submit an order request</h1>
          <p className="account-lead">Compustar will confirm pickup or delivery after reviewing your request.</p>
        </div>
        {!count ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button type="button" className="button dark" onClick={() => go('/Products')}>Browse products</button>
          </div>
        ) : (
          <form className="checkout-form checkout-form--compact" onSubmit={submit} noValidate>
            <aside className="checkout-summary">
              <strong>{count} item{count === 1 ? '' : 's'} in cart</strong>
              <ul className="checkout-summary-list">
                {items.map((item) => {
                  const src = mediaSrc(item);
                  const img = src ? src.replace(/\.(jpe?g|png)$/i, '.webp') : '';
                  return (
                    <li key={item.id} className="checkout-summary-item">
                      {img ? <img src={img} alt="" /> : <div className="checkout-summary-thumb" aria-hidden="true" />}
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.qty}×{item.price != null ? ` · ${item.currency} ${Number(item.price).toLocaleString()}` : ''}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="button ghost-dark" onClick={() => go('/Cart')}>Edit cart</button>
            </aside>

            <div className="checkout-fields">
              <div className="checkout-form-row">
                <label className={touched.customer_name && fieldErrors.customer_name ? 'has-error' : ''}>
                  <span className="label-text">Full name <span className="req">*</span></span>
                  <input
                    value={form.customer_name}
                    onChange={update('customer_name')}
                    onBlur={() => markTouched('customer_name')}
                    autoComplete="name"
                    required
                  />
                  {touched.customer_name && fieldErrors.customer_name ? <span className="field-error">{fieldErrors.customer_name}</span> : null}
                </label>
                <label className={touched.customer_phone && fieldErrors.customer_phone ? 'has-error' : ''}>
                  <span className="label-text">Phone <span className="req">*</span></span>
                  <input
                    value={form.customer_phone}
                    onChange={update('customer_phone')}
                    onBlur={() => markTouched('customer_phone')}
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+267…"
                    required
                  />
                  {touched.customer_phone && fieldErrors.customer_phone ? <span className="field-error">{fieldErrors.customer_phone}</span> : null}
                </label>
              </div>

              <label className={touched.customer_email && fieldErrors.customer_email ? 'has-error' : ''}>
                <span className="label-text">Email <span className="req">*</span></span>
                <input
                  type="email"
                  value={form.customer_email}
                  onChange={update('customer_email')}
                  onBlur={() => markTouched('customer_email')}
                  autoComplete="email"
                  required
                />
                {touched.customer_email && fieldErrors.customer_email ? <span className="field-error">{fieldErrors.customer_email}</span> : null}
              </label>

              <div className="fulfillment-field">
                <span className="label-text">Fulfillment <span className="req">*</span></span>
                <div className="fulfillment-options" role="radiogroup" aria-label="Fulfillment">
                  <button
                    type="button"
                    className={form.fulfillment === 'pickup' ? 'active' : ''}
                    aria-pressed={form.fulfillment === 'pickup'}
                    onClick={() => setForm((p) => ({ ...p, fulfillment: 'pickup' }))}
                  >
                    Pickup
                  </button>
                  <button
                    type="button"
                    className={form.fulfillment === 'delivery' ? 'active' : ''}
                    aria-pressed={form.fulfillment === 'delivery'}
                    onClick={() => setForm((p) => ({ ...p, fulfillment: 'delivery' }))}
                  >
                    Delivery
                  </button>
                </div>
              </div>

              {form.fulfillment === 'pickup' ? (
                <label className={touched.pickup_when && fieldErrors.pickup_when ? 'has-error' : ''}>
                  <span className="label-text">When do you plan to collect? <span className="req">*</span></span>
                  <input
                    value={form.pickup_when}
                    onChange={update('pickup_when')}
                    onBlur={() => markTouched('pickup_when')}
                    placeholder="e.g. Tomorrow afternoon"
                    required
                  />
                  {touched.pickup_when && fieldErrors.pickup_when ? <span className="field-error">{fieldErrors.pickup_when}</span> : null}
                </label>
              ) : (
                <div className={`delivery-block${touched.delivery_address && fieldErrors.delivery_address ? ' has-error' : ''}`}>
                  <div className="delivery-head">
                    <span className="label-text">Delivery address <span className="req">*</span></span>
                    <button
                      type="button"
                      className="button secondary-dark pin-location-btn"
                      onClick={pinCurrentLocation}
                      disabled={locating}
                    >
                      <MapPin size={16} weight="fill" />
                      {locating ? 'Locating…' : 'Pin my location'}
                    </button>
                  </div>
                  <textarea
                    value={form.delivery_address}
                    onChange={update('delivery_address')}
                    onBlur={() => markTouched('delivery_address')}
                    rows={3}
                    placeholder="Street, area, landmark — or pin your current location"
                    required
                  />
                  {form.delivery_coords ? (
                    <p className="delivery-pin-note">Location pinned. You can still edit the address above.</p>
                  ) : null}
                  {touched.delivery_address && fieldErrors.delivery_address ? (
                    <span className="field-error">{fieldErrors.delivery_address}</span>
                  ) : null}
                </div>
              )}

              <label>
                <span className="label-text">Notes <span className="optional">(optional)</span></span>
                <textarea value={form.notes} onChange={update('notes')} rows={2} placeholder="Anything else we should know?" />
              </label>

              {error && <p className="cms-error">{error}</p>}
              <button className="button dark" type="submit" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit order request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
