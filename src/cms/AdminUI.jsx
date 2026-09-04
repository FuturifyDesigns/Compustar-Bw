import React, { useEffect, useState } from 'react';
import { PencilSimple, Plus, Trash, SignOut, X, LockKey, ArrowRight } from '@phosphor-icons/react';
import { useAdmin } from './AdminContext';

export function AdminBar() {
  const { isAdmin, editMode, setEditMode, logout, toast } = useAdmin();

  if (!isAdmin) {
    return toast ? <div className="cms-toast">{toast}</div> : null;
  }

  return (
    <>
      <div className="admin-bar">
        <span>Admin mode</span>
        <button type="button" className={editMode ? 'active' : ''} onClick={() => setEditMode((v) => !v)}>{editMode ? 'Editing on' : 'Editing off'}</button>
        <button type="button" onClick={logout}><SignOut size={16} /> Sign out</button>
      </div>
      {toast && <div className="cms-toast">{toast}</div>}
    </>
  );
}

export function AdminPage({ onEnterSite }) {
  const { isAdmin, editMode, setEditMode, login, logout, busy, ready } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    document.body.classList.add('admin-login-body');
    return () => document.body.classList.remove('admin-login-body');
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  }

  if (!ready) {
    return (
      <div className="admin-login">
        <div className="admin-login-panel">
          <p className="admin-login-loading">Loading…</p>
        </div>
      </div>
    );
  }

  if (isAdmin) {
    return (
      <div className="admin-login">
        <div className="admin-login-glow" aria-hidden="true" />
        <div className="admin-login-panel admin-login-ready" data-hero>
          <img src="/logo.webp" alt="Compustar" className="admin-login-logo" />
          <p className="admin-login-eyebrow">Signed in</p>
          <h1>You&apos;re ready to edit the live site.</h1>
          <p className="admin-login-lead">Turn editing on, then open any page to change text, products, prices, and adverts in place.</p>
          <div className="admin-login-actions">
            <button
              type="button"
              className={`admin-login-btn ${editMode ? 'accent' : 'ghost'}`}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? 'Editing is on' : 'Turn editing on'}
            </button>
            <button type="button" className="admin-login-btn primary" onClick={onEnterSite}>
              Open the site <ArrowRight size={18} weight="bold" />
            </button>
          </div>
          <button type="button" className="admin-login-link" onClick={logout}>Sign out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-login">
      <div className="admin-login-glow" aria-hidden="true" />
      <div className="admin-login-stage">
        <div className="admin-login-brand" data-hero>
          <img src="/logo.webp" alt="Compustar" className="admin-login-logo" />
          <p className="admin-login-eyebrow">Compustar Botswana</p>
          <h1>Site studio</h1>
          <p className="admin-login-lead">Sign in to edit products, prices, adverts, and page copy on the live website.</p>
        </div>
        <form className="admin-login-panel" onSubmit={handleSubmit} data-hero>
          <div className="admin-login-lock"><LockKey size={22} weight="fill" /></div>
          <h2>Admin sign in</h2>
          <p className="admin-login-hint">Only authorised Compustar staff should use this page.</p>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="username"
              required
              placeholder="you@compustar.co.bw"
            />
          </label>
          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </label>
          {error && <p className="cms-error" role="alert">{error}</p>}
          <button className="admin-login-btn primary" disabled={busy} type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}

export function EditableText({ contentKey, value, as = 'span', className = '', multiline = false }) {
  const { isAdmin, editMode, saveContent } = useAdmin();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const Tag = as;

  useEffect(() => setDraft(value), [value]);

  if (!(isAdmin && editMode)) return <Tag className={className}>{value}</Tag>;

  return (
    <span className={`editable-wrap ${className}`}>
      <Tag>{value}</Tag>
      <button className="edit-chip" type="button" aria-label="Edit text" onClick={() => setOpen(true)}><PencilSimple size={14} weight="fill" /></button>
      {open && (
        <div className="cms-modal">
          <div className="cms-dialog">
            <header><strong>Edit text</strong><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            {multiline
              ? <textarea rows={6} value={draft} onChange={(e) => setDraft(e.target.value)} />
              : <input value={draft} onChange={(e) => setDraft(e.target.value)} />}
            <button className="button dark" type="button" onClick={async () => { await saveContent(contentKey, draft); setOpen(false); }}>Save</button>
          </div>
        </div>
      )}
    </span>
  );
}

