import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAdmin } from '../cms/AdminContext';
import { orderStatusLabel } from './formatOrderWhatsApp';
import { DeliveryDetails } from './DeliveryDetails';

const STATUSES = ['new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

function mediaSrc(item) {
  const src = item?.image_url || '';
  if (!src) return '';
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return `/products/${src}`;
}

function itemThumb(item) {
  const src = mediaSrc(item);
  if (!src) return '';
  return src.replace(/\.(jpe?g|png)$/i, '.webp');
}

export function OrdersAdminPanel() {
  const { isAdmin, notify, confirm } = useAdmin();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [busyId, setBusyId] = useState('');
  const knownIds = useRef(new Set());

  function draftFor(order) {
    return drafts[order.id] || {
      status: order.status,
      statusNote: order.status_note || ''
    };
  }

  function setDraft(orderId, patch) {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        status: prev[orderId]?.status,
        statusNote: prev[orderId]?.statusNote ?? '',
        ...patch
      }
    }));
  }

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
          notify(`${fresh.length} new order request${fresh.length > 1 ? 's' : ''} received`, 'success');
        }
      }
      knownIds.current = nextIds;
      setOrders(rows);
      setDrafts((prev) => {
        const next = { ...prev };
        rows.forEach((row) => {
          if (!next[row.id]) {
            next[row.id] = { status: row.status, statusNote: row.status_note || '' };
          }
        });
        return next;
      });
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
          notify('New order request received', 'success');
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

  async function saveStatus(order) {
    if (!supabase) return;
    const draft = draftFor(order);
    const status = draft.status || order.status;
    const statusNote = String(draft.statusNote || '').trim();
    const statusChanged = status !== order.status;
    const noteChanged = statusNote !== String(order.status_note || '').trim();
    if (!statusChanged && !noteChanged) {
      notify('No status changes to save', 'warn');
      return;
    }

    setBusyId(order.id);
    setError('');
    try {
      const { error: err } = await supabase
        .from('orders')
        .update({
          status,
          status_note: statusNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);
      if (err) throw err;

      setOrders((prev) => prev.map((row) => (
        row.id === order.id ? { ...row, status, status_note: statusNote } : row
      )));

      const { data: notifyData, error: notifyError } = await supabase.functions.invoke('notify-order-status', {
        body: {
          orderId: order.id,
          status,
          statusNote,
          customerEmail: order.customer_email,
          customerName: order.customer_name
        }
      });
      if (notifyError || notifyData?.ok === false) {
        notify('Status saved, but the customer email may not have sent', 'warn');
      } else {
        notify(`Status updated · emailed ${order.customer_email}`, 'success');
      }
    } catch (err) {
      setError(err.message || 'Could not update status');
      notify(err.message || 'Could not update status', 'warn');
    } finally {
      setBusyId('');
    }
  }

  async function deleteOrder(order) {
    if (!supabase) return;
    const ref = String(order.id || '').slice(0, 8).toUpperCase();
    const ok = await confirm({
      title: 'Delete order request?',
      message: `Remove request ${ref} from ${order.customer_name}? This cannot be undone.`,
      confirmLabel: 'Delete request',
      cancelLabel: 'Keep request',
      danger: true
    });
    if (!ok) return;

    setBusyId(order.id);
    setError('');
    try {
      const { error: err } = await supabase.from('orders').delete().eq('id', order.id);
      if (err) throw err;
      setOrders((prev) => prev.filter((row) => row.id !== order.id));
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      knownIds.current.delete(order.id);
      notify(`Deleted request ${ref}`, 'success');
    } catch (err) {
      setError(err.message || 'Could not delete request');
      notify(err.message || 'Could not delete request', 'warn');
    } finally {
      setBusyId('');
    }
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
      {loading && <p className="orders-empty">Loading orders…</p>}
      {error && <p className="cms-error">{error}</p>}
      {!loading && !orders.length && (
        <div className="orders-empty-card">
          <strong>No order requests yet</strong>
          <p>When customers submit a cart request on the website, they will show up here automatically.</p>
        </div>
      )}
      <div className="orders-list">
        {orders.map((order) => {
          const draft = draftFor(order);
          const ref = String(order.id || '').slice(0, 8).toUpperCase();
          const busy = busyId === order.id;
          return (
            <article key={order.id} className="order-card">
              <header>
                <div>
                  <strong>{order.customer_name}</strong>
                  <span className={`order-status status-${order.status}`}>{orderStatusLabel(order.status)}</span>
                  <span className="order-ref">Ref {ref}</span>
                </div>
                <time>{new Date(order.created_at).toLocaleString()}</time>
              </header>
              <p>{order.customer_email} · {order.customer_phone}</p>
              <p>
                <strong>{order.fulfillment === 'pickup' ? 'Pickup' : 'Delivery'}:</strong>{' '}
                {order.fulfillment === 'pickup'
                  ? (order.pickup_when || '—')
                  : <DeliveryDetails address={order.delivery_address} />}
              </p>
              {order.notes ? <p><strong>Customer notes:</strong> {order.notes}</p> : null}

              <ul className="order-items">
                {(order.items || []).map((item, index) => {
                  const thumb = itemThumb(item);
                  return (
                    <li key={`${order.id}-${index}`} className="order-item-row">
                      {thumb ? (
                        <img src={thumb} alt="" className="order-item-thumb" loading="lazy" />
                      ) : (
                        <div className="order-item-thumb order-item-thumb--empty" aria-hidden="true" />
                      )}
                      <div>
                        <strong>{item.qty || 1}× {item.title || 'Item'}</strong>
                        {item.price != null && item.price !== '' ? (
                          <span>{item.currency || 'BWP'} {item.price}</span>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="order-status-editor">
                <label>
                  Status
                  <select
                    value={draft.status}
                    disabled={busy}
                    onChange={(e) => setDraft(order.id, { status: e.target.value, statusNote: draft.statusNote })}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>{orderStatusLabel(status)}</option>
                    ))}
                  </select>
                </label>
                <label className="order-status-note">
                  Optional note to customer
                  <textarea
                    rows={2}
                    value={draft.statusNote}
                    disabled={busy}
                    placeholder="Shown in the status email (quote, pickup time, reason, etc.)"
                    onChange={(e) => setDraft(order.id, { status: draft.status, statusNote: e.target.value })}
                  />
                </label>
              </div>

              <div className="order-actions">
                <button
                  type="button"
                  className="button dark"
                  disabled={busy}
                  onClick={() => saveStatus(order)}
                >
                  {busy ? 'Saving…' : 'Save & email customer'}
                </button>
                {order.whatsapp_share_url ? (
                  <a className="button secondary-dark" href={order.whatsapp_share_url} target="_blank" rel="noreferrer">WhatsApp copy</a>
                ) : null}
                <button
                  type="button"
                  className="button ghost-dark order-delete-btn"
                  disabled={busy}
                  onClick={() => deleteOrder(order)}
                >
                  Delete request
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
