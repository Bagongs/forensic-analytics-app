/* eslint-disable react/prop-types */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

function columnsToTemplate(columns) {
  return columns
    .map((c) => (typeof c.width === 'number' ? `${c.width}px` : String(c.width || '1fr')))
    .join(' ')
}

/**
 * VirtualTable
 * Added:
 * - headerPlacement: 'inside' | 'outside' (default 'inside')
 * - minWidth
 * - rowBackground(index) → string
 * - className/headerClassName/rowClassName/cellClassName
 */
export default function VirtualTable({
  columns = [],
  rowCount = 0,
  rowHeight = 48,
  overscan = 10,
  maxBodyHeight = 520,
  minWidth = 760,
  getRow,
  renderCell,
  headerBg = '#395070',
  borderColor = '#293240',
  className = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = '',
  rowBackground,
  headerPlacement = 'inside' // << --- new
}) {
  const scrollRef = useRef(null)
  const rafRef = useRef(0)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportH, setViewportH] = useState(maxBodyHeight)

  // satu sumber kebenaran untuk grid
  const gridTemplateColumns = useMemo(() => columnsToTemplate(columns), [columns])

  // ukur container (tinggi viewport)
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setViewportH(el.clientHeight || maxBodyHeight)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [maxBodyHeight])

  // scrollTop (halus)
  const onScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      const y = scrollRef.current ? scrollRef.current.scrollTop : 0
      setScrollTop(y)
    })
  }, [])
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onScroll])

  // windowing
  const visible = Math.ceil(viewportH / rowHeight)
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(rowCount, start + visible + overscan * 2)
  const totalHeight = rowCount * rowHeight

  // UI helpers
  const HEADER_H = 52
  const StickyFirst = 'sticky left-0 z-20 [background:inherit]'

  const HeaderRow = ({ children }) => (
    <div
      className={`grid items-center ${headerClassName}`}
      style={{
        gridTemplateColumns,
        minWidth,
        height: HEADER_H,
        background: headerBg,
        borderBottom: `1px solid ${borderColor}`
      }}
    >
      {children}
    </div>
  )
  const HeaderCell = ({ children, sticky }) => (
    <div className={`px-4 py-3 font-[Aldrich] text-[#EDC702] ${sticky ? StickyFirst : ''}`}>
      {children}
    </div>
  )
  const BodyRow = ({ children, style, bg }) => (
    <div
      className={`grid items-center border-t ${rowClassName}`}
      style={{
        gridTemplateColumns,
        minWidth,
        borderColor,
        background: bg,
        ...style
      }}
    >
      {children}
    </div>
  )
  const Cell = ({ children, sticky, title }) => (
    <div
      className={`px-4 py-2 ${sticky ? StickyFirst : ''} ${cellClassName}`}
      title={title}
      style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
    >
      {children}
    </div>
  )

  // ==== RENDER ====
  return (
    <div className={className}>
      <div className="relative border" style={{ borderColor }}>
        {/* HEADER: pilih pola */}
        {headerPlacement === 'outside' ? (
          <div className="sticky top-0 z-30">
            <HeaderRow>
              {columns.map((col) => (
                <HeaderCell key={col.key} sticky={!!col.stickyLeft}>
                  {col.header}
                </HeaderCell>
              ))}
            </HeaderRow>
          </div>
        ) : null}

        {/* AREA SCROLL */}
        <div
          ref={scrollRef}
          className={`relative ${
            headerPlacement === 'inside' ? 'overflow-x-auto overflow-y-auto' : 'overflow-auto'
          }`}
          style={{ maxHeight: maxBodyHeight, willChange: 'transform' }}
        >
          {/* HEADER di dalam kontainer scroll (opsi lama) */}
          {headerPlacement === 'inside' ? (
            <div className="sticky top-0 z-30">
              <HeaderRow>
                {columns.map((col) => (
                  <HeaderCell key={col.key} sticky={!!col.stickyLeft}>
                    {col.header}
                  </HeaderCell>
                ))}
              </HeaderRow>
            </div>
          ) : null}

          {/* BODY (virtualized) */}
          <div style={{ height: totalHeight, position: 'relative' }}>
            {Array.from({ length: end - start }, (_, i) => {
              const index = start + i
              const row = getRow(index)
              const bg =
                typeof rowBackground === 'function'
                  ? rowBackground(index)
                  : index % 2 === 0
                    ? 'transparent'
                    : 'rgba(255,255,255,0.02)'

              return (
                <BodyRow
                  key={index}
                  bg={bg}
                  style={{
                    position: 'absolute',
                    top: index * rowHeight,
                    left: 0,
                    right: 0,
                    height: rowHeight
                  }}
                >
                  {columns.map((col, colIndex) => (
                    <Cell key={col.key} sticky={!!col.stickyLeft}>
                      {renderCell({ row, col, colIndex })}
                    </Cell>
                  ))}
                </BodyRow>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
