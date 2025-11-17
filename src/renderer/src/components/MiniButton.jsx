/* eslint-disable react/prop-types */
export default function MiniButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="px-3 py-1.5 text-sm transition"
      style={{ borderColor: 'var(--border)' }}
    >
      {children}
    </button>
  )
}

export function MiniButtonContent({ bg, text, icon, textColor = 'text-white' }) {
  return (
    <div className="relative w-40 h-[59px] flex items-center justify-center text-sm font-medium">
      <img
        src={bg}
        alt=""
        className="absolute inset-0 w-full h-full object-contain z-0 pointer-events-none select-none"
      />
      <span className={`relative z-10 flex items-center gap-2 ${textColor}`}>
        {icon && <span className="text-[14px]">{icon}</span>} {text}
      </span>
    </div>
  )
}
