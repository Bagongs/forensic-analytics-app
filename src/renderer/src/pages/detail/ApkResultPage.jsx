/* eslint-disable no-empty */
/* eslint-disable react/prop-types */
// src/renderer/src/pages/detail/ApkResultPage.jsx
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import HeaderBar from '@renderer/components/HeaderBar'
import SummaryBox from '@renderer/components/common/SummaryBox'
import { TbFileExport } from 'react-icons/tb'
import { LiaEditSolid } from 'react-icons/lia'
import { FaRegSave } from 'react-icons/fa'

import editBg from '@renderer/assets/icons/edit.svg'
import exportBg from '@renderer/assets/image/export.svg'
import { exportPdfWithToast } from '@renderer/shared/exportPdfWithToast'

export default function ApkResultPage() {
  const nav = useNavigate()
  const { state } = useLocation()

  // ===== ambil context dari state, lalu fallback ke sessionStorage agar survive refresh =====
  let analyticId = state?.analyticId ?? state?.analysisId ?? null
  let campaign = state?.campaign || 'APK Analysis'
  let fileName = state?.fileName || 'package.apk'
  let fileSize = state?.fileSize || '—'
  try {
    if (!analyticId) {
      const saved = JSON.parse(sessionStorage.getItem('apk.ctx') || '{}')
      analyticId = saved.analyticId ?? analyticId
      campaign = state?.campaign ?? saved.analytic_name ?? campaign
      fileName = state?.fileName ?? saved.file_name ?? fileName
      // fileSize tidak disimpan di ctx; biarkan fallback '—'
    }
  } catch {}

  // ===== state data =====
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState(null) // { malware_scoring, permissions: [...] }

  // ===== fetch data dari BE =====
  useEffect(() => {
    let mounted = true
    ;(async () => {
      if (!analyticId) {
        setErrorMsg('analytic_id tidak ditemukan')
        setLoading(false)
        return
      }
      setLoading(true)
      setErrorMsg('')
      try {
        const res = await window.api.apk.get({ analytic_id: analyticId })
        // Normalisasi respons (fleksibel)
        const root = res?.data ?? res
        // BE bisa kirim { data: {...} } atau langsung {...}
        const data = (root && root.data && typeof root.data === 'object' ? root.data : root) || {}

        // Pastikan permissions array
        const perms = Array.isArray(data.permissions) ? data.permissions : []
        const scoring = Number(data.malware_scoring ?? 0)

        if (mounted) {
          setResult({ malware_scoring: scoring, permissions: perms })
        }
      } catch (e) {
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          e?.message ||
          'Failed to fetch APK analytic.'
        if (mounted) setErrorMsg(msg)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [analyticId])

  // ===== derive view data =====
  const malwareScore = Number(result?.malware_scoring ?? 0)
  const rows = useMemo(
    () => (Array.isArray(result?.permissions) ? result.permissions : []),
    [result]
  )

  // tags (hitung dari permissions)
  const tags = useMemo(() => {
    if (!rows?.length) return { malicious: 0, common: 0, total: 0 }
    let malicious = 0
    let common = 0
    for (const r of rows) {
      const t = String(r?.type || '').toLowerCase()
      if (t === 'malicious') malicious += 1
      else if (t === 'common') common += 1
    }
    return { malicious, common, total: rows.length }
  }, [rows])

  // summary
  const [summary, setSummary] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const actionLabel = isEditing ? 'Save' : summary.trim() ? 'Edit' : 'Add'
  const actionIcon = isEditing ? (
    <FaRegSave className="text-[16px]" />
  ) : (
    <LiaEditSolid className="text-[18px]" />
  )
  const handleSummaryAction = () => {
    if (!isEditing) return setIsEditing(true)
    // TODO: kalau mau simpan ke server: window.api.report.saveSummary({ analytic_id: analyticId, summary })
    setIsEditing(false)
  }

  // filter table by tag
  const [activeTag, setActiveTag] = useState('malicious')
  const filteredRows = useMemo(() => {
    if (!rows?.length) return []
    return rows.filter((r) =>
      activeTag === 'malicious'
        ? String(r.type).toLowerCase() !== 'common'
        : String(r.type).toLowerCase() !== 'malicious'
    )
  }, [rows, activeTag])

  // color score
  const scoreColor = useMemo(() => {
    if (malwareScore >= 60) return '#ED4D4D'
    if (malwareScore >= 30) return '#EDC702'
    return '#4ADE80'
  }, [malwareScore])

  // export (gunakan util yang sudah ada di project-mu)
  const handleExport = async () => {
    try {
      if (!analyticId) return window.print()
      await exportPdfWithToast({
        analytic_id: analyticId,
        fileName: campaign || 'APK Analysis'
      })
    } catch {
      window.print()
    }
  }

  // loading / error state
  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden text-white bg-[#101621]">
        <HeaderBar />
        <div className="h-[calc(100vh-64px)] grid place-items-center">
          <div className="text-white/80">Loading APK analytic…</div>
        </div>
      </div>
    )
  }
  if (errorMsg) {
    return (
      <div className="w-screen h-screen overflow-hidden text-white bg-[#101621]">
        <HeaderBar />
        <div className="p-6">
          <button
            onClick={() => nav(-1)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded hover:bg-white/10"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EDC702"
              strokeWidth="2"
            >
              <path d="M15 18L9 12l6-6" />
            </svg>
            Back
          </button>
          <div className="mt-6 text-red-400">Error: {String(errorMsg)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen overflow-hidden text-white bg-[#101621]">
      <HeaderBar />

      {/* === TOP BAR === */}
      <div className="flex items-center justify-between px-[3vw] pt-[2vh]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => nav('/analytics', { replace: true })}
            className="hover:opacity-80 transition"
            aria-label="Back"
          >
            <svg
              width="46"
              height="46"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#EDC702"
              strokeWidth="2"
            >
              <path d="M15 18L9 12l6-6" />
            </svg>
          </button>
          <h1 className="font-[Aldrich] text-[1.3vw] tracking-wide">APK ANALYSIS</h1>
        </div>

        <button
          onClick={handleExport}
          className="relative flex items-center gap-2 h-[2.5vw] px-[1.5vw] font-[Aldrich] text-[#172C48] text-[0.8vw] overflow-hidden hover:brightness-110 hover:shadow-[0_0_12px_#EDC702] transition"
        >
          <img
            src={exportBg}
            alt="export"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <TbFileExport className="text-[1vw] relative z-10" />
          <span className="relative z-10">Export PDF</span>
        </button>
      </div>

      {/* === MAIN CONTAINER === */}
      <div className="px-[3vw] mt-[2vh] flex justify-center">
        <div
          className="rounded-[10px] p-[2vw] flex flex-col"
          style={{
            width: '94vw',
            height: '91vh',
            background: '#161E2A',
            border: '1.5px solid #C3CFE0'
          }}
        >
          {/* FILE HEADER */}
          <div className="text-center mb-[1vh]">
            <h2 className="text-[1.7vw] font-[Aldrich]">{fileName}</h2>
            <div className="mt-[0.5vh] text-white/80 text-[0.9vw]">File size {fileSize}</div>
          </div>

          {/* PANEL DALAM */}
          <div
            className="mx-auto rounded-md flex flex-col min-h-0"
            style={{
              width: '81%',
              height: '74%',
              background: '#233043',
              border: '1.5px solid #394F6F',
              boxSizing: 'border-box',
              padding: '1.2vw'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-[1.2vh]">
              <div className="text-white/85 text-[1vw] font-semibold">Tags</div>
              <div className="text-white/85 text-[1vw] font-semibold">
                Malware Probability:{' '}
                <span className="font-bold" style={{ color: scoreColor }}>
                  {malwareScore}%
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px" style={{ background: 'rgba(57,79,111,0.6)' }} />

            {/* Split layout */}
            <div className="flex gap-0.5 pt-[2vh] min-h-0 flex-1">
              {/* LEFT: Tag Buttons */}
              <div className="w-[22%] min-w-[13vw] flex flex-col gap-[2vh]">
                <TagButton
                  label="Malicious"
                  numerator={tags.malicious}
                  denominator={tags.total}
                  active={activeTag === 'malicious'}
                  onClick={() => setActiveTag('malicious')}
                />
                <TagButton
                  label="Common"
                  numerator={tags.common}
                  denominator={tags.total}
                  active={activeTag === 'common'}
                  onClick={() => setActiveTag('common')}
                />
              </div>

              {/* RIGHT: Table */}
              <div
                className="p-2.5"
                style={{
                  borderLeft: '2px solid #2A3A51',
                  borderTop: '2px solid #232B63',
                  borderRight: 'none',
                  borderBottom: 'none',
                  background: 'transparent'
                }}
              >
                <div
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                  style={{
                    borderLeft: 'none',
                    borderTop: 'none',
                    background: 'rgba(0,0,0,0.15)'
                  }}
                >
                  {/* Header tabel */}
                  <div
                    className="grid grid-cols-[20vw_1fr] px-[1vw] py-[0.6vw] text-[0.85vw] font-semibold border-b"
                    style={{ background: '#395070', color: '#E9EFF6', borderColor: '#394F6F' }}
                  >
                    <div>Permission / Item</div>
                    <div>Description</div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-auto">
                    {filteredRows.length ? (
                      filteredRows.map((r, i) => (
                        <div
                          key={r.id ?? r.permission_id ?? i}
                          className="grid grid-cols-[20vw_1fr] px-[1vw] py-[0.6vw] text-[0.85vw] border-b hover:bg-[#2C3A4D]/40 transition"
                          style={{ borderColor: 'rgba(57,79,111,0.55)' }}
                        >
                          <div className="pr-[0.8vw]">
                            {r.item || r.permission || r.name || '-'}
                          </div>
                          <div className="text-white/85">
                            {r.description || r.explain || r.desc || '-'}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-6 text-center text-white/70 text-sm">No findings.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* END PANEL */}
        </div>
      </div>

      {/* SUMMARY BOX */}
      <div className="px-[3vw] mt-[2vh] pb-[3vh]">
        <SummaryBox
          title="Summary"
          value={summary}
          onChange={setSummary}
          placeholder="Click Add to write summary"
          editable={isEditing}
          actionLabel={actionLabel}
          actionIcon={actionIcon}
          actionBgImage={editBg}
          actionSize={{ w: 131.6, h: 58.4 }}
          actionOffset={{ top: 22, right: 24 }}
          onAction={handleSummaryAction}
        />
      </div>
    </div>
  )
}

/* ===================== TagButton (center text, stripe belakang) ===================== */
function TagButton({ label, numerator, denominator, active, onClick }) {
  const base = {
    position: 'relative',
    display: 'block',
    width: '100%',
    padding: '14px 16px',
    transition: 'transform 150ms ease, opacity 150ms ease',
    outline: 'none',
    fontFamily: 'Aldrich, sans-serif',
    borderRadius: 0
  }

  const inactive = {
    backgroundBlendMode: 'overlay',
    borderColor: '#212D3E'
  }
  const activeOuter = {
    background: 'linear-gradient(270deg, rgba(17, 24, 34, 0.7) 0%, rgba(17, 24, 34, 0.05) 28%)',
    borderImageSource: 'linear-gradient(90deg, #143051 0%, #153354 40.98%, #153354 100%)',
    borderImageSlice: 1,
    borderImageWidth: 1,
    borderRadius: 0
  }

  const innerBase = {
    position: 'relative',
    borderRadius: 0,
    padding: '14px 18px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '72px'
  }

  const innerInactive = {
    background: 'linear-gradient(180deg, #111720 0%, #111720 100%)',
    backgroundBlendMode: 'overlay',
    borderWidth: '2.15px 0 2.15px 0',
    borderStyle: 'solid',
    borderColor: '#212D3E'
  }

  const innerActive = {
    background: 'linear-gradient(180deg, #111720 0%, #111720 100%)',
    backgroundBlendMode: 'overlay',
    borderWidth: '2.15px 0 2.15px 0',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderImageSource: 'linear-gradient(90deg, #143051 0%, #153354 40.98%, #153354 100%)',
    borderImageSlice: 1,
    borderImageWidth: 1
  }

  const stripeLayer = {
    position: 'absolute',
    inset: 0,
    borderRadius: 0,
    pointerEvents: 'none',
    zIndex: 0,
    background: 'repeating-linear-gradient(-24deg, #171F2C 0 1px, transparent 1px 14px)'
  }

  const contentWrap = { position: 'relative', zIndex: 1 }

  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="group w-full text-left hover:opacity-95 focus:outline-none active:scale-[0.99]"
      style={{ ...base, ...(active ? activeOuter : inactive) }}
    >
      {active && (
        <span
          aria-hidden
          className="absolute top-0 -right-0.5 h-full w-1 bg-[#466086]"
          style={{ boxShadow: '0 0 10px rgba(5,199,180,0.35)' }}
        />
      )}

      <div style={{ ...innerBase, ...(active ? innerActive : innerInactive) }}>
        {active && <span aria-hidden style={stripeLayer} />}
        <div style={contentWrap}>
          <div
            className="leading-none"
            style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 700, letterSpacing: '0.2px' }}
          >
            {label}
          </div>

          <div className="mt-2 flex items-center justify-center gap-1">
            <span style={{ color: '#ED4D4D', fontSize: 16, fontWeight: 700 }}>{numerator}</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>/</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}>{denominator}</span>
          </div>
        </div>
      </div>
    </button>
  )
}
