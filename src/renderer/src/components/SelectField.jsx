// src/renderer/src/components/SelectField.jsx
/* eslint-disable react/prop-types */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const COLORS = {
  inputBg: '#202C3C',
  inputBorder: '#394F6F',
  menuBg: '#151D28',
  menuBorder: '#394F6F',
  text: '#E7E9EE',

  disabledBg: '#1A2430',
  disabledBorder: '#2F3F55',
  disabledText: 'rgba(231,233,238,0.5)'
}

export default function SelectField({
  label,
  placeholder = 'Select',
  options,
  value,
  onChange,
  disabled = false
}) {
  const btnRef = useRef(null)
  const menuRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const selected = useMemo(() => options.find((o) => o.value === value), [options, value])

  const updatePosition = () => {
    const btn = btnRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const GAP = 6
    setCoords({ top: r.bottom + GAP, left: r.left, width: r.width })
  }

  useLayoutEffect(() => {
    if (open) updatePosition()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onScroll = () => updatePosition()
    const onResize = () => updatePosition()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    document.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e) => {
      const btn = btnRef.current
      const menu = menuRef.current
      if (!btn || !menu) return
      if (btn.contains(e.target) || menu.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const handleToggle = () => {
    if (disabled) return
    setOpen((v) => !v)
  }

  const Menu =
    open && !disabled
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              maxHeight: 256,
              overflow: 'auto',
              background: COLORS.menuBg,
              border: `1px solid ${COLORS.menuBorder}`,
              borderRadius: 10,
              zIndex: 9999,
              boxShadow: '0 8px 24px rgba(0,0,0,.4)'
            }}
          >
            {options.map((opt, idx) => {
              const active = opt.value === value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange?.(opt.value)
                    setOpen(false)
                  }}
                  className="w-full text-left px-4 h-12 flex items-center transition-colors"
                  style={{
                    background: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderBottom:
                      idx === options.length - 1 ? 'none' : `1px solid ${COLORS.menuBorder}`,
                    color: COLORS.text
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = active
                      ? 'rgba(255,255,255,0.06)'
                      : 'transparent')
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>,
          document.body
        )
      : null

  const bg = disabled ? COLORS.disabledBg : COLORS.inputBg
  const border = disabled ? COLORS.disabledBorder : COLORS.inputBorder
  const textColor = disabled ? COLORS.disabledText : COLORS.text
  const placeholderClass = selected ? '' : 'text-[--dim]'

  return (
    <div className="relative">
      {label && <label className="block mb-2">{label}</label>}
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="w-full h-12 px-4 flex items-center justify-between transition"
        style={{
          background: bg,
          border: `1px solid ${border}`,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.9 : 1
        }}
      >
        <span
          className={placeholderClass}
          style={{
            color: textColor
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M7 10l5 5 5-5" stroke={textColor} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {Menu}
    </div>
  )
}
