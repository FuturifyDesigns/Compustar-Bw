import React, { useEffect, useState } from 'react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { useCart } from '../cart/CartContext';
import { useAuth } from '../auth/AuthContext';
import { requireAuthForCart } from '../auth/requireAuthForCart';
import { formatOrderWhatsApp } from './formatOrderWhatsApp';

const whatsappPhone = '26776004665';
const staffNotifyEmails = ['compustarbw@gmail.com'];

function go(path) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function mediaSrc(item) {
  const src = item?.image_url || '';
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return `/products/${src}`;
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
        <div className="cart-wrap" data-reveal>
          <p className="account-lead">Redirecting to sign in…</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section cart-section">
      <div className="cart-wrap" data-reveal>
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
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const [form, setForm] = useState({
    customer_name: profile?.full_name || '',
    customer_email: user?.email || profile?.email || '',
    customer_phone: profile?.phone || '',
    fulfillment: 'pickup',
    pickup_when: '',
    delivery_address: '',
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

  if (!ready || !user) {
    return (
      <section className="section cart-section">
        <div className="cart-wrap" data-reveal>
          <p className="account-lead">Redirecting to sign in…</p>
        </div>
      </section>
    );
  }

  function update(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!count) {
      setError('Add at least one product to your cart.');
      return;
    }
    if (form.fulfillment === 'pickup' && !form.pickup_when.trim()) {
      setError('Please say when you plan to collect.');
      return;
    }
    if (form.fulfillment === 'delivery' && !form.delivery_address.trim()) {
      setError('Please enter a delivery address.');
      return;
    }
    if (!supabaseConfigured || !supabase) {
      setError('Ordering is temporarily unavailable.');
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
      const baseWhatsApp = {
        customer_name: form.customer_name.trim(),
        customer_phone: form.customer_phone.trim(),
        customer_email: form.customer_email.trim(),
        fulfillment: form.fulfillment,
        pickup_when: form.pickup_when.trim(),
        delivery_address: form.delivery_address.trim(),
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
        delivery_address: form.fulfillment === 'delivery' ? form.delivery_address.trim() : '',
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

      // Notify via Edge Function (Brevo email + WhatsApp share link). Fails soft if not deployed.
      try {
        await supabase.functions.invoke('notify-order', {
          body: {
            orderId: data.id,
            adminEmails: staffNotifyEmails,
            order: row
          }
        });
      } catch {
        /* order is saved even if notify fails */
      }

      clearCart();
      setDone({ id: data.id, whatsapp_share_url });
      // Open WhatsApp so Compustar also gets the order on chat — customer taps Send
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
        <div className="cart-wrap" data-reveal>
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
    <section className="section cart-section">
      <div className="cart-wrap checkout-wrap" data-reveal>
        <p className="kicker">Checkout</p>
        <h1>Submit an order request</h1>
        <p className="account-lead">Compustar will review your request and confirm pickup or delivery.</p>
        {!count ? (
          <div className="cart-empty">
            <p>Your cart is empty.</p>
            <button type="button" className="button dark" onClick={() => go('/Products')}>Browse products</button>
          </div>
        ) : (
          <form className="checkout-form" onSubmit={submit}>
            <div className="checkout-summary">
              <strong>{count} item{count === 1 ? '' : 's'} in request</strong>
              <ul>
                {items.map((item) => (
                  <li key={item.id}>{item.qty}× {item.title}</li>
                ))}
              </ul>
            </div>
            <label>Full name<input value={form.customer_name} onChange={update('customer_name')} required /></label>
            <label>Email<input type="email" value={form.customer_email} onChange={update('customer_email')} required /></label>
            <label>Phone<input value={form.customer_phone} onChange={update('customer_phone')} required /></label>
            <fieldset className="fulfillment-field">
              <legend>Fulfillment</legend>
              <label className="radio-row">
                <input type="radio" name="fulfillment" checked={form.fulfillment === 'pickup'} onChange={() => setForm((p) => ({ ...p, fulfillment: 'pickup' }))} />
                Pickup
              </label>
              <label className="radio-row">
                <input type="radio" name="fulfillment" checked={form.fulfillment === 'delivery'} onChange={() => setForm((p) => ({ ...p, fulfillment: 'delivery' }))} />
                Delivery
              </label>
            </fieldset>
            {form.fulfillment === 'pickup' ? (
              <label>When do you plan to collect?<input value={form.pickup_when} onChange={update('pickup_when')} placeholder="e.g. Tomorrow afternoon" required /></label>
            ) : (
              <label>Delivery address<textarea value={form.delivery_address} onChange={update('delivery_address')} rows={3} required /></label>
            )}
            <label>Notes (optional)<textarea value={form.notes} onChange={update('notes')} rows={3} /></label>
            {error && <p className="cms-error">{error}</p>}
            <button className="button dark" type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit order request'}</button>
          </form>
        )}
      </div>
    </section>
  );
}
