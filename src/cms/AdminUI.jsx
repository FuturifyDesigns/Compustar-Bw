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
import { PRODUCT_CATEGORIES, canonicalCategoryTitle } from '../data/productCategories';

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

  const toastNode = toast?.message ? (
    <div className={`cms-toast cms-toast--${toast.tone || 'success'}`} role="status" aria-live="polite">
      {toast.message}
    </div>
  ) : null;

  if (!isAdmin) {
    return toastNode;
  }

  return (
    <>
      <div className="admin-bar">
        <span>Admin mode</span>
        <button type="button" className={editMode ? 'active' : ''} onClick={() => setEditMode((v) => !v)}>{editMode ? 'Editing on' : 'Editing off'}</button>
        <button type="button" onClick={logout}><SignOut size={16} /> Sign out</button>
      </div>
      {toastNode}
    </>
  );
}

export function AdminPage({ onEnterSite, children = null }) {
  const { isAdmin, login, logout, busy, ready } = useAdmin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      document.body.classList.remove('admin-login-body');
      return undefined;
    }
    document.body.classList.add('admin-login-body');
    return () => document.body.classList.remove('admin-login-body');
  }, [isAdmin]);

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
      <div className="admin-workspace">
        <header className="admin-dash-header">
          <a
            className="admin-dash-brand"
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onEnterSite();
            }}
            aria-label="Go to Compustar homepage"
          >
            <img src="/logo.webp" alt="Compustar" />
          </a>
          <div className="admin-dash-copy">
            <p className="admin-dash-eyebrow">Compustar site studio</p>
            <h1>Admin dashboard</h1>
            <p>Review order requests, then open the live site to edit products, prices, and page copy.</p>
          </div>
          <div className="admin-dash-actions">
            <button type="button" className="admin-dash-btn primary" onClick={onEnterSite}>
              Open the site <ArrowRight size={16} weight="bold" />
            </button>
            <button type="button" className="admin-dash-btn ghost" onClick={logout}>Sign out</button>
          </div>
        </header>
        <div className="admin-orders-wrap">
          {children}
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

