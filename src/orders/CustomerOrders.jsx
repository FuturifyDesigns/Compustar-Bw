import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { orderStatusLabel } from './formatOrderWhatsApp';

function go(path) {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function CustomerOrders({ userId }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load({ silent = false } = {}) {
    if (!supabase || !userId) return;
    if (!silent) setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('orders')
      .select('id, status, status_note, fulfillment, pickup_when, delivery_address, notes, items, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(40);
    if (err) setError(err.message);
    else setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!userId || !supabase) {
      setLoading(false);
      return undefined;
    }

    load().catch(console.error);

    const channel = supabase
      .channel(`customer-orders-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setOrders((prev) => {
              if (prev.some((row) => row.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setOrders((prev) => prev.map((row) => (row.id === payload.new.id ? { ...row, ...payload.new } : row)));
          } else if (payload.eventType === 'DELETE' && payload.old?.id) {
            setOrders((prev) => prev.filter((row) => row.id !== payload.old.id));
          } else {
            load({ silent: true }).catch(console.error);
          }
        }
      )
      .subscribe();

    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') load({ silent: true }).catch(console.error);
    }, 20000);

    return () => {
      window.clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return (
    <section className="customer-orders">
      <div className="customer-orders-head">
        <div>
          <p className="kicker">Your requests</p>
          <h2>Order request history</h2>
          <p className="account-lead">Track status updates as Compustar reviews each request.</p>
        </div>
        <button type="button" className="button secondary-dark" onClick={() => load()}>Refresh</button>
      </div>

      {loading ? <p className="orders-empty">Loading your requests…</p> : null}
      {error ? <p className="cms-error">{error}</p> : null}

      {!loading && !orders.length ? (
        <div className="orders-empty-card">
          <strong>No order requests yet</strong>
          <p>When you submit a cart request, it will appear here with live status updates.</p>
          <button type="button" className="button dark" onClick={() => go('/Products')}>Browse products</button>
        </div>
      ) : null}

      <div className="orders-list">
        {orders.map((order) => {
          const ref = String(order.id || '').slice(0, 8).toUpperCase();
          const itemCount = (order.items || []).reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
          return (
            <article key={order.id} className="order-card customer-order-card">
              <header>
                <div>
                  <strong>Ref {ref}</strong>
                  <span className={`order-status status-${order.status}`}>{orderStatusLabel(order.status)}</span>
                </div>
                <time dateTime={order.created_at}>
                  {new Date(order.created_at).toLocaleString()}
                </time>
              </header>
              <p>
                <strong>{order.fulfillment === 'pickup' ? 'Store pickup' : 'Delivery'}</strong>
                {order.fulfillment === 'pickup'
                  ? (order.pickup_when ? ` · ${order.pickup_when}` : '')
                  : (order.delivery_address ? ` · ${order.delivery_address}` : '')}
              </p>
              <ul>
                {(order.items || []).map((item, index) => (
                  <li key={`${order.id}-${index}`}>
                    {item.qty || 1}× {item.title || 'Item'}
                    {item.price != null && item.price !== ''
                      ? ` — ${item.currency || 'BWP'} ${item.price}`
                      : ''}
                  </li>
                ))}
              </ul>
              {order.notes ? <p className="customer-order-notes"><strong>Your notes:</strong> {order.notes}</p> : null}
              {order.status_note ? <p className="customer-order-notes"><strong>Update from Compustar:</strong> {order.status_note}</p> : null}
              <p className="customer-order-meta">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
