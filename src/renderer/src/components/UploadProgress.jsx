/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/prop-types */
// src/renderer/src/components/UploadProgress.jsx
import { useMemo } from 'react'
import UploadIcon from '@renderer/assets/icons/upload.svg'

export default function UploadProgress({
  open = false,
  filename = 'Filename1',
  ext = 'xdp',
  progress = 0,
  text = 'Uploading...',
  status = 'uploading', // 'uploading' | 'success' | 'error'
  onCancel
}) {
  if (!open) return null

  const pct = Math.max(0, Math.min(100, Number(progress) || 0))
  const isSuccess = status === 'success' || pct >= 100
  const isError = status === 'error'

  const skin = useMemo(() => {
    if (isError) {
      return {
        trackClass: 'upload-track--error',
        fillClass: 'upload-fill--error',
        capClass: 'upload-cap--error',
        labelColor: '#EDC702',
        rightText: '#F87171'
      }
    }
    if (isSuccess) {
      return {
        trackClass: 'upload-track--success',
        fillClass: 'upload-fill--success',
        capClass: 'upload-cap--success',
        labelColor: '#FFFFFF',
        rightText: '#EDC702'
      }
    }
    return {
      trackClass: 'upload-track--gold',
      fillClass: 'upload-fill--gold',
      capClass: 'upload-cap--gold',
      labelColor: '#EDC702',
      rightText: '#EDC702'
    }
  }, [isError, isSuccess])

  const groupWidth = `${pct}%`

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full rounded-[14px] shadow-xl mx-4"
        style={{
          maxWidth: 900,
          background: '#151D28',
          border: '1px solid var(--border, #293240)'
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{
            background: '#2A3A51',
            borderBottom: '2px solid var(--gold, #EDC702)'
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-white text-[18px] app-title truncate">{filename}</div>
            <span
              className="uppercase shrink-0"
              style={{
                background: '#273549',
                color: '#E7E9EE',
                border: '1px solid #3B4B64',
                borderRadius: 8,
                padding: '2px 8px',
                fontSize: 12,
                letterSpacing: 0.5
              }}
            >
              {ext}
            </span>
          </div>
          {!isSuccess && (
            <button
              onClick={onCancel}
              className="p-1 -m-1 hover:opacity-80 active:scale-95"
              aria-label="Cancel"
              title="Cancel"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="#FF4D5F"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className={`upload-track ${skin.trackClass}`}>
            {/* GROUP bergerak bersama */}
            <div className="upload-group" style={{ width: groupWidth }}>
              {/* Fill & Cap */}
              <div className={`upload-fill ${skin.fillClass}`} />
              <div className={`upload-cap ${skin.capClass}`} />

              {/* Label — di luar cap dengan jarak 48px */}
              <div
                className="absolute top-1/2 flex items-center"
                style={{
                  right: `calc(var(--cap-w) * -1 - 48px)`, // jarak 48px dari ujung cap
                  transform: 'translateY(-50%)',
                  zIndex: 5
                }}
              >
                <span
                  className="upload-label"
                  style={{
                    color: skin.labelColor,
                    fontWeight: 600,
                    fontSize: 18
                  }}
                >
                  {Math.round(pct)}%
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-5 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <img
                src={UploadIcon}
                alt="Upload Icon"
                width={32}
                height={32}
                className="opacity-90"
              />
              {isError && (
                <span className="text-[16px] font-semibold" style={{ color: '#F87171' }}>
                  {text || 'Upload Failed! Please try again'}
                </span>
              )}
              {isSuccess && (
                <span className="text-[16px] font-semibold" style={{ color: '#FFFFFF' }}>
                  Upload Successful!
                </span>
              )}
              {!isError && !isSuccess && (
                <span className="text-[16px] font-medium" style={{ color: 'var(--dim, #9AA3B2)' }}>
                  {text}
                </span>
              )}
            </div>

            <div className="text-[20px] font-semibold" style={{ color: skin.rightText }}>
              {isError ? 'ERROR!' : `${Math.round(pct)}%`}
            </div>
          </div>

          {!isSuccess && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm rounded-lg border hover:bg-white/10 transition"
                style={{ borderColor: 'var(--border, #293240)' }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
