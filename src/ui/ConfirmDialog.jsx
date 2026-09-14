import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ConfirmDialog({
  open,
  title = 'Please confirm',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel
}) {
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event) => {
      if (event.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="cms-modal site-confirm-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-confirm-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <div className="cms-dialog site-confirm-dialog">
        <header>
          <strong id="site-confirm-title">{title}</strong>
        </header>
        {message ? <p className="site-confirm-message">{message}</p> : null}
        <div className="cms-dialog-actions">
          <button type="button" className="button secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`button ${danger ? 'danger' : 'dark'}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
