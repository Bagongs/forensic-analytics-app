// src/renderer/src/components/FilterMethodModal.jsx
/* eslint-disable react/prop-types */
import Modal from './Modal'

const GOLD = '#EDC702'
const BORDER_ITEM = '#C3CFE0'

// Pastikan opsi persis seperti yang diterima backend (case & ejaan penting)
const OPTIONS = [
  { value: 'Deep Communication Analytics', label: 'Deep Communication Analytics' },
  { value: 'Social Media Correlation', label: 'Social Media Correlation' },
  { value: 'Contact Correlation', label: 'Contact Correlation' },
  { value: 'Hashfile Analytics', label: 'Hashfile Analytics' },
  { value: 'APK Analytics', label: 'APK Analytics' }
]

function SquareCheckbox({ checked, onClick }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      className="shrink-0 grid place-items-center focus:outline-none focus:ring-2 focus:ring-[#EDC702]/50"
      style={{ width: 24, height: 24, border: `1.5px solid ${BORDER_ITEM}` }}
    >
      {checked ? <div className="w-3 h-3" style={{ background: GOLD }} /> : null}
    </button>
  )
}

export default function FilterMethodModal({
  open,
  selected = [], // array of values yang nanti di-join(',') pada fetchHistory
  onToggle, // (val) => void
  onApply, // () => void
  onClear, // () => void
  onClose // () => void
}) {
  return (
    <Modal
      open={open}
      title="FILTER METHOD"
      onCancel={onClose}
      footer={
        <div className="flex items-center justify-end gap-3">
          <div className="mr-auto text-xs text-(--dim)">
            {selected.length ? `${selected.length} selected` : 'No filter selected'}
          </div>
          <button
            className="px-5 h-10 text-sm rounded-sm border hover:bg-white/5 transition"
            style={{ borderColor: 'var(--gold)', color: 'var(--text)', background: 'transparent' }}
            onClick={onClear}
          >
            Clear
          </button>
          <button
            className="px-5 h-10 text-sm rounded-sm hover:opacity-95 transition"
            style={{ background: GOLD, color: '#101217' }}
            onClick={onApply || onClose}
          >
            Apply
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {OPTIONS.map((opt) => {
          const checked = selected.includes(opt.value)
          return (
            <div key={opt.value} className="flex items-center gap-4 text-(--text)">
              <SquareCheckbox checked={checked} onClick={() => onToggle?.(opt.value)} />
              <span className="select-none">{opt.label}</span>
            </div>
          )
        })}
      </div>
    </Modal>
  )
}
