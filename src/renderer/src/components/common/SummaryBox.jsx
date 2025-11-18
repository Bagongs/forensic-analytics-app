/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export default function SummaryBox({
  title = 'Summary',
  value = '',
  onChange,
  placeholder = 'Click Add to write summary',
  actionLabel = 'Add',
  onAction,
  actionIcon = null,
  actionBgImage = null,
  actionSize = { w: 70, h: 27 },
  actionOffset = { top: 15, right: 24 },
  editable = true,
  rowsMin = 3,

  // style params
  gradient = 'linear-gradient(180deg, #1C2737 -94.25%, #1B2533 100%)',
  borderColor = '#4C607D',
  borderW = 1.5,
  cut = 18,

  // warna efek glow
  glowColor = '#FFFFFF', // putih utama
  glowShadowAlpha = 0.7, // intensitas shadow putih
  glowAuraAlpha = 0.5 // intensitas aura radial
}) {
  const textRef = useRef(null)
  const boxRef = useRef(null)

  // autosize textarea
  useEffect(() => {
    if (!textRef.current) return
    const el = textRef.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  // autofocus saat masuk edit
  useEffect(() => {
    if (editable && textRef.current) textRef.current.focus()
  }, [editable])

  // ukur container untuk SVG border
  const [size, setSize] = useState({ w: 0, h: 0 })
  useLayoutEffect(() => {
    if (!boxRef.current) return
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect
      setSize({ w: cr.width, h: cr.height })
    })
    ro.observe(boxRef.current)
    return () => ro.disconnect()
  }, [])

  const d = getPathD(size.w, size.h, cut)

  const innerClip = `polygon(
    ${Math.max(0, cut - borderW)}px ${borderW}px,
    calc(100% - ${borderW}px) ${borderW}px,
    calc(100% - ${borderW}px) calc(100% - ${Math.max(0, cut - borderW)}px),
    calc(100% - ${Math.max(0, cut - borderW)}px) calc(100% - ${borderW}px),
    ${borderW}px calc(100% - ${borderW}px),
    ${borderW}px ${Math.max(0, cut - borderW)}px
  )`

  const paddingRight = onAction ? actionSize.w + 24 : undefined
  const glowShadow = `0 0 14px ${hexToRgba(glowColor, glowShadowAlpha)}`

  return (
    <div className="relative w-full" ref={boxRef}>
      {/* SVG border di belakang */}
      <svg
        className="absolute inset-0 pointer-events-none"
        width="100%"
        height="100%"
        viewBox={`0 0 ${Math.max(size.w, 1)} ${Math.max(size.h, 1)}`}
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d={d}
          fill="none"
          stroke={borderColor}
          strokeWidth={borderW}
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="miter"
          strokeMiterlimit="2"
        />
      </svg>

      {/* konten */}
      <div
        className="relative p-4"
        style={{
          background: gradient,
          clipPath: innerClip,
          paddingRight
        }}
      >
        {/* Header */}
        <div className="font-[Aldrich] text-[16px] mb-2 text-[#F4F6F8]">{title}</div>

        {/* Body */}
        {editable ? (
          <textarea
            ref={textRef}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={rowsMin}
            className="w-full resize-none bg-transparent outline-none font-[Noto Sans] text-[14px] text-[#E7E9EE] placeholder-[#9AA3B2]"
            style={{ lineHeight: 1.5, overflow: 'hidden', minHeight: 36 }}
          />
        ) : (
          <p className="font-[Noto Sans] text-[14px] text-[#E7E9EE] whitespace-pre-wrap">
            {value || placeholder}
          </p>
        )}

        {/* Tombol kanan-atas */}
        {onAction && (
          <button
            type="button"
            onClick={onAction}
            title={actionLabel}
            className={[
              'group absolute z-10 overflow-hidden font-[Aldrich] text-[14px]',
              'flex items-center justify-center gap-2',
              'transition-all duration-200 ease-out',
              'hover:brightness-110',
              'hover:[box-shadow:0_0_14px_rgba(255,255,255,0.7)] focus:[box-shadow:0_0_14px_rgba(255,255,255,0.7)]',
              'focus:outline-none focus:ring-0 rounded'
            ].join(' ')}
            style={{
              top: actionOffset.top,
              right: actionOffset.right,
              width: actionSize.w,
              height: actionSize.h,
              border: 'none'
            }}
          >
            {/* background image */}
            {actionBgImage && (
              <img
                src={actionBgImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                draggable="false"
              />
            )}

            {/* konten tombol */}
            {actionIcon ? <span className="relative z-10">{actionIcon}</span> : null}
            <span className="relative z-10">{actionLabel}</span>
          </button>
        )}
      </div>
    </div>
  )
}

/** Path polygon cut-corner */
function getPathD(w, h, c) {
  if (!w || !h) return `M0,0 H1 V1 H0 Z`
  const cut = Math.max(0, c)
  return [`M ${cut} 0`, `H ${w}`, `V ${h - cut}`, `L ${w - cut} ${h}`, `H 0`, `V ${cut}`, `Z`].join(
    ' '
  )
}

/** Konversi HEX → RGBA */
function hexToRgba(hex, alpha = 1) {
  const h = hex.replace('#', '')
  const bigint = parseInt(
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h,
    16
  )
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