export function ProductEditorButton({ product, onAdd, defaultCategory = '' }) {
  const { isAdmin, editMode, saveProduct, deleteProduct, busy } = useAdmin();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    category: defaultCategory || '',
    price: '',
    currency: 'BWP',
    description: '',
    active: true
  });
  const [galleryItems, setGalleryItems] = useState([]);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  if (!(isAdmin && editMode)) return null;

  function openEditor() {
    const existing = product
      ? (Array.isArray(product.gallery_urls) && product.gallery_urls.length
        ? product.gallery_urls
        : [product.image_url || product.file].filter(Boolean))
      : [];
    setDraft(product ? {
      title: product.title || '',
      category: canonicalCategoryTitle(product.category) || '',
      price: product.price ?? '',
      currency: product.currency || 'BWP',
      description: product.description || '',
      active: product.active !== false
    } : {
      title: '',
      category: defaultCategory || '',
      price: '',
      currency: 'BWP',
      description: '',
      active: true
    });
    setGalleryItems(existing.map((url, index) => ({ id: `${index}-${url}`, url })));
    setUploaderKey((value) => value + 1);
    setErrors({});
    setFormError('');
    setOpen(true);
  }

  function validate() {
    const next = {};
    const title = draft.title.trim();
    if (!title) next.title = 'Add a product title';
    else if (title.length < 2) next.title = 'Title is too short';
    if (!draft.category) next.category = 'Choose a category';
    if (draft.price !== '' && draft.price != null) {
      const price = Number(draft.price);
      if (!Number.isFinite(price) || price < 0) next.price = 'Enter a valid price (0 or more)';
    }
    if (draft.description && draft.description.length > 4000) {
      next.description = 'Description is too long';
    }
    if (!galleryItems.length) next.gallery = 'Add at least one product photo';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSave() {
    setFormError('');
    if (!validate()) {
      setFormError('Please fix the highlighted fields before saving.');
      return;
    }
    try {
      await saveProduct({ ...draft, galleryItems }, product?.id);
      setOpen(false);
    } catch (err) {
      setFormError(err.message || 'Could not save product');
    }
  }

  return (
    <>
      <div className={onAdd ? 'cms-toolbar-actions' : 'card-admin-actions'}>
        {onAdd
          ? <button type="button" className="edit-chip solid" onClick={openEditor}><Plus size={18} weight="bold" /> Add product</button>
          : <>
              <button type="button" className="edit-chip" aria-label="Edit product" onClick={(event) => { event.preventDefault(); event.stopPropagation(); openEditor(); }}><PencilSimple size={18} weight="fill" /></button>
              <button type="button" className="edit-chip danger" aria-label="Delete product" onClick={(event) => { event.preventDefault(); event.stopPropagation(); deleteProduct(product.id); }}><Trash size={18} weight="fill" /></button>
            </>}
      </div>
      {open && (
        <CmsModal title={product ? 'Edit product' : 'Add product'} onClose={() => !busy && setOpen(false)} wide>
          <div className="cms-product-form">
            <p className="cms-form-lead">
              Fill in the product details clearly. The first photo becomes the cover image shown in the catalogue.
            </p>

            <div className="cms-form-section">
              <p className="cms-form-section-title">Basic details</p>
              <div className="cms-form-grid">
                <label className={errors.title ? 'is-invalid' : ''}>
                  Title <span className="req">*</span>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="e.g. Logitech wireless mouse"
                    maxLength={160}
                  />
                  {errors.title ? <span className="cms-field-error">{errors.title}</span> : null}
                </label>
                <label className={errors.category ? 'is-invalid' : ''}>
                  Category <span className="req">*</span>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {PRODUCT_CATEGORIES.map((item) => (
                      <option key={item.slug} value={item.title}>{item.title}</option>
                    ))}
                  </select>
                  {errors.category ? <span className="cms-field-error">{errors.category}</span> : null}
                </label>
                <label className={errors.price ? 'is-invalid' : ''}>
                  Price (BWP)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                    placeholder="Optional"
                  />
                  {errors.price ? <span className="cms-field-error">{errors.price}</span> : null}
                </label>
              </div>
              <label className={errors.description ? 'is-invalid' : ''}>
                Description
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Key features, compatibility, or what’s included"
                  maxLength={4000}
                />
                {errors.description ? <span className="cms-field-error">{errors.description}</span> : null}
              </label>
            </div>

            <div className={`cms-form-section ${errors.gallery ? 'is-invalid' : ''}`}>
              <p className="cms-form-section-title">Photos <span className="req">*</span></p>
              <p className="cms-form-hint">Add one or more photos. Drag order by using Set cover — cover shows first in the shop.</p>
              {galleryItems.length > 0 && (
                <div className="cms-gallery-grid">
                  {galleryItems.map((item, index) => {
                    const preview = item.preview || item.url;
                    return (
                      <div className={`cms-gallery-item${index === 0 ? ' is-cover' : ''}`} key={item.id}>
                        <img src={preview} alt="" />
                        {index === 0 ? <span className="cms-gallery-badge">Cover</span> : null}
                        <div className="cms-gallery-item-actions">
                          {index > 0 ? (
                            <button
                              type="button"
                              className="edit-chip solid"
                              onClick={() => setGalleryItems((prev) => {
                                const next = [...prev];
                                const [picked] = next.splice(index, 1);
                                next.unshift(picked);
                                return next;
                              })}
                            >
                              Set cover
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="edit-chip danger"
                            aria-label="Remove photo"
                            onClick={() => setGalleryItems((prev) => {
                              const target = prev.find((entry) => entry.id === item.id);
                              if (target?.preview?.startsWith('blob:')) URL.revokeObjectURL(target.preview);
                              return prev.filter((entry) => entry.id !== item.id);
                            })}
                          >
                            <Trash size={14} weight="fill" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <ImageField
                key={uploaderKey}
                label={galleryItems.length ? 'Add another photo' : 'Upload photo'}
                aspectHint="Upload a clear product photo, then crop and adjust if needed."
                value=""
                onChange={(next) => {
                  if (!(next instanceof File)) return;
                  const preview = URL.createObjectURL(next);
                  setGalleryItems((prev) => [...prev, { id: `${Date.now()}-${prev.length}`, file: next, preview }]);
                  setUploaderKey((value) => value + 1);
                  setErrors((prev) => ({ ...prev, gallery: undefined }));
                }}
              />
              {errors.gallery ? <span className="cms-field-error">{errors.gallery}</span> : null}
            </div>

            {formError ? <p className="cms-error">{formError}</p> : null}
          </div>
          <div className="cms-dialog-actions">
            <button type="button" className="button secondary" disabled={busy} onClick={() => setOpen(false)}>Cancel</button>
            <button className="button dark" type="button" disabled={busy} onClick={onSave}>
              {busy ? 'Saving…' : (product ? 'Save changes' : 'Save product')}
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
      <div className={onAdd ? 'cms-toolbar-actions' : 'card-admin-actions'}>
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
