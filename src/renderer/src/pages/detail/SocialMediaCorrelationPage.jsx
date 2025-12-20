/* eslint-disable react/prop-types */

// src/renderer/src/pages/detail/SocialMediaCorrelationPage.jsx

import { useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

import HeaderBar from '@renderer/components/HeaderBar'
import DeviceTabsInfo from '@renderer/components/analytics/DeviceTabsInfo'
import SummaryBox from '@renderer/components/common/SummaryBox'
import SelectField from '@renderer/components/SelectField'
import { exportPdfWithToast } from '@renderer/shared/exportPdfWithToast'
import { extractHttpMessage } from '@renderer/utils/httpError'

import { TbFileExport } from 'react-icons/tb'
import { LiaEditSolid } from 'react-icons/lia'
import { FaRegSave } from 'react-icons/fa'
import { IoIosArrowRoundBack } from 'react-icons/io'

import exportBg from '@renderer/assets/image/export.svg'
import editBg from '@renderer/assets/icons/edit.svg'

/* ================== KONSTAN & WARNA (UI tetap) ================== */
const COLORS = {
  gold: '#EDC702',
  border: '#394F6F',
  panel: '#151D28',
  tableBg: '#0B0F17',
  text: '#E7E9EE',
  white: '#F4F6F8',
  diamondActiveBg: '#322A01'
}

// 🔒 Platform fixed
const PLATFORMS = ['Instagram', 'Facebook', 'Whatsapp', 'Tiktok', 'Telegram', 'X']
const PLATFORM_OPTIONS = PLATFORMS.map((p) => ({ value: p, label: p }))

/* ============ helpers defensive ============ */
function toArray(x) {
  if (Array.isArray(x)) return x
  if (x === null || x === undefined) return []
  return [x]
}
function toStringSafe(v) {
  if (v === null || v === undefined) return ''
  return String(v)
}
function normalizePlatformKey(raw) {
  const s = toStringSafe(raw).trim()
  if (!s) return ''
  const match = PLATFORMS.find((p) => p.toLowerCase() === s.toLowerCase())
  return match || s
}

// bersihkan invisible unicode, jika kosong → "Unknown"
function cleanName(raw) {
  const s = toStringSafe(raw)

  // 1) buang zero-width + direction marks + BOM
  let out = s.replace(/[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/g, '')

  // 2) buang karakter "kosong tapi bukan whitespace"
  // - \u3164  : Hangul Filler (ㅤ)
  // - \u2800  : Braille Pattern Blank
  // - \u115F\u1160 : Hangul Jamo fillers
  out = out.replace(/[\u3164\u2800\u115F\u1160]/g, '')

  // 3) NBSP → spasi, lalu trim
  out = out.replace(/\u00A0/g, ' ').trim()

  // 4) kalau kosong → Unknown
  if (!out) return 'Unknown'
  return out
}

/* ============ komponen kecil (UI tetap) ============ */
function SquareCheckbox({ active }) {
  return (
    <span
      className="inline-flex items-center justify-center"
      style={{
        width: 18,
        height: 18,
        border: `1px solid ${active ? COLORS.gold : COLORS.white}`,
        position: 'relative',
        background: 'transparent'
      }}
    >
      {active && (
        <span
          style={{
            width: 12,
            height: 12,
            transform: 'rotate(45deg)',
            background: COLORS.gold,
            display: 'inline-block'
          }}
        />
      )}
    </span>
  )
}

function ContactRow({ name, highlighted, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 text-left transition-all"
      style={{
        borderBottom: `1px solid ${COLORS.border}`,
        background: highlighted ? COLORS.diamondActiveBg : 'transparent',
        border: highlighted ? `1px solid ${COLORS.gold}` : 'none',
        color: COLORS.text
      }}
      title={name}
    >
      <SquareCheckbox active={highlighted} />
      <span className="text-[14px]">{name}</span>
    </button>
  )
}

function ColumnSkeleton({ rows = 10 }) {
  return (
    <div style={{ border: `1px solid ${COLORS.white}`, maxHeight: 360, overflowY: 'auto' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="px-4 py-2 animate-pulse"
          style={{ borderBottom: `1px solid ${COLORS.border}` }}
        >
          <div className="h-3 w-[70%] rounded bg-white/10" />
        </div>
      ))}
    </div>
  )
}

/* ================== HALAMAN FINAL ================== */
export default function SocialMediaCorrelationPage() {
  const nav = useNavigate()
  const { state } = useLocation()

  // ====== derive analytic id/name once ======
  const analyticId =
    state?.analysisId || state?.analytic_id || state?.id || state?.analyticId || undefined
  const analyticName =
    state?.analysisName || state?.analytic_name || state?.name || 'social-media-correlation-report'

  // ====== UI state ======
  const [platform, setPlatform] = useState('Instagram')
  const [query, setQuery] = useState('')

  /**
   * ✅ selection berdasarkan ROW/Bucket (cluster)
   * kalau klik salah satu nama, kita pilih barisnya:
   * { rowIdx, label } | null
   */
  const [selectedRow, setSelectedRow] = useState(null)

  // ====== Data API ======
  const [devices, setDevices] = useState([])
  const [totalDevices, setTotalDevices] = useState(0)

  /**
   * ✅ simpan item per device:
   * {
   *   Instagram: [
   *     [ {name,label,rowIdx}, ... ], // device 1
   *     [ {name,label,rowIdx}, ... ], // device 2
   *     ...
   *   ]
   * }
   */
  const [itemsByPlatformByDevice, setItemsByPlatformByDevice] = useState({})

  // summary
  const [summary, setSummary] = useState('')

  // status
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const reloadRef = useRef(null)

  // export & summary
  const [isExporting, setIsExporting] = useState(false)
  const [editing, setEditing] = useState(false)
  const savingRef = useRef(false)

  const actionLabel = editing ? 'Save' : summary?.trim() ? 'Edit' : 'Add'
  const actionIcon = editing ? (
    <FaRegSave className="text-[16px]" />
  ) : (
    <LiaEditSolid className="text-[18px]" />
  )

  // ====== Fetch dari API (setiap platform berubah → hit endpoint) ======
  useEffect(() => {
    let mounted = true

    async function fetchNow() {
      setLoading(true)
      setError('')
      try {
        const res = await window.api.analytics.getSocialMediaCorrelation({
          analytic_id: analyticId,
          platform
        })
        if (!mounted) return
        const payload = res?.data || res

        // total devices (fallback)
        const td = Number(payload?.total_devices || payload?.totalDevices || 0)
        setTotalDevices(Number.isFinite(td) ? td : 0)

        // devices untuk tabs
        const devs = toArray(payload?.devices).map((d, i) => ({
          id: toStringSafe(d?.device_label || d?.device_id || i + 1),
          owner_name: toStringSafe(d?.owner_name || '—'),
          phone_number: toStringSafe(d?.phone_number || '—')
        }))
        setDevices(devs)

        const corrObj = payload?.correlations || {}
        const deviceCount =
          devs.length || Number(payload?.total_devices || payload?.devices?.length || 0) || 1

        const perPlatform = {}

        for (const [pfRaw, pfVal] of Object.entries(corrObj)) {
          const pfKey = normalizePlatformKey(pfRaw)
          if (!pfKey) continue

          const deviceLists = Array.from({ length: deviceCount }, () => [])

          let rowIdxGlobal = 0 // ✅ row index global untuk platform ini
          const buckets = toArray(pfVal?.buckets)

          for (const b of buckets) {
            const label = toStringSafe(b?.label || '').trim() || '0 koneksi'
            const rows = toArray(b?.devices) // rows = [ [dev1,dev2,dev3], ... ]

            for (const row of rows) {
              if (!Array.isArray(row)) continue

              for (let j = 0; j < deviceCount; j++) {
                deviceLists[j].push({
                  name: cleanName(row[j]), // ✅ nama dari JSON buckets.devices
                  label, // ✅ label dari bucket
                  rowIdx: rowIdxGlobal // ✅ kunci untuk highlight 1 cluster
                })
              }

              rowIdxGlobal++
            }
          }

          perPlatform[pfKey] = deviceLists
        }

        // pastikan semua platform selalu punya key
        for (const pf of PLATFORMS) {
          if (!perPlatform[pf]) {
            perPlatform[pf] = Array.from({ length: deviceCount }, () => [])
          }
        }

        setItemsByPlatformByDevice(perPlatform)
        setSummary(toStringSafe(payload?.summary || ''))

        // reset selection
        setSelectedRow(null)
      } catch (e) {
        if (!mounted) return
        setError(extractHttpMessage(e, 'Failed to load Social Media Correlation'))
        console.warn('[SMC] fetch error:', e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    reloadRef.current = fetchNow
    fetchNow()

    return () => {
      mounted = false
    }
  }, [platform, analyticId])

  // ===== jumlah kolom contact = jumlah device =====
  const contactColumnsCount = useMemo(() => {
    const lists = itemsByPlatformByDevice[platform]
    if (lists && Array.isArray(lists) && lists.length > 0) return lists.length

    const n = devices.length || totalDevices || 1
    return Math.max(1, n)
  }, [itemsByPlatformByDevice, platform, devices.length, totalDevices])

  // ===== columns per device + search filter =====
  const columns = useMemo(() => {
    const deviceLists = itemsByPlatformByDevice[platform] || []

    let cols =
      deviceLists.length > 0
        ? deviceLists.map((list) => [...list])
        : Array.from({ length: contactColumnsCount }, () => [])

    const q = query.trim().toLowerCase()
    if (!q) return cols

    // filter hanya berdasarkan name, tapi item tetap bawa rowIdx/label
    return cols.map((list) => list.filter((it) => (it.name || '').toLowerCase().includes(q)))
  }, [itemsByPlatformByDevice, platform, query, contactColumnsCount])

  // ✅ koneksi dari label bucket pada row yang dipilih
  const koneksiLabel = useMemo(() => {
    if (!selectedRow) return ''
    return toStringSafe(selectedRow.label || '')
  }, [selectedRow])

  const totalItems = useMemo(() => columns.reduce((s, arr) => s + arr.length, 0), [columns])
  const nothingToExport = !error && !loading && totalItems === 0
  const disableExport = isExporting || loading || nothingToExport

  const onExportPdf = async () => {
    if (disableExport) return
    await exportPdfWithToast({
      analytic_id: analyticId,
      fileName: analyticName,
      setIsExporting
    })
  }

  const onSummaryAction = async () => {
    if (!editing) return setEditing(true)
    if (savingRef.current) return

    savingRef.current = true
    try {
      await window.api.report.saveSummary({
        analytic_id: analyticId,
        summary: summary
      })
      setEditing(false)
    } catch (e) {
      alert(extractHttpMessage(e, 'Failed to save the summary'))
    } finally {
      savingRef.current = false
    }
  }

  return (
    <div className="min-h-screen text-[#E7E9EE] font-[Noto Sans]">
      <HeaderBar />

      {/* TITLE (tetap) */}
      <div className="flex items-center justify-between px-8 2xl:pt-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => nav('/analytics', { replace: true })}
            className="flex items-center justify-center w-[46px] h-[46px] hover:opacity-80 transition"
            aria-label="Back"
          >
            <IoIosArrowRoundBack color="#EDC702" size={46} style={{ marginLeft: '-4px' }} />
          </button>
          <h1 className="font-[Aldrich] text-[22px] tracking-wide text-white">
            SOCIAL MEDIA CORRELATION{analyticName ? ` — ${analyticName}` : ''}
          </h1>
        </div>
      </div>

      {/* DEVICE TABS + EXPORT (UI tetap) */}
      <div className="px-8 mt-4">
        <div className="flex items-center justify-between gap-4">
          <div
            className={`flex-1 min-w-0 ${
              loading || devices.length === 0 ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {devices.length > 0 ? (
              <DeviceTabsInfo
                devices={devices}
                windowIndex={0}
                windowSize={Math.min(4, devices.length)}
                onPrev={() => {}}
                onNext={() => {}}
              />
            ) : (
              <div
                className="h-10 flex items-center px-3 rounded border"
                style={{ borderColor: COLORS.border }}
              >
                <span className="opacity-70 text-sm">No devices</span>
              </div>
            )}
          </div>

          <button
            onClick={onExportPdf}
            disabled={disableExport}
            className={`relative flex items-center gap-2 h-10 px-5 font-[Aldrich] text-[#172C48] text-[14px] overflow-hidden transition-all duration-200 ${
              disableExport
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:brightness-110 hover:shadow-[0_0_12px_#EDC702]'
            }`}
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

      {/* ====== AREA TABEL (UI tetap) ====== */}
      <div className="px-8 mt-6">
        <div className="w-full" style={{ background: COLORS.tableBg }}>
          {/* Header area tabel (tetap) */}
          <div className="px-6 pt-6 flex items-center gap-4">
            <h2 className="font-[Aldrich] text-[36px] ">Similarity Contacted Sosmed</h2>

            <div className="ml-auto flex items-center gap-4">
              <div style={{ width: 337 }}>
                <SelectField
                  value={platform}
                  onChange={(v) => {
                    setPlatform(v)
                    setSelectedRow(null)
                  }}
                  options={PLATFORM_OPTIONS}
                  placeholder="Select platform"
                />
              </div>

              <div
                className="flex items-center gap-2 px-3 py-2 border h-12"
                style={{ borderColor: COLORS.border, background: COLORS.panel }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="#FFFFFF" strokeWidth="2" />
                  <path d="M20 20l-3-3" stroke="#FFFFFF" strokeWidth="2" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent outline-none text-sm w-[220px]"
                  placeholder="Search"
                />
              </div>
            </div>
          </div>

          {/* Isi tabel (tetap) */}
          <div className="px-6 pb-6 pt-4 flex items-stretch gap-10">
            {/* Koneksi (sesuai label bucket row terpilih) */}
            <div className="shrink-0 flex items-center" style={{ width: 200 }}>
              <div className="font-[Aldrich] text-[36px]" style={{ color: COLORS.gold }}>
                {selectedRow ? koneksiLabel : 'Pilih nama'}
              </div>
            </div>

            {/* Kolom-kolom */}
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-6 min-w-max pr-2">
                {/* Loading → skeleton sesuai jumlah device */}
                {loading &&
                  Array.from({ length: contactColumnsCount }).map((_, colIdx) => (
                    <div key={`sk-${colIdx}`} className="shrink-0 p-3" style={{ width: 260 }}>
                      <div className="text-center mb-2">
                        <div className="font-[Aldrich]" style={{ color: COLORS.text }}>
                          {`Contact ${colIdx + 1}`}
                        </div>
                        <div
                          className="mx-auto mt-1 h-0.5 w-24"
                          style={{ background: COLORS.white }}
                        />
                      </div>
                      <ColumnSkeleton rows={10} />
                    </div>
                  ))}

                {/* Error */}
                {!loading && error && (
                  <div className="px-4 py-8 text-center text-red-300 min-w-[300px]">
                    {error}
                    <div className="mt-3">
                      <button
                        onClick={() => reloadRef.current?.()}
                        className="px-3 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}

                {/* Normal/Empty per kolom */}
                {!loading &&
                  !error &&
                  columns.map((items, colIdx) => (
                    <div key={colIdx} className="shrink-0 p-3" style={{ width: 260 }}>
                      <div className="text-center mb-2">
                        <div className="font-[Aldrich]" style={{ color: COLORS.text }}>
                          {`Contact ${colIdx + 1}`}
                        </div>
                        <div
                          className="mx-auto mt-1 h-0.5 w-24"
                          style={{ background: COLORS.white }}
                        />
                      </div>

                      <div
                        style={{
                          border: `1px solid ${COLORS.white}`,
                          maxHeight: 360,
                          overflowY: 'auto'
                        }}
                      >
                        {items.length === 0 ? (
                          <div className="px-4 py-8 text-center opacity-60">
                            – No data for “{platform}” –
                          </div>
                        ) : (
                          items.map((it, idx) => {
                            // ✅ highlight = semua item yg rowIdx sama dengan selectedRow.rowIdx
                            const highlighted = !!selectedRow && it.rowIdx === selectedRow.rowIdx
                            return (
                              <ContactRow
                                key={`${colIdx}:${idx}:${it.name}:${it.rowIdx}`}
                                name={it.name}
                                highlighted={highlighted}
                                onClick={() =>
                                  setSelectedRow((prev) =>
                                    prev?.rowIdx === it.rowIdx
                                      ? null
                                      : { rowIdx: it.rowIdx, label: it.label }
                                  )
                                }
                              />
                            )
                          })
                        )}
                      </div>
                    </div>
                  ))}
              </div>
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
          editable={editing}
          actionLabel={actionLabel}
          actionIcon={actionIcon}
          actionBgImage={editBg}
          actionOffset={{ top: 15, right: 24 }}
          onAction={onSummaryAction}
          maxBodyHeight={240}
          autoGrow={false}
        />
      </div>
    </div>
  )
}
