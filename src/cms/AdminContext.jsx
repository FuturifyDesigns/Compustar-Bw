import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, supabaseConfigured, uploadMedia } from '../lib/supabase';

const AdminContext = createContext(null);

function mapProduct(row) {
  return {
    id: row.id,
    file: row.image_url,
    title: row.title,
    category: row.category,
    price: row.price,
    currency: row.currency,
    description: row.description || '',
    image_url: row.image_url,
    active: row.active
  };
}

function mapAdvert(row) {
  return {
    id: row.id,
    file: row.image_url,
    title: row.title,
    text: row.text,
    image_url: row.image_url,
    active: row.active
  };
}

export function AdminProvider({ children, fallbackProducts = [], fallbackAdverts = [] }) {
  const [session, setSession] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [products, setProducts] = useState(fallbackProducts);
  const [adverts, setAdverts] = useState(fallbackAdverts);
  const [content, setContent] = useState({});
  const [ready, setReady] = useState(!supabaseConfigured);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');
  const refreshTimer = useRef(0);

  const isAdmin = Boolean(session?.user);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function refresh() {
    if (!supabase) return;
    const [{ data: productRows }, { data: advertRows }, { data: contentRows }] = await Promise.all([
      supabase.from('products').select('*').order('sort_order', { ascending: true }),
      supabase.from('adverts').select('*').order('sort_order', { ascending: true }),
      supabase.from('site_content').select('key,value')
    ]);
    if (productRows) setProducts(productRows.map(mapProduct));
    if (advertRows) setAdverts(advertRows.map(mapAdvert));
    if (contentRows) {
      const map = {};
      contentRows.forEach((row) => {
        map[row.key] = typeof row.value === 'string' ? row.value : (row.value ?? '');
      });
      setContent(map);
    }
  }

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      refresh().catch(console.error);
    }, 120);
  }

  useEffect(() => {
    if (!supabaseConfigured) return;
    refresh().catch(console.error);
  }, [session]);

  // Live updates for every visitor when CMS data changes
  useEffect(() => {
    if (!supabase) return undefined;
    const channel = supabase
      .channel('cms-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'adverts' }, scheduleRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, scheduleRefresh)
      .subscribe();
    return () => {
      window.clearTimeout(refreshTimer.current);
      supabase.removeChannel(channel);
    };
  }, []);

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2400);
  }

  async function login(email, password) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      setEditMode(true);
      notify('Admin mode enabled');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setEditMode(false);
    notify('Signed out');
  }

  async function saveContent(key, value) {
    setContent((prev) => ({ ...prev, [key]: value }));
    const { error } = await supabase.from('site_content').upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    });
    if (error) {
      await refresh();
      throw error;
    }
    notify('Saved');
  }

  async function saveProduct(payload, id) {
    setBusy(true);
    try {
      let image_url = payload.image_url;
      if (payload.fileObj) image_url = await uploadMedia(payload.fileObj, 'products');
      const row = {
        title: payload.title,
        category: payload.category || 'General',
        price: payload.price === '' || payload.price == null ? null : Number(payload.price),
        currency: payload.currency || 'BWP',
        description: payload.description || '',
        image_url,
        active: payload.active !== false,
        updated_at: new Date().toISOString()
      };
      if (id) {
        const { error } = await supabase.from('products').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({ ...row, sort_order: products.length });
        if (error) throw error;
      }
      await refresh();
      notify(id ? 'Product updated' : 'Product added');
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await refresh();
    notify('Product deleted');
  }

  async function saveAdvert(payload, id) {
    setBusy(true);
    try {
      let image_url = payload.image_url;
      if (payload.fileObj) image_url = await uploadMedia(payload.fileObj, 'adverts');
      const row = {
        title: payload.title,
        text: payload.text || '',
        image_url,
        active: payload.active !== false,
        updated_at: new Date().toISOString()
      };
      if (id) {
        const { error } = await supabase.from('adverts').update(row).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('adverts').insert({ ...row, sort_order: adverts.length });
        if (error) throw error;
      }
      await refresh();
      notify(id ? 'Advert updated' : 'Advert added');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAdvert(id) {
    if (!window.confirm('Delete this advert?')) return;
    const { error } = await supabase.from('adverts').delete().eq('id', id);
    if (error) throw error;
    await refresh();
    notify('Advert deleted');
  }

  const value = useMemo(() => ({
    ready, busy, toast, isAdmin, editMode, setEditMode, products, adverts, content,
    getContent(key, fallback = '') {
      const value = content[key];
      return value == null || value === '' ? fallback : value;
    },
    login, logout, saveContent, saveProduct, deleteProduct, saveAdvert, deleteAdvert, refresh
  }), [ready, busy, toast, isAdmin, editMode, products, adverts, content]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  return useContext(AdminContext);
}