export function ProductEditorButton({ product, onAdd }) {
  const { isAdmin, editMode, saveProduct, deleteProduct } = useAdmin();
  const [open, setOpen] = useState(false);
  const blank = { title: '', category: 'General', price: '', currency: 'BWP', description: '', image_url: '', active: true };
  const [draft, setDraft] = useState(product ? {
    title: product.title || '',
    category: product.category || 'General',
    price: product.price ?? '',
    currency: product.currency || 'BWP',
    description: product.description || '',
    image_url: product.image_url || product.file || '',
    active: product.active !== false
  } : blank);
  const [fileObj, setFileObj] = useState(null);

  if (!(isAdmin && editMode)) return null;

  return (
    <>
      <div className="card-admin-actions">
        {onAdd
          ? <button type="button" className="edit-chip" onClick={() => { setDraft(blank); setOpen(true); }}><Plus size={14} weight="bold" /> Add</button>
          : <>
              <button type="button" className="edit-chip" onClick={() => setOpen(true)}><PencilSimple size={14} weight="fill" /></button>
              <button type="button" className="edit-chip danger" onClick={() => deleteProduct(product.id)}><Trash size={14} weight="fill" /></button>
            </>}
      </div>
      {open && (
        <div className="cms-modal">
          <div className="cms-dialog">
            <header><strong>{product ? 'Edit product' : 'Add product'}</strong><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
            <label>Category<input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></label>
            <label>Price (BWP)<input type="number" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label>
            <label>Description<textarea rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
            <label>Image URL<input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} /></label>
            <label>Or upload image <small>(auto-compressed for free tier)</small><input type="file" accept="image/*" onChange={(e) => setFileObj(e.target.files?.[0] || null)} /></label>
            <button className="button dark" type="button" onClick={async () => {
              await saveProduct({ ...draft, fileObj }, product?.id);
              setOpen(false);
            }}>Save product</button>
          </div>
        </div>
      )}
    </>
  );
}

export function AdvertEditorButton({ advert, onAdd }) {
  const { isAdmin, editMode, saveAdvert, deleteAdvert } = useAdmin();
  const [open, setOpen] = useState(false);
  const blank = { title: '', text: '', image_url: '', active: true };
  const [draft, setDraft] = useState(advert ? {
    title: advert.title || '',
    text: advert.text || '',
    image_url: advert.image_url || advert.file || '',
    active: advert.active !== false
  } : blank);
  const [fileObj, setFileObj] = useState(null);

  if (!(isAdmin && editMode)) return null;

  return (
    <>
      <div className="card-admin-actions">
        {onAdd
          ? <button type="button" className="edit-chip" onClick={() => { setDraft(blank); setOpen(true); }}><Plus size={14} weight="bold" /> Add advert</button>
          : <>
              <button type="button" className="edit-chip" onClick={() => setOpen(true)}><PencilSimple size={14} weight="fill" /></button>
              <button type="button" className="edit-chip danger" onClick={() => deleteAdvert(advert.id)}><Trash size={14} weight="fill" /></button>
            </>}
      </div>
      {open && (
        <div className="cms-modal">
          <div className="cms-dialog">
            <header><strong>{advert ? 'Edit advert' : 'Add advert'}</strong><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
            <label>Text<textarea rows={4} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></label>
            <label>Image URL<input value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} /></label>
            <label>Or upload image <small>(auto-compressed for free tier)</small><input type="file" accept="image/*" onChange={(e) => setFileObj(e.target.files?.[0] || null)} /></label>
            <button className="button dark" type="button" onClick={async () => {
              await saveAdvert({ ...draft, fileObj }, advert?.id);
              setOpen(false);
            }}>Save advert</button>
          </div>
        </div>
      )}
    </>
  );
}
