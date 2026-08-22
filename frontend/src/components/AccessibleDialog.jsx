import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function AccessibleDialog({ open, onClose, title, description, children }) {
  const panelRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const panel = panelRef.current;
    panel?.querySelector(FOCUSABLE)?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key !== 'Tab' || !panel) return;
      const items = [...panel.querySelectorAll(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); 
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); 
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      previousFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <section 
        ref={panelRef} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="dialog-title" 
        aria-describedby={description ? 'dialog-description' : undefined} 
        className="dialog-panel"
      >
        <button type="button" onClick={onClose} className="dialog-close" aria-label="Đóng hộp thoại">
          <X size={20} />
        </button>
        <h2 id="dialog-title" className="text-xl font-bold text-[var(--text-primary)] pr-10">
          {title}
        </h2>
        {description && (
          <p id="dialog-description" className="text-sm text-[var(--text-secondary)] mt-2">
            {description}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </section>
    </div>
  );
}
