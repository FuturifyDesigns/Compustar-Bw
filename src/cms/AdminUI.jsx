import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  ArrowClockwise,
  ArrowCounterClockwise,
  Crop,
  LockKey,
  MagnifyingGlassMinus,
  MagnifyingGlassPlus,
  PencilSimple,
  Plus,
  SignOut,
  Trash,
  UploadSimple,
  X
} from '@phosphor-icons/react';
import { useAdmin } from './AdminContext';

let scrollLockCount = 0;

function lockBodyScroll() {
  scrollLockCount += 1;
  document.body.style.overflow = 'hidden';
}

function unlockBodyScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = '';
}

function CmsModal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    lockBodyScroll();
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      unlockBodyScroll();
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="cms-modal"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`cms-dialog ${wide ? 'cms-dialog-wide' : ''}`}>
        <header>
          <strong>{title}</strong>
          <button type="button" aria-label="Close" onClick={onClose}><X size={20} weight="bold" /></button>
        </header>
        {children}
      </div>
    </div>,
    document.body
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load image'));
    image.src = src;
  });
}

async function exportEditedImage({ image, rotation, zoom, offset, stageEl, outW, outH, fileName = 'image' }) {
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  const stageW = stageEl?.clientWidth || outW;
  const stageH = stageEl?.clientHeight || outH;
  const scaleX = outW / stageW;
  const scaleY = outH / stageH;
  const scaledW = image.naturalWidth * zoom;
  const scaledH = image.naturalHeight * zoom;
  const radians = (rotation * Math.PI) / 180;

  ctx.translate(outW / 2 + offset.x * scaleX, outH / 2 + offset.y * scaleY);
  ctx.rotate(radians);
  ctx.drawImage(image, -(scaledW * scaleX) / 2, -(scaledH * scaleY) / 2, scaledW * scaleX, scaledH * scaleY);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
  if (!blob) throw new Error('Could not export image');
  return new File([blob], `${fileName.replace(/\.[^.]+$/, '')}.webp`, { type: 'image/webp' });
}

