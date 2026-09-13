import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const value = useMemo(() => {
    const count = items.reduce((sum, item) => sum + item.qty, 0);

    function addItem(product, qty = 1) {
      const id = product.id || product.file || product.image_url;
      if (!id) return;
      setItems((prev) => {
        const existing = prev.find((row) => row.id === id);
        if (existing) {
          return prev.map((row) => (row.id === id ? { ...row, qty: row.qty + qty } : row));
        }
        return [
          ...prev,
          {
            id,
            title: product.title || product.name || 'Product',
            category: product.category || '',
            price: product.price ?? null,
            currency: product.currency || 'BWP',
            image_url: product.image_url || product.file || '',
            qty
          }
        ];
      });
    }

    function updateQty(id, qty) {
      const next = Math.max(1, Number(qty) || 1);
      setItems((prev) => prev.map((row) => (row.id === id ? { ...row, qty: next } : row)));
    }

    function removeItem(id) {
      setItems((prev) => prev.filter((row) => row.id !== id));
    }

    function clearCart() {
      setItems([]);
    }

    return { items, count, addItem, updateQty, removeItem, clearCart };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
