/* eslint-disable react/prop-types */
/* eslint-disable react-hooks/exhaustive-deps */
// src/renderer/src/pages/detail/HashfileAnalyticsPage.jsx
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState, useCallback, useLayoutEffect } from 'react'

import useAnalysisContext from '@renderer/hooks/useAnalysisContext'
import { useAnalyticsCache } from '@renderer/store/analyticsCache'
import { extractHttpMessage } from '@renderer/utils/httpError'
import { exportPdfWithToast } from '@renderer/shared/exportPdfWithToast'

import HeaderBar from '@renderer/components/HeaderBar'
import DeviceTabsInfo from '@renderer/components/analytics/DeviceTabsInfo'
import SummaryBox from '@renderer/components/common/SummaryBox'

import { TbFileExport } from 'react-icons/tb'
import { LiaEditSolid } from 'react-icons/lia'
import { FaRegSave } from 'react-icons/fa'

import exportBg from '@renderer/assets/image/export.svg'
import editBg from '@renderer/assets/icons/edit.svg'
import iconTrue from '@renderer/assets/icons/true.svg'
import iconFalse from '@renderer/assets/icons/false.svg'

const COLORS = {
  bgHeader: '#395070',
  gold: '#EDC702',
  border: '#394F6F'
}

/* ====================== Virtualizer util ====================== */
const ROW_HEIGHT = 48
const OVERSCAN = 10

function useVirtualRows(total, rowHeight, overscan, scrollRef) {
  const [viewportH, setViewportH] = useState(520)
  const [scrollTop, setScrollTop] = useState(0)

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight || 520))
    ro.observe(el)
    return () => ro.disconnect()
  }, [scrollRef])

  const rAF = useRef(0)
  const onScroll = useCallback(() => {
    if (rAF.current) cancelAnimationFrame(rAF.current)
    rAF.current = requestAnimationFrame(() => {
      const y = scrollRef.current ? scrollRef.current.scrollTop : 0
      setScrollTop(y)
    })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onScroll, scrollRef])

  const visibleCount = Math.ceil(viewportH / rowHeight)
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const end = Math.min(total, start + visibleCount + overscan * 2)

  return { start, end, totalHeight: total * rowHeight, viewportH }
}

