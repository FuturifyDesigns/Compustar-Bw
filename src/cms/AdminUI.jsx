import React, { useEffect, useState } from 'react';
import { PencilSimple, Plus, Trash, SignIn, SignOut, X } from '@phosphor-icons/react';
import { useAdmin } from './AdminContext';

export function AdminBar() {
  const { isAdmin, editMode, setEditMode, login, logout, busy, toast } = useAdmin();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('compustarbw@gmail.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <>
      {!isAdmin ? (
        <button className="admin-fab" type="button" onClick={() => setOpen(true)} aria-label="Admin login"><SignIn size={18} weight="bold" /></button>
      ) : (
        <div className="admin-bar">
          <span>Admin mode</span>
          <button type="button" className={editMode ? 'active' : ''} onClick={() => setEditMode((v) => !v)}>{editMode ? 'Editing on' : 'Editing off'}</button>
          <button type="button" onClick={logout}><SignOut size={16} /> Sign out</button>
        </div>
      )}
      {open && !isAdmin && (
        <div className="cms-modal" role="dialog">
          <div className="cms-dialog">
            <header><strong>Admin login</strong><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></header>
            <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} type="email" /></label>
            <label>Password<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" /></label>
            {error && <p className="cms-error">{error}</p>}
            <button className="button dark" disabled={busy} type="button" onClick={async () => {
              try {
                setError('');
                await login(email, password);
                setOpen(false);
              } catch (err) {
                setError(err.message || 'Login failed');
              }
            }}>Sign in</button>
          </div>
        </div>
      )}
      {toast && <div className="cms-toast">{toast}</div>}
    </>
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