function ImageField({
  label = 'Image',
  value,
  onChange,
  aspect = 1,
  aspectHint = 'Upload a photo, then crop, zoom, and rotate.'
}) {
  const [editing, setEditing] = useState(false);
  const [sourceUrl, setSourceUrl] = useState('');
  const [image, setImage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const fileRef = useRef(null);
  const stageRef = useRef(null);
  const outW = aspect >= 1 ? 1200 : Math.round(1200 * aspect);
  const outH = aspect >= 1 ? Math.round(1200 / aspect) : 1200;

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(typeof value === 'string' ? value : '');
    return undefined;
  }, [value]);

  useEffect(() => () => {
    if (sourceUrl.startsWith('blob:')) URL.revokeObjectURL(sourceUrl);
  }, [sourceUrl]);

  async function openEditor(fileOrUrl) {
    setError('');
    setBusy(true);
    try {
      let url = fileOrUrl;
      if (fileOrUrl instanceof File) {
        url = URL.createObjectURL(fileOrUrl);
        setSourceUrl(url);
      } else {
        setSourceUrl('');
      }
      const img = await loadImage(url);
      setImage(img);
      const fit = Math.max(320 / img.naturalWidth, 320 / img.naturalHeight);
      setZoom(Number((fit * 1.08).toFixed(3)));
      setRotation(0);
      setOffset({ x: 0, y: 0 });
      setEditing(true);
    } catch (err) {
      setError(err.message || 'Could not open image');
    } finally {
      setBusy(false);
    }
  }

  function onPointerDown(event) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y });
  }

  function onPointerMove(event) {
    if (!drag) return;
    setOffset({
      x: drag.ox + (event.clientX - drag.x),
      y: drag.oy + (event.clientY - drag.y)
    });
  }

  function onPointerUp() {
    setDrag(null);
  }

  async function applyEdit() {
    if (!image) return;
    setBusy(true);
    setError('');
    try {
      const file = await exportEditedImage({
        image,
        rotation,
        zoom,
        offset,
        stageEl: stageRef.current,
        outW,
        outH,
        fileName: 'upload'
      });
      onChange(file);
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Could not save image');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="cms-image-field">
      <span className="cms-image-label">{label}</span>
      <div className="cms-image-preview-row">
        <div className="cms-image-preview" style={{ aspectRatio: `${aspect}` }}>
          {previewUrl ? <img src={previewUrl} alt="" /> : <span>No image yet</span>}
        </div>
        <div className="cms-image-actions">
          <button type="button" className="edit-chip solid" onClick={() => fileRef.current?.click()}>
            <UploadSimple size={16} weight="bold" /> Upload
          </button>
          {previewUrl && (
            <button type="button" className="edit-chip solid" disabled={busy} onClick={() => openEditor(previewUrl)}>
              <Crop size={16} weight="bold" /> Adjust
            </button>
          )}
          {value ? (
            <button type="button" className="edit-chip danger" onClick={() => onChange(null)}>
              <Trash size={16} weight="bold" /> Remove
            </button>
          ) : null}
        </div>
      </div>
      <p className="cms-image-hint">{aspectHint}</p>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) openEditor(file);
        }}
      />
      {error && <p className="cms-error">{error}</p>}
      {editing && image && (
        <CmsModal title="Crop & adjust image" onClose={() => setEditing(false)} wide>
          <div className="cms-image-editor">
            <div
              className="cms-image-stage"
              ref={stageRef}
              style={{ aspectRatio: `${aspect}` }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              <div
                className="cms-image-layer"
                style={{
                  width: image.naturalWidth * zoom,
                  height: image.naturalHeight * zoom,
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${rotation}deg)`
                }}
              >
                <img src={image.src} alt="" draggable={false} />
              </div>
              <div className="cms-crop-frame" aria-hidden="true" />
            </div>
            <div className="cms-image-tools">
              <button type="button" className="edit-chip solid" onClick={() => setRotation((value) => value - 90)}>
                <ArrowCounterClockwise size={16} weight="bold" /> Rotate
              </button>
              <button type="button" className="edit-chip solid" onClick={() => setRotation((value) => value + 90)}>
                <ArrowClockwise size={16} weight="bold" /> Rotate
              </button>
              <label className="cms-zoom">
                <MagnifyingGlassMinus size={16} />
                <input
                  type="range"
                  min="0.15"
                  max="4"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(Number(event.target.value))}
                />
                <MagnifyingGlassPlus size={16} />
              </label>
            </div>
            <p className="cms-image-hint">Drag to reposition. Zoom and rotate, then apply the crop.</p>
            <div className="cms-dialog-actions">
              <button type="button" className="button secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button type="button" className="button dark" disabled={busy} onClick={applyEdit}>
                {busy ? 'Working…' : 'Apply crop'}
              </button>
            </div>
          </div>
        </CmsModal>
      )}
    </div>
  );
}

export function AdminBar() {
  const { isAdmin, editMode, setEditMode, logout, toast } = useAdmin();

  useEffect(() => {
    document.body.classList.toggle('cms-editing', Boolean(isAdmin && editMode));
    return () => document.body.classList.remove('cms-editing');
  }, [isAdmin, editMode]);

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
  const { isAdmin, login, logout, busy, ready } = useAdmin();
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
      <div className="admin-login admin-login--ready">
        <div className="admin-login-glow" aria-hidden="true" />
        <div className="admin-ready" data-hero>
          <img src="/logo.webp" alt="Compustar" className="admin-ready-logo" />
          <div className="admin-ready-copy">
            <p className="admin-login-eyebrow">Signed in</p>
            <h1>Ready to edit.</h1>
            <p className="admin-login-lead">Use the bar above to toggle editing, then open the live site and change anything in place.</p>
          </div>
          <div className="admin-ready-actions">
            <button type="button" className="admin-login-btn primary" onClick={onEnterSite}>
              Open the site <ArrowRight size={18} weight="bold" />
            </button>
            <button type="button" className="admin-login-link" onClick={logout}>Sign out</button>
          </div>
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
  const [saving, setSaving] = useState(false);
  const Tag = as;

  useEffect(() => setDraft(value), [value]);

  if (!(isAdmin && editMode)) return <Tag className={className}>{value}</Tag>;

  return (
    <Tag className={`editable-wrap editable-${as}${className ? ` ${className}` : ''}`}>
      {value}
      <button
        className="edit-chip"
        type="button"
        aria-label="Edit text"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
      >
        <PencilSimple size={16} weight="fill" />
      </button>
      {open && (
        <CmsModal title="Edit text" onClose={() => setOpen(false)}>
          {multiline
            ? <textarea rows={8} value={draft} onChange={(e) => setDraft(e.target.value)} />
            : <input value={draft} onChange={(e) => setDraft(e.target.value)} />}
          <div className="cms-dialog-actions">
            <button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="button dark"
              type="button"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await saveContent(contentKey, draft);
                  setOpen(false);
                } finally {
                  setSaving(false);
                }
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </CmsModal>
      )}
    </Tag>
  );
}

export function CMSText({ contentKey, fallback = '', as = 'span', className = '', multiline = false }) {
  const { getContent } = useAdmin();
  return (
    <EditableText
      contentKey={contentKey}
      value={getContent(contentKey, fallback)}
      as={as}
      className={className}
      multiline={multiline}
    />
  );
}

export function ProductEditorButton({ product, onAdd }) {
  const { isAdmin, editMode, saveProduct, deleteProduct, busy } = useAdmin();
  const [open, setOpen] = useState(false);
  const blank = { title: '', category: '', price: '', currency: 'BWP', description: '', image_url: '', active: true };
  const [draft, setDraft] = useState(blank);
  const [imageFile, setImageFile] = useState(null);

  if (!(isAdmin && editMode)) return null;

  function openEditor() {
    setDraft(product ? {
      title: product.title || '',
      category: product.category || '',
      price: product.price ?? '',
      currency: product.currency || 'BWP',
      description: product.description || '',
      image_url: product.image_url || product.file || '',
      active: product.active !== false
    } : blank);
    setImageFile(null);
    setOpen(true);
  }

  return (
    <>
      <div className="card-admin-actions">
        {onAdd
          ? <button type="button" className="edit-chip solid" onClick={openEditor}><Plus size={18} weight="bold" /> Add</button>
          : <>
              <button type="button" className="edit-chip" aria-label="Edit product" onClick={openEditor}><PencilSimple size={18} weight="fill" /></button>
              <button type="button" className="edit-chip danger" aria-label="Delete product" onClick={() => deleteProduct(product.id)}><Trash size={18} weight="fill" /></button>
            </>}
      </div>
      {open && (
        <CmsModal title={product ? 'Edit product' : 'Add product'} onClose={() => setOpen(false)} wide>
          <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Add product name" /></label>
          <label>Category<input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="Add category" /></label>
          <label>Price (BWP)<input type="number" step="0.01" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></label>
          <label>Description<textarea rows={4} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></label>
          <ImageField
            value={imageFile || draft.image_url}
            onChange={(next) => {
              if (next instanceof File) setImageFile(next);
              else {
                setImageFile(null);
                setDraft((prev) => ({ ...prev, image_url: '' }));
              }
            }}
          />
          <div className="cms-dialog-actions">
            <button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="button dark"
              type="button"
              disabled={busy}
              onClick={async () => {
                await saveProduct({ ...draft, fileObj: imageFile }, product?.id);
                setOpen(false);
              }}
            >
              {busy ? 'Saving…' : 'Save product'}
            </button>
          </div>
        </CmsModal>
      )}
    </>
  );
}

export function AdvertEditorButton({ advert, onAdd }) {
  const { isAdmin, editMode, saveAdvert, deleteAdvert, busy } = useAdmin();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const blank = { title: '', text: '', image_url: '', active: true };
  const [draft, setDraft] = useState(blank);
  const [imageFile, setImageFile] = useState(null);

  if (!(isAdmin && editMode)) return null;

  function openEditor() {
    setError('');
    setDraft(advert ? {
      title: advert.title || '',
      text: advert.text || '',
      image_url: advert.image_url || advert.file || '',
      active: advert.active !== false
    } : blank);
    setImageFile(null);
    setOpen(true);
  }

  return (
    <>
      <div className="card-admin-actions">
        {onAdd
          ? <button type="button" className="edit-chip solid" onClick={openEditor}><Plus size={18} weight="bold" /> Add advert</button>
          : <>
              <button type="button" className="edit-chip" aria-label="Edit advert" onClick={openEditor}><PencilSimple size={18} weight="fill" /></button>
              <button type="button" className="edit-chip danger" aria-label="Delete advert" onClick={() => deleteAdvert(advert.id)}><Trash size={18} weight="fill" /></button>
            </>}
      </div>
      {open && (
        <CmsModal title={advert ? 'Edit advert' : 'Add advert'} onClose={() => !busy && setOpen(false)} wide>
          <label>Title<input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Advert title" /></label>
          <label>Text<textarea rows={5} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} /></label>
          <ImageField
            label="Advert image"
            aspect={16 / 9}
            aspectHint="Upload, then crop and rotate. Wide 16:9 works best for adverts."
            value={imageFile || draft.image_url}
            onChange={(next) => {
              if (next instanceof File) setImageFile(next);
              else {
                setImageFile(null);
                setDraft((prev) => ({ ...prev, image_url: '' }));
              }
            }}
          />
          {error && <p className="cms-error">{error}</p>}
          <div className="cms-dialog-actions">
            <button type="button" className="button secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
            <button
              className="button dark"
              type="button"
              disabled={busy}
              onClick={async () => {
                setError('');
                if (!imageFile && !draft.image_url) {
                  setError('Please upload an advert image first.');
                  return;
                }
                try {
                  await saveAdvert({
                    ...draft,
                    title: draft.title.trim() || 'New advert',
                    fileObj: imageFile
                  }, advert?.id);
                  setOpen(false);
                } catch (err) {
                  setError(err.message || 'Could not save advert');
                }
              }}
            >
              {busy ? 'Saving…' : 'Save advert'}
            </button>
          </div>
        </CmsModal>
      )}
    </>
  );
}
