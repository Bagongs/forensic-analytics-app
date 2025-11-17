/* eslint-disable react/prop-types */

export default function ActionSheet({ open, title = 'Choose', options = [], onClose, onSelect }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative w-[360px] rounded-xl border p-4"
        style={{ background: 'var(--panel)', borderColor: 'var(--border)' }}
      >
        {title && (
          <div className="text-sm mb-3" style={{ color: 'var(--dim)' }}>
            {title}
          </div>
        )}
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)' }}>
          {options.map((opt, i) => (
            <button
              key={opt.value}
              className="w-full text-left px-4 py-3 hover:bg-white/10 transition"
              onClick={() => onSelect(opt.value)}
              style={{ borderTop: i ? `1px solid var(--border)` : 'none' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
