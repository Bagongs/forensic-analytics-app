const COLORS = {
  pageActive: '#273549'
}

// eslint-disable-next-line react/prop-types
function IconChevron({ dir = 'left' }) {
  const rotate = dir === 'right' ? 'rotate-180' : ''
  return (
    <svg
      className={`w-4 h-4 ${rotate}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      color="#EDC702"
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  )
}

// eslint-disable-next-line react/prop-types
export default function Pagination({ page, totalPages, onChange }) {
  const go = (p) => onChange(Math.max(1, Math.min(totalPages, p)))
  const nums = []
  if (totalPages <= 6) {
    for (let i = 1; i <= totalPages; i++) nums.push(i)
  } else {
    nums.push(1, 2, 3, '...', totalPages)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => go(page - 1)}
        disabled={page === 1}
        className="p-2 disabled:opacity-40"
      >
        <IconChevron dir="left" />
      </button>

      {nums.map((n, idx) =>
        n === '...' ? (
          <span key={`dots-${idx}`} className="px-3">
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => go(n)}
            className="min-w-10 h-10 px-3 rounded-sm"
            style={{
              background: n === page ? COLORS.pageActive : 'transparent',
              color: n === page ? '#EDC702' : '',
              border: '1px solid transparent'
            }}
          >
            {n}
          </button>
        )
      )}

      <button
        onClick={() => go(page + 1)}
        disabled={page === totalPages}
        className="p-2 disabled:opacity-40"
      >
        <IconChevron dir="right" />
      </button>
    </div>
  )
}
