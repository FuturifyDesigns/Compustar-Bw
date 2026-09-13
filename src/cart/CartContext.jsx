import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'compustar-cart-v1';

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => (typeof window === 'undefined' ? [] : readCart()));
  const [toast, setToast] = useState('');
  const toastTimer = useRef(0);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);

    function notify(message) {
      window.clearTimeout(toastTimer.current);
      setToast(message);
      toastTimer.current = window.setTimeout(() => setToast(''), 2400);
    }

    function addItem(product, qty = 1) {
      const id = product.id || product.file || product.image_url;
      if (!id) return;
      const title = product.title || product.name || 'Product';
      setItems((prev) => {
        const existing = prev.find((row) => row.id === id);
        if (existing) {
          return prev.map((row) => (row.id === id ? { ...row, qty: row.qty + qty } : row));
        }
        return [
          ...prev,
          {
            id,
            title,
            category: product.category || '',
            price: product.price ?? null,
            currency: product.currency || 'BWP',
            image_url: product.image_url || product.file || '',
            qty
          }
        ];
      });
      notify(`Added “${title}” to cart`);
    }

    function updateQty(id, qty) {
      const next = Math.max(1, Number(qty) || 1);
      setItems((prev) => prev.map((row) => (row.id === id ? { ...row, qty: next } : row)));
    }

    function removeItem(id) {
      const removed = items.find((row) => row.id === id);
      setItems((prev) => prev.filter((row) => row.id !== id));
      if (removed) notify(`Removed “${removed.title}” from cart`);
    }

    function clearCart() {
      setItems([]);
    }

    return { items, count, addItem, updateQty, removeItem, clearCart, notify };
  }, [items]);

  return (
    <CartContext.Provider value={value}>
      {children}
      {toast ? (
        <div className="app-toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
