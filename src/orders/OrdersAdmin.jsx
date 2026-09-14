import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../cms/AdminContext';
import { orderStatusLabel } from './formatOrderWhatsApp';

const STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

export function OrdersAdminPanel() {
  const { isAdmin } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveNote, setLiveNote] = useState('');
  const knownIds = useRef(new Set());

  async function load({ silent = false } = {}) {
    if (!supabase || !isAdmin) return;
    if (!silent) setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (err) {
      setError(err.message);
    } else {
      const rows = data || [];
      const nextIds = new Set(rows.map((row) => row.id));
      const isFirst = knownIds.current.size === 0;
      if (!isFirst) {
        const fresh = rows.filter((row) => !knownIds.current.has(row.id));
        if (fresh.length) {
          setLiveNote(`${fresh.length} new order request${fresh.length > 1 ? 's' : ''} received`);
          window.setTimeout(() => setLiveNote(''), 4000);
        }
      }
      knownIds.current = nextIds;
      setOrders(rows);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return undefined;
    }
    load().catch(console.error);
    if (!supabase) return undefined;

    const channel = supabase
      .channel(`orders-admin-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          setOrders((prev) => {
            if (prev.some((row) => row.id === payload.new.id)) return prev;
            return [payload.new, ...prev];
          });
          knownIds.current.add(payload.new.id);
          setLiveNote('New order request received');
          window.setTimeout(() => setLiveNote(''), 4000);
        } else if (payload.eventType === 'UPDATE' && payload.new) {
          setOrders((prev) => prev.map((row) => (row.id === payload.new.id ? payload.new : row)));
        } else if (payload.eventType === 'DELETE' && payload.old?.id) {
          setOrders((prev) => prev.filter((row) => row.id !== payload.old.id));
          knownIds.current.delete(payload.old.id);
        }
        load({ silent: true }).catch(console.error);
      })
      .subscribe();

    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') load({ silent: true }).catch(console.error);
    }, 12000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') load({ silent: true }).catch(console.error);
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  async function updateStatus(id, status) {
    const { error: err } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (err) {
      setError(err.message);
      return;
    }
    setOrders((prev) => prev.map((row) => (row.id === id ? { ...row, status } : row)));
  }

  if (!isAdmin) return null;

  return (
    <section className="orders-admin">
      <div className="orders-admin-head">
        <div>
          <p className="kicker">Order management</p>
          <h2>Customer order requests</h2>
          <p className="account-lead">Updates live as customers submit requests — no refresh needed.</p>
        </div>
        <button type="button" className="button dark" onClick={() => load()}>Refresh</button>
      </div>
      {liveNote ? <p className="orders-live-note" role="status">{liveNote}</p> : null}
      {loading && <p className="orders-empty">Loading orders…</p>}
      {error && <p className="cms-error">{error}</p>}
      {!loading && !orders.length && (
        <div className="orders-empty-card">
          <strong>No order requests yet</strong>
          <p>When customers submit a cart request on the website, they will show up here automatically.</p>
        </div>
      )}
      <div className="orders-list">
        {orders.map((order) => (
          <article key={order.id} className="order-card">
            <header>
              <div>
                <strong>{order.customer_name}</strong>
                <span className={`order-status status-${order.status}`}>{orderStatusLabel(order.status)}</span>
              </div>
              <time>{new Date(order.created_at).toLocaleString()}</time>
            </header>
            <p>{order.customer_email} · {order.customer_phone}</p>
            <p>
              <strong>{order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}:</strong>{' '}
              {order.fulfillment === 'pickup' ? order.pickup_when : order.delivery_address}
            </p>
            {order.notes ? <p><strong>Notes:</strong> {order.notes}</p> : null}
            <ul>
              {(order.items || []).map((item, index) => (
                <li key={`${order.id}-${index}`}>{item.qty}× {item.title}</li>
              ))}
            </ul>
            <div className="order-actions">
              <label>
                Status
                <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}>
                  {STATUSES.map((status) => <option key={status} value={status}>{orderStatusLabel(status)}</option>)}
                </select>
              </label>
              {order.whatsapp_share_url ? (
                <a className="button dark" href={order.whatsapp_share_url} target="_blank" rel="noreferrer">WhatsApp copy</a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
