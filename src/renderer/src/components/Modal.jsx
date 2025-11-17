// src/renderer/src/components/Modal.jsx
/* eslint-disable react/prop-types */
import { useEffect, useRef, useId } from 'react'
import clsx from 'clsx'

export default function Modal({
  open,
  title,
  children,
  onCancel,
  onConfirm,
  cancelText = 'Cancel',
  confirmText = 'Next',
  disableConfirm = false,
  size = 'md',
  footer,
  initialFocusSelector,
  closable = true,
  className
}) {
  const dialogRef = useRef(null)
  const didFocusRef = useRef(false)
  const titleId = useId()

  // Focus handler
  useEffect(() => {
    if (!open) {
      didFocusRef.current = false
      return
    }
    if (didFocusRef.current) return
    if (initialFocusSelector) {
      const el = dialogRef.current?.querySelector(initialFocusSelector)
      if (el) {
        el.focus()
        didFocusRef.current = true
        return
      }
    }
    const active = document.activeElement
    if (dialogRef.current?.contains(active)) {
      didFocusRef.current = true
      return
    }
    const first = dialogRef.current?.querySelector(
      'input,select,textarea,button,[tabindex]:not([tabindex="-1"])'
    )
    first?.focus()
    didFocusRef.current = true
  }, [open, initialFocusSelector])

  // Escape key + body scroll lock + (opsional) Enter-to-confirm
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && closable) onCancel?.()
      // NEW: Enter untuk confirm (kecuali sedang disable)
      if (e.key === 'Enter' && onConfirm && !disableConfirm) {
        // hindari double submit kalau ada form yang submit default
        const tag = document.activeElement?.tagName?.toLowerCase()
        const isTextInput = ['input', 'textarea', 'select'].includes(tag)
        if (!isTextInput || (isTextInput && e.ctrlKey)) {
          e.preventDefault()
          onConfirm()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onCancel, onConfirm, disableConfirm, closable])

  if (!open) return null

  // ukuran fleksibel termasuk xl
  const width =
    size === 'sm'
      ? 'w-[420px]'
      : size === 'md'
        ? 'w-[560px]'
        : size === 'lg'
          ? 'w-[720px]'
          : size === 'xl'
            ? 'w-[900px]'
            : 'w-[560px]'

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
      // NEW: klik area overlay buat close hanya kalau closable
      onClick={() => {
        if (closable) onCancel?.()
      }}
    >
      {/* overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        ref={dialogRef}
        className={clsx('relative rounded-[14px] overflow-visible shadow-xl', width, className)}
        style={{ background: '#151D28' }}
        // NEW: supaya klik di dalam tidak menutup modal
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ background: '#2A3A51', borderBottom: '2px solid var(--gold)' }}
        >
          {title ? (
            <h2 id={titleId} className="app-title text-[18px]">
              {title}
            </h2>
          ) : (
            <div />
          )}
          {closable && (
            <button
              onClick={onCancel}
              aria-label="Close"
              className="text-white/80 hover:text-white text-[20px] leading-none"
            >
              ✕
            </button>
          )}
        </div>

        {/* Body (scrollable jika isi tinggi) */}
        <div className="p-6 max-h-[70vh] overflow-auto">{children}</div>

        {/* Footer */}
        {footer !== undefined ? (
          <div className="px-6 pb-5">{footer}</div>
        ) : (
          <div className="px-6 pb-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 h-10 text-sm rounded-sm"
              style={{ background: 'transparent', border: '1.5px solid #EDC702', color: '#E7E9EE' }}
            >
              {cancelText}
            </button>
            {onConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={disableConfirm}
                className="px-5 h-10 text-sm rounded-sm disabled:opacity-60"
                style={{ background: 'var(--gold)', color: '#101217', border: 'none' }}
              >
                {confirmText}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
