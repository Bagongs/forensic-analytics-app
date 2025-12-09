/* eslint-disable react/prop-types */
import { useId, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function CloseConfirmationModal({ open, onCancel, onConfirm }) {
  const dialogRef = useRef(null)
  const titleId = useId()

  // ESC close
  useEffect(() => {
    if (!open) return
    const handler = (e) => e.key === 'Escape' && onCancel?.()
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6 font-[Aldrich]"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div ref={dialogRef} className="relative w-[520px] bg-[#0D1521] shadow-xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: '#2A3A51',
            borderBottom: '2px solid #EDC702'
          }}
        >
          <h2 id={titleId} className="text-[18px] text-white">
            Close Confirmation
          </h2>

          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white text-[20px] leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-8 flex flex-col items-center text-center text-white">
          {/* Icon */}
          <div className="mb-6">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <path d="M12 2 1 22h22L12 2Z" stroke="#EDC702" strokeWidth="2" />
              <path d="M12 9v5" stroke="#EDC702" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16.5" r="1" fill="#EDC702" />
            </svg>
          </div>

          {/* Text */}
          <p className="text-[20px] font-medium mb-5">Are you sure want to close app?</p>

          {/* Buttons */}
          <div className="flex gap-6 mt-4">
            <button
              onClick={onCancel}
              className="w-36 h-10 text-sm rounded-sm border border-[#C3CFE0] text-white cursor-pointer"
            >
              CANCEL
            </button>

            <button
              onClick={onConfirm}
              className="w-36 h-10 text-sm rounded-sm border border-[#C3CFE0] text-white bg-[#2A3A51] cursor-pointer"
            >
              YES
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
