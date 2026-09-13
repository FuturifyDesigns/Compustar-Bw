import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../cms/AdminContext';

const STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

export function OrdersAdminPanel() {
  const { isAdmin } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    if (!supabase || !isAdmin) return;
    setLoading(true);
    setError('');
    const { data, error: err } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (err) setError(err.message);
    else setOrders(data || []);
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
      .channel('orders-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        load().catch(console.error);
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
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
          <p className="account-lead">New requests from the website appear here. Update status as you progress each order.</p>
        </div>
        <button type="button" className="button dark" onClick={() => load()}>Refresh</button>
      </div>
      {loading && <p className="orders-empty">Loading orders…</p>}
      {error && <p className="cms-error">{error}</p>}
      {!loading && !orders.length && (
        <div className="orders-empty-card">
          <strong>No order requests yet</strong>
          <p>When customers submit a cart request on the website, they will show up here for follow-up.</p>
        </div>
      )}
      <div className="orders-list">
        {orders.map((order) => (
          <article key={order.id} className="order-card">
            <header>
              <div>
                <strong>{order.customer_name}</strong>
                <span className={`order-status status-${order.status}`}>{order.status}</span>
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
                  {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
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
