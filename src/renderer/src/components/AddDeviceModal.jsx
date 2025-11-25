/* eslint-disable react/prop-types */
import { useMemo, useState } from 'react'
import Modal from './Modal'

/* === ICON SEARCH === */
function IconSearch(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="11" cy="11" r="7" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  )
}

const COLORS = {
  panel: 'var(--panel)',
  border: 'var(--border)',
  text: 'var(--text)',
  dim: 'var(--dim)',
  gold: '#EDC702',
  headerBg: '#395070',
  inputBg: '#202C3C',
  inputBorder: '#394F6F',
  radioBg: '#2A3A51',
  radioBorder: '#C3CFE0',
  radioSelectedBg: '#D9D9D9',
  rowBottomBorder: '#C3CFE0'
}

function InputField({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 rounded-[10px] outline-none"
        style={{
          background: COLORS.inputBg,
          border: `1px solid ${COLORS.inputBorder}`,
          color: COLORS.text
        }}
      />
    </div>
  )
}

/* === PHONE NUMBER (digits only, max 15) === */
function PhoneNumberField({ label, value, onChange, placeholder }) {
  const MAX_LEN = 15
  const sanitize = (v) => v.replace(/\D+/g, '').slice(0, MAX_LEN) // keep digits only + limit 15

  return (
    <div>
      <label className="block mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange?.(sanitize(e.target.value))}
        placeholder={placeholder}
        inputMode="numeric"
        pattern="[0-9]*"
        autoComplete="off"
        className="w-full h-12 px-4 rounded-[10px] outline-none"
        onKeyDown={(e) => {
          const allowed = [
            'Backspace',
            'Delete',
            'Tab',
            'ArrowLeft',
            'ArrowRight',
            'Home',
            'End',
            'Enter'
          ]
          if (allowed.includes(e.key)) return
          if (e.ctrlKey || e.metaKey) return

          // block non-digit
          if (!/^[0-9]$/.test(e.key)) {
            e.preventDefault()
            return
          }

          // hard limit 15 digits saat mengetik
          if ((value || '').length >= MAX_LEN) {
            e.preventDefault()
          }
        }}
        style={{
          background: COLORS.inputBg,
          border: `1px solid ${COLORS.inputBorder}`,
          color: COLORS.text
        }}
      />
    </div>
  )
}

// id primer aman (BE kadang kirim id/file_id/upload_id)
const filePrimaryId = (f) => f?.id ?? f?.file_id ?? f?.upload_id ?? null

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    : '-'