/* ====================== UI helpers ====================== */
function SkeletonRow({ style, gridTemplateColumns, stickyBg }) {
  const colCount = gridTemplateColumns.split(' ').length
  return (
    <div
      className="grid items-center px-4 border-t border-[#293240] animate-pulse"
      style={{ ...style, gridTemplateColumns }}
    >
      {/* first sticky cell */}
      <div className="sticky left-0 z-20" style={{ background: stickyBg }}>
        <div className="h-3 w-[60%] rounded bg-white/10" />
      </div>
      {/* other cols */}
      {Array.from({ length: colCount - 1 }).map((_, i) => (
        <div key={i} className="px-2">
          <div className="h-3 w-[70%] rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({ message = 'No data available.' }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-70">{message}</div>
  )
}

/* ====================== Page ====================== */
export default function HashfileAnalyticsPage() {
  const nav = useNavigate()
  const { analysisId, method } = useAnalysisContext()

  const cache = useAnalyticsCache()
  const cached = cache.getResult(analysisId, method)

  const [data, setData] = useState(cached?.data || null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState('')

  const [summary, setSummary] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const savingRef = useRef(false)

  // Window tabs ↔ kolom tabel
  const [idx, setIdx] = useState(0)
  const windowSize = 4

  // Tombol export guard
  const [isExporting, setIsExporting] = useState(false)

  // === Fetch Hashfile Analytics ===
  const reloadRef = useRef(null)
  useEffect(() => {
    let mounted = true
    async function fetchNow() {
      setLoading(true)
      setError('')
      try {
        const res = await window.api.analytics.getHashfileAnalytics({ analytic_id: analysisId })
        if (!mounted) return
        const payload = res?.data || res
        setData(payload)
        cache.setResult(analysisId, method, payload)
        setSummary(String(payload?.summary || ''))
      } catch (e) {
        if (!mounted) return
        setError(extractHttpMessage(e, 'Gagal memuat Hashfile Analytics'))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    reloadRef.current = fetchNow
    fetchNow()
    return () => {
      mounted = false
    }
  }, [analysisId, method])

  // === Devices untuk tab ===
  const devices = useMemo(() => {
    const arr = data?.devices || []
    return arr.map((d, i) => ({
      id: d.device_label || i + 1,
      owner_name: d.owner_name || '-',
      phone_number: d.phone_number || '-'
    }))
  }, [data])

  // === Kolom tabel: semua label + label yang terlihat (window tabs) ===
  const deviceLabels = useMemo(() => (data?.devices || []).map((d) => d.device_label), [data])
  const visibleLabels = useMemo(
    () => deviceLabels.slice(idx, idx + Math.min(windowSize, deviceLabels.length)),
    [deviceLabels, idx]
  )

  // === Baris tabel: daftar file/hash (ringan untuk virtual render) ===
  const rows = useMemo(() => {
    const base = data?.correlations || []
    return base.map((c) => ({
      fileName: c.file_name,
      fileType: c.file_type,
      devicesSet: new Set(c.devices || []) // label device yang mengandung hash tsb
    }))
  }, [data])

  // Back handler → balik ke /analytics
  const onBack = useCallback(() => {
    requestAnimationFrame(() => {
      nav('/analytics', { replace: true })
    })
  }, [nav])

  // Export PDF (util + toast + guard)
  const nothingToExport = !error && !loading && rows.length === 0
  const disableExport = isExporting || loading || nothingToExport

  const onExportPdf = async () => {
    if (disableExport) return
    await exportPdfWithToast({
      analytic_id: analysisId,
      fileName: data?.analytic_name || 'hashfile-report',
      setIsExporting
    })
  }

  // Summary
  const actionLabel = isEditing ? 'Save' : summary.trim() ? 'Edit' : 'Add'
  const actionIcon = isEditing ? (
    <FaRegSave className="text-[16px]" />
  ) : (
    <LiaEditSolid className="text-[18px]" />
  )

  const onSummaryAction = async () => {
    if (!isEditing) {
      setIsEditing(true)
      return
    }
    if (savingRef.current) return
    savingRef.current = true
    try {
      await window.api.report.saveSummary({ analytic_id: analysisId, summary })
      setIsEditing(false)
    } catch (e) {
      alert(extractHttpMessage(e, 'Gagal menyimpan ringkasan'))
    } finally {
      savingRef.current = false
    }
  }

  /* ====================== Virtualized body ====================== */
  const scrollRef = useRef(null)
  const { start, end, totalHeight, viewportH } = useVirtualRows(
    rows.length,
    ROW_HEIGHT,
    OVERSCAN,
    scrollRef
  )

  const GRID_TEMPLATE = useMemo(() => {
    const repeat = visibleLabels.map(() => '160px').join(' ')
    return `${Math.max(34, 28)}% ${repeat}` // 34% untuk kolom "File Name"
  }, [visibleLabels])

  const onRetry = () => reloadRef.current?.()

  return (
    <div className="min-h-screen  text-[#E7E9EE] font-[Noto Sans]">
      <HeaderBar />

      {/* TITLE */}
      <div className="flex items-center justify-between px-8 2xl:pt-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-[#EDC702] text-[18px] font-[Aldrich] hover:opacity-80"
            title="Back to Analytics"
          >
            ←
          </button>
          <h1 className="font-[Aldrich] text-[22px] tracking-wide text-white">
            HASHFILE ANALYTICS
          </h1>
        </div>
      </div>

      {/* DEVICE TABS + EXPORT (sebaris) */}
      <div className="px-8 mt-4">
        <div className="flex items-center justify-between gap-4">
          <div
            className={`flex-1 min-w-0 ${loading || devices.length === 0 ? 'opacity-60 pointer-events-none' : ''}`}
          >
            <DeviceTabsInfo
              devices={devices}
              windowIndex={idx}
              windowSize={Math.min(windowSize, Math.max(1, devices.length))}
              onPrev={() => setIdx((v) => Math.max(0, v - 1))}
              onNext={() =>
                setIdx((v) => Math.min(Math.max(0, devices.length - windowSize), v + 1))
              }
            />
          </div>

          {/* Export PDF button */}
          <button
            onClick={onExportPdf}
            disabled={disableExport}
            className={`relative flex items-center gap-2 h-10 px-5 font-[Aldrich] text-[#172C48] text-[14px] overflow-hidden transition-all duration-200
              ${disableExport ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 hover:shadow-[0_0_12px_#EDC702]'}`}
            title={
              loading
                ? 'Loading…'
                : isExporting
                  ? 'Exporting PDF…'
                  : nothingToExport
                    ? 'Nothing to export'
                    : 'Export PDF'
            }
          >
            <img
              src={exportBg}
              alt="export-bg"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
            />
            <TbFileExport
              className={`text-[18px] relative z-10 ${isExporting ? 'animate-pulse' : ''}`}
            />
            <span className="relative z-10">{isExporting ? 'Exporting…' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* TABLE (header + virtualized body) */}
      <div className="px-8 mt-6">
        <div
          className="relative border"
          style={{ borderColor: COLORS.border }}
          aria-busy={loading ? 'true' : 'false'}
        >
          {/* HEADER */}
          <div
            className="grid items-center px-4"
            style={{
              background: COLORS.bgHeader,
              gridTemplateColumns: GRID_TEMPLATE,
              height: 52,
              position: 'sticky',
              top: 0,
              zIndex: 30
            }}
          >
            <div
              className="text-sm font-[Aldrich] text-[#EDC702] sticky left-0 z-40"
              style={{ background: COLORS.bgHeader }}
            >
              File Name
            </div>
            {visibleLabels.map((lbl, i) => (
              <div key={i} className="text-sm text-center font-[Aldrich] text-[#EDC702]">
                {lbl}
              </div>
            ))}
          </div>

          {/* BODY (virtualized + skeleton/empty/error) */}
          <div
            ref={scrollRef}
            className="relative overflow-auto"
            style={{ maxHeight: 520, willChange: 'transform' }}
          >
            <div style={{ height: loading ? viewportH : totalHeight, position: 'relative' }}>
              {/* Error overlay + Retry */}
              {error && !loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-300">
                  <div>{error}</div>
                  <button
                    onClick={onRetry}
                    className="px-3 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Loading skeleton rows */}
              {!error && loading && (
                <>
                  {Array.from({ length: Math.ceil((viewportH || 520) / ROW_HEIGHT) + 2 }).map(
                    (_, i) => {
                      const y = i * ROW_HEIGHT
                      return (
                        <SkeletonRow
                          key={i}
                          style={{
                            height: ROW_HEIGHT,
                            position: 'absolute',
                            top: y,
                            left: 0,
                            right: 0
                          }}
                          gridTemplateColumns={GRID_TEMPLATE}
                          stickyBg={i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                        />
                      )
                    }
                  )}
                </>
              )}

              {/* Empty state */}
              {!loading && !error && rows.length === 0 && (
                <EmptyState message="No hashfile data." />
              )}

              {/* Normal render */}
              {!loading && !error && rows.length > 0 && (
                <>
                  {rows.slice(start, end).map((row, i) => {
                    const rIdx = start + i
                    return (
                      <div
                        key={rIdx}
                        className="grid items-center px-4 border-t border-[#293240]"
                        style={{
                          gridTemplateColumns: GRID_TEMPLATE,
                          height: ROW_HEIGHT,
                          position: 'absolute',
                          top: rIdx * ROW_HEIGHT,
                          left: 0,
                          right: 0
                        }}
                      >
                        {/* sticky first cell */}
                        <div className="truncate sticky left-0 z-20" title={row.fileName}>
                          {row.fileName} <span className="opacity-60">({row.fileType})</span>
                        </div>

                        {/* presence per device (sesuai window tabs) */}
                        {visibleLabels.map((lbl, j) => {
                          const present = row.devicesSet.has(lbl)
                          return (
                            <div key={j} className="px-2">
                              <div className="w-full h-full flex items-center justify-center">
                                <img
                                  src={present ? iconTrue : iconFalse}
                                  alt={present ? 'present' : 'not-present'}
                                  className="w-5 h-5"
                                  loading="lazy"
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SUMMARY */}
      <div className="px-8 mt-8 pb-12">
        <SummaryBox
          title="Summary"
          value={summary}
          onChange={setSummary}
          placeholder="Click Add to write summary"
          editable={isEditing}
          actionLabel={actionLabel}
          actionIcon={actionIcon}
          actionBgImage={editBg}
          // actionSize={{ w: 131.6227, h: 58.389 }}
          actionOffset={{ top: 15, right: 24 }}
          onAction={onSummaryAction}
        />
      </div>
    </div>
  )
}
