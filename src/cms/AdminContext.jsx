import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { broadcastCmsChange, supabase, supabaseConfigured, uploadMedia } from '../lib/supabase';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const AdminContext = createContext(null);

function mapProduct(row) {
  const gallery = normalizeGallery(row.gallery_urls);
  const cover = row.image_url || gallery[0] || '';
  return {
    id: row.id,
    file: cover,
    title: row.title,
    category: row.category,
    price: row.price,
    currency: row.currency,
    description: row.description || '',
    image_url: cover,
    gallery_urls: gallery.length ? gallery : (cover ? [cover] : []),
    active: row.active
  };
}

function normalizeGallery(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
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

function sortByOrder(list) {
  return [...list].sort((a, b) => {
    const ao = a.sort_order ?? 0;
    const bo = b.sort_order ?? 0;
    if (ao !== bo) return ao - bo;
    return String(a.title || '').localeCompare(String(b.title || ''));
  });
}

export function AdminProvider({ children, fallbackProducts = [], fallbackAdverts = [] }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editMode, setEditModeState] = useState(() => {
    try {
      return sessionStorage.getItem('compustar-cms-edit') === '1';
    } catch {
      return false;
    }
  });
  const [products, setProducts] = useState(fallbackProducts);
  const [adverts, setAdverts] = useState(fallbackAdverts);
  const [content, setContent] = useState({});
  const [ready, setReady] = useState(!supabaseConfigured);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState({ message: '', tone: 'success' });
  const [confirmState, setConfirmState] = useState(null);
  const refreshTimer = useRef(0);
  const refreshRef = useRef(() => Promise.resolve());
  const toastTimer = useRef(0);

  const isAdmin = profile?.role === 'admin';

  async function loadProfile(userId) {
    if (!supabase || !userId) {
      setProfile(null);
      return null;
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    setProfile(data || null);
    return data;
  }

  function setEditMode(next) {
    setEditModeState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      try {
        sessionStorage.setItem('compustar-cms-edit', value ? '1' : '0');
      } catch {
        /* ignore */
      }
      return value;
    });
  }

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setReady(true);
      if (!data.session) setEditMode(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      if (next?.user) await loadProfile(next.user.id);
      else {
        setProfile(null);
        setEditMode(false);
      }
    });
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

  refreshRef.current = refresh;

  function scheduleRefresh() {
    window.clearTimeout(refreshTimer.current);
    refreshTimer.current = window.setTimeout(() => {
      refreshRef.current().catch(console.error);
    }, 80);
  }

  useEffect(() => {
    if (!supabaseConfigured) return;
    refresh().catch(console.error);
  }, [session]);

  // Live CMS updates: postgres changes + broadcast + light polling while visible
  useEffect(() => {
    if (!supabase) return undefined;

    const applyProduct = (payload) => {
      const event = payload.eventType;
      if (event === 'DELETE') {
        const id = payload.old?.id;
        if (id) setProducts((prev) => prev.filter((row) => row.id !== id));
        return;
      }
      const next = mapProduct(payload.new);
      if (payload.new?.active === false && profile?.role !== 'admin') {
        setProducts((prev) => prev.filter((row) => row.id !== next.id));
        return;
      }
      setProducts((prev) => {
        const without = prev.filter((row) => row.id !== next.id);
        return sortByOrder([...without, { ...next, sort_order: payload.new?.sort_order }]);
      });
    };

    const applyAdvert = (payload) => {
      const event = payload.eventType;
      if (event === 'DELETE') {
        const id = payload.old?.id;
        if (id) setAdverts((prev) => prev.filter((row) => row.id !== id));
        return;
      }
      const next = mapAdvert(payload.new);
      if (payload.new?.active === false && profile?.role !== 'admin') {
        setAdverts((prev) => prev.filter((row) => row.id !== next.id));
        return;
      }
      setAdverts((prev) => {
        const without = prev.filter((row) => row.id !== next.id);
        return sortByOrder([...without, { ...next, sort_order: payload.new?.sort_order }]);
      });
    };

    const applyContent = (payload) => {
      if (payload.eventType === 'DELETE') {
        const key = payload.old?.key;
        if (!key) return;
        setContent((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        return;
      }
      const key = payload.new?.key;
      if (!key) return;
      const value = payload.new.value;
      setContent((prev) => ({
        ...prev,
        [key]: typeof value === 'string' ? value : (value ?? '')
      }));
    };

    const channel = supabase
      .channel(`cms-live-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        applyProduct(payload);
        scheduleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'adverts' }, (payload) => {
        applyAdvert(payload);
        scheduleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_content' }, (payload) => {
        applyContent(payload);
        scheduleRefresh();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_images' }, () => {
        window.dispatchEvent(new CustomEvent('compustar:service-images-changed'));
        scheduleRefresh();
      })
      .subscribe();

    const broadcast = supabase
      .channel('cms-broadcast')
      .on('broadcast', { event: 'changed' }, () => scheduleRefresh())
      .subscribe();

    const poll = window.setInterval(() => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    }, 20000);

    const onVisible = () => {
      if (document.visibilityState === 'visible') scheduleRefresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearTimeout(refreshTimer.current);
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onVisible);
      supabase.removeChannel(channel);
      supabase.removeChannel(broadcast);
    };
  }, [profile?.role]);

  function notify(message, tone = 'success') {
    window.clearTimeout(toastTimer.current);
    setToast({ message, tone });
    toastTimer.current = window.setTimeout(() => setToast({ message: '', tone: 'success' }), 2800);
  }

  function confirmAction({
    title = 'Please confirm',
    message = '',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = false
  } = {}) {
    return new Promise((resolve) => {
      setConfirmState({
        title,
        message,
        confirmLabel,
        cancelLabel,
        danger,
        resolve
      });
    });
  }

  function closeConfirm(result) {
    setConfirmState((current) => {
      current?.resolve?.(result);
      return null;
    });
  }

  async function login(email, password) {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const nextProfile = await loadProfile(data.user.id);
      if (nextProfile?.role !== 'admin') {
        await supabase.auth.signOut();
        setProfile(null);
        throw new Error('This account is not an admin. Use Account for customer sign-in.');
      }
      setEditMode(true);
      notify('Admin mode enabled');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setProfile(null);
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
    await broadcastCmsChange('site_content');
    notify('Saved');
  }

  async function saveProduct(payload, id) {
    setBusy(true);
    try {
      const uploaded = [];
      for (const item of payload.galleryItems || []) {
        if (item?.file instanceof File) {
          uploaded.push(await uploadMedia(item.file, 'products'));
        } else if (item?.url) {
          uploaded.push(item.url);
        }
      }
      const unique = [...new Set(uploaded.filter(Boolean))];
      let image_url = unique[0] || payload.image_url || null;
      if (payload.fileObj instanceof File) {
        image_url = await uploadMedia(payload.fileObj, 'products');
        if (!unique.includes(image_url)) unique.unshift(image_url);
      }
      if (!unique.length && image_url) unique.push(image_url);

      const row = {
        title: (payload.title || '').trim(),
        category: (payload.category || '').trim(),
        price: payload.price === '' || payload.price == null ? null : Number(payload.price),
        currency: payload.currency || 'BWP',
        description: (payload.description || '').trim(),
        image_url: unique[0] || image_url,
        gallery_urls: unique,
        active: payload.active !== false,
        updated_at: new Date().toISOString()
      };

      if (!row.title) throw new Error('Please add a product title');
      if (!row.category) throw new Error('Please choose a category');
      if (!row.image_url) throw new Error('Please add at least one product photo');
      if (row.price != null && (!Number.isFinite(row.price) || row.price < 0)) {
        throw new Error('Price must be a valid number');
      }

      const write = async (body) => {
        if (id) {
          const { error } = await supabase.from('products').update(body).eq('id', id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('products').insert({ ...body, sort_order: products.length });
          if (error) throw error;
        }
      };

      try {
        await write(row);
      } catch (err) {
        const message = String(err?.message || err || '');
        if (/gallery_urls/i.test(message)) {
          const { gallery_urls, ...fallback } = row;
          await write(fallback);
          await refresh();
          await broadcastCmsChange('products');
          notify(id ? 'Product updated (cover photo only — run gallery SQL for extra photos)' : 'Product added (cover photo only — run gallery SQL for extra photos)', 'warn');
          return;
        }
        throw err;
      }

      await refresh();
      await broadcastCmsChange('products');
      notify(id ? 'Product updated successfully' : 'Product added successfully');
    } catch (err) {
      notify(err.message || 'Could not save product', 'warn');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(id) {
    const ok = await confirmAction({
      title: 'Delete product?',
      message: 'This removes the product from the site. This cannot be undone.',
      confirmLabel: 'Delete product',
      danger: true
    });
    if (!ok) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      await refresh();
      await broadcastCmsChange('products');
      notify('Product deleted successfully');
    } catch (err) {
      notify(err.message || 'Could not delete product', 'warn');
      throw err;
    }
  }

  async function saveAdvert(payload, id) {
    setBusy(true);
    try {
      let image_url = payload.image_url;
      if (payload.fileObj) image_url = await uploadMedia(payload.fileObj, 'adverts');
      if (!image_url) throw new Error('Please upload an advert image');
      const row = {
        title: (payload.title || '').trim() || 'New advert',
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
      await broadcastCmsChange('adverts');
      notify(id ? 'Advert updated' : 'Advert added');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAdvert(id) {
    const ok = await confirmAction({
      title: 'Delete advert?',
      message: 'This removes the advert from the site. This cannot be undone.',
      confirmLabel: 'Delete advert',
      danger: true
    });
    if (!ok) return;
    const { error } = await supabase.from('adverts').delete().eq('id', id);
    if (error) throw error;
    await refresh();
    await broadcastCmsChange('adverts');
    notify('Advert deleted', 'success');
  }

  useEffect(() => {
    if (!isAdmin) {
      setEditMode(false);
    }
  }, [isAdmin]);

  const value = useMemo(() => ({
    ready, busy, toast, isAdmin, editMode, setEditMode, products, adverts, content, profile,
    getContent(key, fallback = '') {
      const value = content[key];
      return value == null || value === '' ? fallback : value;
    },
    notify,
    confirm: confirmAction,
    login, logout, saveContent, saveProduct, deleteProduct, saveAdvert, deleteAdvert, refresh
  }), [ready, busy, toast, isAdmin, editMode, products, adverts, content, profile]);

  return (
    <AdminContext.Provider value={value}>
      {children}
      <ConfirmDialog
        open={Boolean(confirmState)}
        title={confirmState?.title}
        message={confirmState?.message}
        confirmLabel={confirmState?.confirmLabel}
        cancelLabel={confirmState?.cancelLabel}
        danger={confirmState?.danger}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  return useContext(AdminContext);
}