export default function AddDeviceModal({
  open,
  method,
  files = [],
  usedFileIds = [],
  loading = false,
  onCancel,
  onNext
}) {
  const [query, setQuery] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Filter client-side:
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (files || [])
      .map((f) => ({ ...f, __fid: filePrimaryId(f) }))
      .filter((f) => !!f.__fid)
      .filter((f) => String(f.method || '').trim() === String(method || '').trim())
      .filter((f) => !usedFileIds.includes(f.__fid))
      .filter((f) => {
        if (!q) return true
        const hay = [
          f.file_name,
          f.file_path,
          f.notes,
          f.tools,
          f.type,
          f.total_size_formatted,
          f.method
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
  }, [files, query, method, usedFileIds])

  const selectedFile = useMemo(
    () => filtered.find((f) => (f.__fid ?? f.id) === selectedId) || null,
    [filtered, selectedId]
  )

  const disableNext = submitting || !ownerName.trim() || !phoneNumber.trim() || !selectedFile

  const handleNext = () => {
    if (disableNext) return
    setSubmitting(true)
    try {
      onNext?.({
        ownerName: ownerName.trim(),
        phoneNumber: phoneNumber.trim(),
        file: selectedFile
      })
      // reset field setelah parent terima, biar siap tambah lagi
      setOwnerName('')
      setPhoneNumber('')
      setQuery('')
      setSelectedId(null)
    } finally {
      setSubmitting(false)
    }
  }

  function truncateText(text, max = 16) {
    if (!text) return '-'
    return text.length > max ? text.substring(0, max) + '...' : text
  }

  const footer = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={() => {
          setOwnerName('')
          setPhoneNumber('')
          setQuery('')
          setSelectedId(null)
          onCancel?.()
        }}
        className="h-10 px-6 rounded-[10px] text-sm"
        style={{
          background: 'transparent',
          border: `1.5px solid ${COLORS.gold}`,
          color: COLORS.text
        }}
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={disableNext}
        onClick={handleNext}
        className="h-10 px-7 rounded-[10px] app-title text-sm disabled:opacity-60"
        style={{
          background: 'radial-gradient(50% 50% at 50% 50%, #EDC702 0%, rgba(237,199,2,0.7) 100%)',
          border: '3px solid #EDC702B2',
          color: '#101217'
        }}
      >
        Next
      </button>
    </div>
  )

  const GRID_TEMPLATE = '70px 120px 1.8fr 1.1fr 2fr 1fr'

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title="Select File"
      size="2xl"
      footer={footer}
      closable
      className="select-none"
    >
      {/* FORM ATAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <InputField label="Name" value={ownerName} onChange={setOwnerName} placeholder="Name" />
        <PhoneNumberField
          label="Phone Number"
          value={phoneNumber}
          onChange={setPhoneNumber}
          placeholder="Number"
        />
      </div>

      {/* PANEL TABEL */}
      <div
        className="p-4"
        style={{
          background: COLORS.panel,
          border: `1px solid ${COLORS.border}`,
          boxShadow: 'var(--shadow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* TITLE + SEARCH */}
        <div className="flex items-center justify-between mb-3">
          <div className="app-title text-[20px] uppercase">Uploaded Data</div>

          <div
            className="flex items-center gap-3 h-12 px-4 min-w-[320px]"
            style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}` }}
          >
            <IconSearch className="opacity-90" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search"
              className="bg-transparent outline-none flex-1 text-[15px]"
              style={{ color: COLORS.text }}
            />
          </div>
        </div>

        {/* error & loading */}
        {loading && (
          <div className="mb-2 text-sm" style={{ color: COLORS.dim }}>
            Loading files…
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="px-5 py-6 opacity-70 text-center">No files for “{method || '-'}”.</div>
        )}

        {/* HEADER */}
        <div
          className="grid items-center px-4 mb-2"
          style={{
            background: COLORS.headerBg,
            border: `1px solid ${COLORS.inputBorder}`,
            gridTemplateColumns: GRID_TEMPLATE,
            height: 52
          }}
        >
          {['Select', 'Date', 'File Name', 'Method', 'Notes', 'Tools'].map((t) => (
            <div
              key={t}
              className="text-sm font-semibold truncate"
              style={{ color: COLORS.gold, whiteSpace: 'nowrap', textAlign: 'left' }}
              title={t}
            >
              {t}
            </div>
          ))}
        </div>

        {/* BODY */}
        <div className="max-h-[380px] overflow-y-auto pr-1.5 space-y-2">
          {filtered.map((f) => {
            const fid = f.__fid ?? f.id
            const selected = selectedId === fid
            const disabled = usedFileIds.includes(fid)

            return (
              <div
                key={fid}
                className="grid items-center px-4 py-2 rounded-[10px] transition-colors"
                style={{
                  gridTemplateColumns: GRID_TEMPLATE,
                  minHeight: 64,
                  background: 'transparent',
                  opacity: disabled ? 0.5 : 1,
                  border: `1px solid ${COLORS.rowBottomBorder}33`
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {/* RADIO */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => !disabled && setSelectedId(selected ? null : fid)}
                    className="relative flex items-center justify-center w-[22px] h-[22px] rounded-full"
                    style={{
                      background: COLORS.radioBg,
                      border: `0.98px solid ${COLORS.radioBorder}`,
                      transition: 'all 0.2s ease',
                      cursor: disabled ? 'not-allowed' : 'pointer'
                    }}
                    title={disabled ? 'Already used in this analytic' : 'Select'}
                    aria-disabled={disabled}
                    aria-pressed={selected && !disabled}
                  >
                    {selected && !disabled && (
                      <span
                        className="absolute rounded-full"
                        style={{ background: COLORS.radioSelectedBg, width: 12, height: 12 }}
                      />
                    )}
                  </button>
                </div>

                <div className="truncate opacity-90 text-sm" title={f.created_at || ''}>
                  {fmtDate(f.created_at)}
                </div>
                <div className="truncate text-sm" title={f.file_name || ''}>
                  {truncateText(f.file_name, 30)}
                </div>
                <div className="truncate text-sm" title={f.method || ''}>
                  {f.method || '-'}
                </div>
                <div className="truncate text-sm opacity-90" title={f.notes || ''}>
                  {f.notes || '-'}
                </div>
                <div
                  className="truncate text-sm"
                  style={{ color: COLORS.gold }}
                  title={f.tools || ''}
                >
                  {f.tools || '-'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}
