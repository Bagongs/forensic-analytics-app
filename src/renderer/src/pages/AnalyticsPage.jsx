/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { handleRedirectContract } from '@renderer/shared/handleRedirectContract'

import HeaderBar from '../components/HeaderBar'
import ButtonStart from '@renderer/assets/image/button_start.svg'

import UploadSDPModal from '@renderer/components/UploadSDPModal'
import UploadAPKModal from '@renderer/components/UploadAPKModal'
import UploadProgress from '@renderer/components/UploadProgress'
import StartAnalyzingModal from '@renderer/components/StartAnalyzingModal'
import FilterMethodModal from '@renderer/components/FilterMethodModal'

import { useUploads } from '@renderer/store/uploads'
import { useAnalytics } from '@renderer/store/analytics'
import { FaFilePdf } from 'react-icons/fa6'

import { isValidMethod } from '@renderer/shared/analyticsMethods'
import { exportPdfWithToast } from '@renderer/shared/exportPdfWithToast'

/* ===== ICONS ===== */
function IconEye(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 5c5.5 0 9.5 4.6 10.5 6-.9 1.3-5 6-10.5 6S2.5 12.3 1.5 11C2.5 9.6 6.5 5 12 5Z"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
      <circle cx="12" cy="11" r="3" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  )
}
function IconSearch(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="11" cy="11" r="7" stroke="#FFFFFF" strokeWidth="2" />
      <path d="M20 20l-3-3" stroke="#FFFFFF" strokeWidth="2" />
    </svg>
  )
}
function IconFilter(props) {
  return (
    <svg viewBox="0 0 32 32" fill="#ffffff" stroke="#ffffff" width="18" height="18" {...props}>
      <path d="M12,25l6.67,6.67a1,1,0,0,0,.7.29.91.91,0,0,0,.39-.08,1,1,0,0,0,.61-.92V13.08L31.71,1.71A1,1,0,0,0,31.92.62,1,1,0,0,0,31,0H1A1,1,0,0,0,.08.62,1,1,0,0,0,.29,1.71L11.67,13.08V24.33A1,1,0,0,0,12,25ZM3.41,2H28.59l-10,10a1,1,0,0,0-.3.71V28.59l-4.66-4.67V12.67a1,1,0,0,0-.3-.71Z" />
    </svg>
  )
}

/* ===== UTILS ===== */
function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'

  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = d.getFullYear()
  return `${dd}/${mm}/${yy}`
}

function routeForMethod(method = '') {
  const key = String(method).toLowerCase()
  if (key.includes('contact')) return '/detail/contact-correlation'
  if (key.includes('deep')) return '/detail/deep-communication'
  if (key.includes('hash')) return '/detail/hashfile-analytics'
  if (key.includes('social')) return '/detail/social-media-correlation'
  return null
}

function normalizeUploadProgress(res) {
  const pctRaw =
    res?.progress ?? res?.percentage ?? res?.percent ?? res?.data?.progress ?? res?.data?.percentage
  const pct = Number.isFinite(Number(pctRaw)) ? Math.max(0, Math.min(100, Number(pctRaw))) : null
  const status = (res?.status ?? res?.upload_status ?? res?.data?.status ?? '')
    .toString()
    .toLowerCase()
  const message = res?.message ?? res?.data?.message ?? ''
  const fileId = res?.file_id ?? res?.data?.file_id ?? null
  return { pct, status, message, fileId }
}

function truncateText(text, max = 16) {
  if (!text) return '-'
  return text.length > max ? text.substring(0, max) + '...' : text
}

/**
 * Prefetch detail (silent).
 * Kalau BE bilang harus redirect → handled di goDetail catch.
 */
async function prefetchDetailSafe({ method, analytic_id }) {
  const a = window.api?.analytics
  if (!a) return

  const unwrap = (res) => {
    if (res?.ok === false) throw res.error ?? res
    return res?.data ?? res
  }

  if (typeof a.fetchByMethod === 'function') {
    const r = await a.fetchByMethod({ method, analytic_id })
    unwrap(r)
    return
  }

  const m = String(method || '').toLowerCase()
  if (m.includes('contact')) {
    const r = await (a.getContactCorrelation?.({ analytic_id }) ||
      a.contactCorrelation?.({ analytic_id }))
    unwrap(r)
    return
  }
  if (m.includes('hash')) {
    const r = await (a.getHashfileAnalytics?.({ analytic_id }) || a.hashfile?.({ analytic_id }))
    unwrap(r)
    return
  }
  if (m.includes('deep')) {
    const r = await (a.getDeepCommunication?.({ analytic_id }) ||
      a.deepCommunication?.({ analytic_id }))
    unwrap(r)
    return
  }
  if (m.includes('social')) {
    const r = await (a.getSocialMediaCorrelation?.({ analytic_id }) ||
      a.socialMediaCorrelation?.({ analytic_id }))
    unwrap(r)
    return
  }
}

/* ===================================================== */
export default function AnalyticsPage() {
  const nav = useNavigate()
  const { addUpload } = useUploads()
  const { addEntry } = useAnalytics()

  const [uploadedRows, setUploadedRows] = useState([])
  const [filesSearch] = useState('')
  const [filesFilter] = useState('All')

  const [historyRows, setHistoryRows] = useState([])
  const [historySearch, setHistorySearch] = useState('')
  const [methodFilter, setMethodFilter] = useState([])

  const [openSDP, setOpenSDP] = useState(false)
  const [openAPK, setOpenAPK] = useState(false)
  const [openStart, setOpenStart] = useState(false)
  const [openFilter, setOpenFilter] = useState(false)

  const [progOpen, setProgOpen] = useState(false)
  const [progPct, setProgPct] = useState(0)
  const [progStatus, setProgStatus] = useState('uploading')
  const [progLabel, setProgLabel] = useState('Uploading...')
  const [progFile, setProgFile] = useState({ filename: 'File', ext: 'sdp' })
  const pollingAbortRef = useRef(false)

  const [exportingId, setExportingId] = useState(null)

  const fetchUploaded = async ({ search = filesSearch, filter = filesFilter } = {}) => {
    try {
      const res = await window.api.files.getFiles({ search, filter })
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      setUploadedRows(arr)
    } catch (e) {
      console.error('getFiles error:', e)
      setUploadedRows([])
    }
  }

  const fetchHistory = async ({ search = '', methods = methodFilter } = {}) => {
    try {
      const methodParam = methods?.length ? methods.join(',') : undefined
      const res = await window.api.analytics.getAll({ search, method: methodParam })
      const arr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
      setHistoryRows(arr)
    } catch (e) {
      console.error('getAllAnalytics error:', e)
      setHistoryRows([])
    }
  }

  useEffect(() => {
    fetchUploaded({})
    fetchHistory({})
  }, [])

  const toggleMethodFilter = (val) =>
    setMethodFilter((prev) => (prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]))

  /* ========= CLIENT-SIDE SEARCH (like UserManagement.jsx) ========= */
  const filteredHistory = useMemo(() => {
    const s = historySearch.trim().toLowerCase()
    if (!s) return historyRows

    return historyRows.filter((row) => {
      const name = (row.name ?? row.analytic_name ?? '').toLowerCase()
      const methodStr = (row.method ?? row.methodLabel ?? '').toLowerCase()
      const summary = (row.summary ?? row.notes ?? '').toLowerCase()
      const dateStr = (row.date || formatDate(row.created_at) || '').toLowerCase()

      return name.includes(s) || methodStr.includes(s) || summary.includes(s) || dateStr.includes(s)
    })
  }, [historyRows, historySearch])

  const cancelUpload = () => {
    pollingAbortRef.current = true
    setProgStatus('error')
    setTimeout(() => {
      setProgOpen(false)
      setProgPct(0)
      setProgStatus('uploading')
      setProgLabel('Uploading...')
    }, 350)
  }

  return (
    <div className="w-full overflow-hidden">
      <HeaderBar />

      {/* === MAIN CONTAINER (no global scroll) === */}
      <div className="w-full px-12 2xl:mt-9">
        <h1 className="app-title text-[32px] text-left font-bold">ANALYTICS</h1>

        <div className="mt-2 grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* LEFT: Uploaded Data */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xl app-title">Uploaded Data</h2>
              <div className="flex gap-3">
                <button
                  onClick={() => setOpenSDP(true)}
                  className="px-4 py-2 text-sm font-semibold btn-upload text-[#0B0F17] hover:bg-[#EDC702] transition"
                >
                  Upload File
                </button>
                <button
                  onClick={() => setOpenAPK(true)}
                  className="px-4 py-2 text-sm font-semibold btn-upload text-[#0B0F17] hover:bg-[#EDC702] transition"
                >
                  Upload APK
                </button>
              </div>
            </div>

            <div className="panel flex flex-col text-sm bg-[#111720]">
              {/* === DESKTOP/TABLET TABLE (md+) === */}
              <div className="hidden md:block">
                {/* Header */}
                <div className="overflow-x-hidden">
                  <div
                    className="
                      grid text-sm bg-[#395070] text-[#EDC702] shrink-0
                      md:min-w-[760px]
                      md:grid-cols-[140px_220px_220px_minmax(0,1fr)]
                      [@media(min-width:2560px)_and_(max-height:1500px)]:min-w-[1100px]
                      [@media(min-width:2560px)_and_(max-height:1500px)]:grid-cols-[220px_320px_360px_minmax(0,1fr)]
                    "
                  >
                    <div className="px-4 py-3 font-semibold">Date</div>
                    <div className="px-4 py-3 font-semibold">File Name</div>
                    <div className="px-4 py-3 font-semibold">Method</div>
                    <div className="px-4 py-3 font-semibold">Notes</div>
                  </div>
                </div>

                {/* Scroll body only */}
                <div
                  className="
                  max-h-[550px] 2xl:max-h-[600px]
                  [@media(min-width:2560px)_and_(max-height:1500px)]:max-h-[900px]
                  overflow-y-auto divide-y bg-[#111720] divide-(--border)
                  scrollbar-thin scrollbar-thumb-[#394F6F] scrollbar-track-transparent
                  "
                >
                  {uploadedRows.length === 0 && (
                    <div className="px-4 py-6 text-sm text-center text-(--dim)">
                      Belum ada file di server.
                    </div>
                  )}

                  {uploadedRows.map((row) => {
                    const id =
                      row.id ?? row.file_id ?? row.upload_id ?? `${row.file_name}-${row.created_at}`
                    const date = row.created_at ?? row.date ?? row.uploaded_at
                    const fileName = row.file_name ?? row.name ?? 'Unnamed'
                    const methodStr = row.method ?? row.methodLabel ?? '-'
                    const notes = row.notes ?? ''

                    return (
                      <div key={id} className="overflow-x-hidden">
                        <div
                          className="
                            grid items-center hover:bg-[#0f1520]
                            md:min-w-[760px]
                            md:grid-cols-[140px_220px_220px_minmax(0,1fr)]
                            [@media(min-width:2560px)_and_(max-height:1500px)]:min-w-[1100px]
                            [@media(min-width:2560px)_and_(max-height:1500px)]:grid-cols-[220px_320px_360px_minmax(0,1fr)]
                          "
                          style={{ minHeight: 52 }}
                        >
                          <div className="px-4 py-3">{formatDate(date)}</div>

                          <div className="px-4 py-3 truncate" title={fileName}>
                            {truncateText(fileName, 20)}
                          </div>

                          <div className="px-4 py-3 truncate" title={methodStr}>
                            {truncateText(methodStr, 22)}
                          </div>

                          <div
                            className="px-4 py-3 overflow-hidden whitespace-nowrap"
                            title={notes || '-'}
                          >
                            {truncateText(notes, 14)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* === MOBILE VIEW (below md): card list === */}
              <div className="md:hidden">
                <div className="max-h-[550px] overflow-y-auto divide-y divide-(--border) scrollbar-thin scrollbar-thumb-[#394F6F] scrollbar-track-transparent">
                  {uploadedRows.length === 0 && (
                    <div className="px-4 py-6 text-sm text-center text-(--dim)">
                      Belum ada file di server.
                    </div>
                  )}

                  {uploadedRows.map((row) => {
                    const id =
                      row.id ?? row.file_id ?? row.upload_id ?? `${row.file_name}-${row.created_at}`
                    const date = row.created_at ?? row.date ?? row.uploaded_at
                    const fileName = row.file_name ?? row.name ?? 'Unnamed'
                    const methodStr = row.method ?? row.methodLabel ?? '-'
                    const notes = row.notes ?? ''

                    return (
                      <div key={id} className="p-4 space-y-2 hover:bg-[#0f1520]">
                        <div className="flex gap-2">
                          <div className="w-[90px] text-[#EDC702] font-semibold">Date</div>
                          <div className="text-white/90">{formatDate(date)}</div>
                        </div>

                        <div className="flex gap-2">
                          <div className="w-[90px] text-[#EDC702] font-semibold">File</div>
                          <div className="text-white/90 truncate" title={fileName}>
                            {truncateText(fileName, 40)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="w-[90px] text-[#EDC702] font-semibold">Method</div>
                          <div className="text-white/90 truncate" title={methodStr}>
                            {truncateText(methodStr, 40)}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <div className="w-[90px] text-[#EDC702] font-semibold">Notes</div>
                          <div className="text-white/90 truncate" title={notes || '-'}>
                            {truncateText(notes, 60)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT: Analytics History */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl app-title">Analytics History</h2>
              <div className="flex-1 flex items-center justify-end gap-3">
                <div className="flex items-center gap-2 px-3 py-2 border border-(--border) bg-(--panel) w-full max-w-[320px]">
                  <IconSearch />
                  <input
                    value={historySearch}
                    onChange={(e) => setHistorySearch(e.target.value)}
                    className="bg-transparent outline-none text-sm w-full"
                    placeholder="Search analytics"
                  />
                </div>
                <button
                  className="flex items-center gap-2 px-3 py-2 border btn-filter"
                  onClick={() => setOpenFilter(true)}
                >
                  <IconFilter />
                  <span className="text-sm">Filter</span>
                </button>
              </div>
            </div>

            <div className="panel flex flex-col bg-[#111720] mt-3.5">
              <div
                className="
                  grid text-sm bg-[#395070] text-[#EDC702] shrink-0
                  md:grid-cols-[120px_180px_160px_minmax(0,1fr)_120px]
                  [@media(min-width:2560px)_and_(max-height:1500px)]:md:grid-cols-[120px_300px_330px_minmax(0,1fr)_140px]
                "
              >
                <div className="px-4 py-3 font-semibold">Date</div>
                <div className="px-4 py-3 font-semibold">Analytics Name</div>
                <div className="px-3 py-3 font-semibold">Method</div>
                <div className="px-4 py-3 font-semibold">Summary</div>
                <div className="px-4 py-3 font-semibold text-center">Actions</div>
              </div>

              {/* Scroll body only */}
              <div
                className="
                  max-h-[550px] 2xl:max-h-[600px]
                  [@media(min-width:2560px)_and_(max-height:1500px)]:max-h-[900px]
                  overflow-y-auto divide-y bg-[#111720] divide-(--border)
                  scrollbar-thin scrollbar-thumb-[#394F6F] scrollbar-track-transparent
                  "
              >
                {filteredHistory.length === 0 && (
                  <div className="px-4 py-6 text-sm text-center text-(--dim)">
                    Belum ada history.
                  </div>
                )}

                {filteredHistory.map((row) => {
                  const notes = row.notes ?? row.summary ?? ''
                  const id = row.id ?? row.analytic_id ?? row.analysis_id
                  const name = row.name ?? row.analytic_name ?? 'Untitled'
                  const methodStr = row.method ?? row.methodLabel ?? ''

                  const isApk = methodStr.toLowerCase().includes('apk')
                  const target = isApk ? null : routeForMethod(methodStr)

                  const goDetail = async () => {
                    const baseState = { analysisId: id, method: methodStr, analysisName: name }

                    // 🔥 KHUSUS APK ANALYTICS
                    if (isApk) {
                      try {
                        // pakai IPC apk:get → apk.service.getApkAnalytic
                        const res = await window.api.apk.get({ analytic_id: id })
                        // res bentuknya: { status: 200, message: "Success", data: { ...detail... } }
                        const detail = res?.data || {}
                        const status = (detail.status || '').toString().toLowerCase()

                        const analyticName = detail.analytic_name || name
                        const fileSize = detail.file_size || '—'
                        const fileId = detail.file_id

                        let apkRoute = '/detail/apk-analytics'
                        if (status === 'scanned') {
                          apkRoute = '/detail/apk-analytics/result'
                        } else if (status === 'pending') {
                          apkRoute = '/detail/apk-analytics'
                        } else {
                          // fallback kalau status tidak dikenal → anggap belum di-scan
                          apkRoute = '/detail/apk-analytics'
                        }

                        startTransition(() => {
                          nav(apkRoute, {
                            state: {
                              ...baseState,
                              campaign: analyticName,
                              fileName: analyticName, // BE belum kirim file_name, jadi pakai analytic_name dulu
                              fileSize,
                              analyticId: id,
                              file_id: fileId
                            }
                          })
                        })
                      } catch (server) {
                        const redirected = handleRedirectContract(server, {
                          nav,
                          toast,
                          ctx: baseState
                        })
                        if (redirected) return

                        toast(server?.message || 'Unable to open APK analytics details', {
                          icon: '⚠️'
                        })
                      }
                      return
                    }

                    // ==== FLOW BIASA UNTUK METHOD NON-APK ====
                    if (!target || !id) return
                    try {
                      await prefetchDetailSafe({ method: methodStr, analytic_id: id })
                    } catch (server) {
                      const redirected = handleRedirectContract(server, {
                        nav,
                        toast,
                        ctx: { analysisId: id, method: methodStr, analysisName: name }
                      })
                      if (redirected) return

                      toast(server?.message || 'Unable to open analytics details', { icon: '⚠️' })
                      return
                    }

                    startTransition(() => {
                      nav(target, {
                        state: baseState
                      })
                    })
                  }

                  const downloading = exportingId === id
                  const downloadPdf = async () => {
                    if (downloading) return
                    await exportPdfWithToast({
                      analytic_id: id,
                      fileName: name,
                      setIsExporting: (flag) => setExportingId(flag ? id : null)
                    })
                  }

                  return (
                    <div
                      key={id}
                      className="
                        grid items-center text-sm hover:bg-[#0f1520] mt-1
                        md:grid-cols-[120px_180px_160px_minmax(0,1fr)_120px]
                        [@media(min-width:2560px)_and_(max-height:1500px)]:md:grid-cols-[120px_300px_330px_minmax(0,1fr)_140px]
                      "
                      style={{ minHeight: 52 }}
                    >
                      {/* Date */}
                      <div className="px-4 truncate">{row.date || formatDate(row.created_at)}</div>

                      {/* Name */}
                      <div className="px-4 truncate" title={name}>
                        {truncateText(name, 25)}
                      </div>

                      {/* Method */}
                      <div className="px-3 truncate" title={methodStr}>
                        {truncateText(methodStr, 40)}
                      </div>

                      {/* Summary */}
                      <div className="px-4 overflow-hidden whitespace-nowrap" title={notes || '-'}>
                        {truncateText(notes, 30)}
                      </div>

                      {/* Actions */}
                      <div className="px-2 flex justify-center gap-2">
                        <button
                          className="h-9 w-9 inline-flex items-center justify-center border border-(--border-icon) bg-(--bgicon) hover:bg-white/5 transition"
                          onClick={goDetail}
                          title="Open Detail"
                        >
                          <IconEye />
                        </button>
                        <button
                          className={`h-9 w-9 inline-flex items-center justify-center border border-(--border-icon) bg-(--bgicon) transition ${
                            downloading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/5'
                          }`}
                          onClick={downloadPdf}
                          title={downloading ? 'Exporting PDF...' : 'Download PDF'}
                          disabled={downloading}
                        >
                          <FaFilePdf size={18} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* CTA FIXED */}
      <div className="mt-5 left-0 right-0 bottom-10 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <button
            className="w-[200px] h-14 2xl:w-[230px] 2xl:h-[77px] relative inline-flex items-center justify-center px-14 py-5 text-xl"
            style={{ borderRadius: 20 }}
            onClick={() => setOpenStart(true)}
            disabled={uploadedRows.length === 0}
          >
            <img
              src={ButtonStart}
              alt="Start Button"
              className="absolute inset-0 w-full h-full object-contain"
            />
            <span className="relative z-10 font-bold text-[#0C0C0C] text-sm 2xl:text-base text-nowrap">
              Start Analyzing
            </span>
          </button>
        </div>
      </div>

      {/* ===== MODALS & PROGRESS ===== */}
      <UploadSDPModal
        open={openSDP}
        onCancel={() => setOpenSDP(false)}
        onNext={async ({ file_path, file_name, type, tools, method, notes }) => {
          setOpenSDP(false)
          setProgFile({ filename: file_name, ext: 'sdp' })
          setProgLabel('Uploading…')
          setProgPct(1)
          setProgStatus('uploading')
          setProgOpen(true)
          pollingAbortRef.current = false

          try {
            const res = await window.api.files.uploadData({
              filePath: file_path,
              file_name,
              notes,
              type,
              tools,
              method
            })

            if (res?.__error) {
              setProgLabel(res.message || 'Upload failed')
              setProgStatus('error')
              return
            }

            const uploadId = res?.data?.upload_id || res?.upload_id
            if (!uploadId) throw new Error('Upload ID tidak ditemukan')

            let done = false
            let lastStatus = ''
            let lastMessage = ''
            let lastPct = 0

            while (!done && !pollingAbortRef.current) {
              const raw = await window.api.files.uploadProgress({
                upload_id: uploadId,
                type: 'data'
              })

              const { pct, status, message } = normalizeUploadProgress(raw)
              const s = (status || '').toString().toLowerCase()
              const msg = message || ''

              if (Number.isFinite(pct)) {
                setProgPct(pct)
                lastPct = pct
              }

              setProgLabel(msg || s || 'Uploading…')
              lastStatus = s
              lastMessage = msg

              const isFailedStatus = s === 'failed'
              const isFailedMessage =
                msg.toLowerCase().includes('upload failed') ||
                msg.toLowerCase().includes('unknown upload status') ||
                msg.toLowerCase().includes('internal server error')

              if (isFailedStatus || isFailedMessage) {
                setProgStatus('error')
                setProgLabel(
                  msg ||
                    'Upload Failed! Please upload this file using tools yang sesuai, lalu coba lagi.'
                )
                pollingAbortRef.current = true
                done = true
                break
              }

              const isSuccessStatus = s === 'success' || s.includes('success')
              if (isSuccessStatus || (Number.isFinite(pct) && pct >= 100)) {
                done = true
                lastStatus = 'success'
              }

              await new Promise((r) => setTimeout(r, 800))
            }

            if (pollingAbortRef.current) return

            if (lastStatus === 'success') {
              setProgStatus('success')
              setProgLabel(lastMessage || 'Upload successful')
              if (lastPct < 100) setProgPct(100)
              setTimeout(() => setProgOpen(false), 600)
              fetchUploaded({})
            } else if (lastStatus === 'failed') {
              setProgStatus('error')
              setProgLabel(
                lastMessage ||
                  'Upload Failed! Please upload this file menggunakan tools yang sesuai kemudian coba lagi.'
              )
            }
          } catch (e) {
            console.error('UPLOAD ERROR RAW:', {
              message: e?.message,
              cause: e?.cause?.message,
              name: e?.name
            })

            const ax = e?.args?.[0] || e?.cause || e

            const backendMessage =
              ax?.readableMessage || ax?.response?.data?.message || ax?.message || 'Upload failed'

            setProgLabel(backendMessage)
            setProgStatus('error')
            pollingAbortRef.current = true
          }
        }}
      />

      <UploadAPKModal
        open={openAPK}
        onCancel={() => setOpenAPK(false)}
        onNext={async ({ analytic_name, file_id, file_name }) => {
          try {
            // 1) start analyzing dulu
            const res = await window.api.analytics.startAnalyzing({
              analytic_name,
              method: 'APK Analytics'
            })

            const analyticId =
              res?.data?.analytic?.id || res?.data?.analytic_id || res?.analytic_id || res?.id

            if (!analyticId) {
              throw new Error('startAnalyzing: analytic_id tidak ditemukan')
            }

            // 2) link analytic <-> file via store-analytic-file
            const linkRes = await window.api.analytics.storeAnalyticFile({
              analytic_id: analyticId,
              file_id
            })

            // karena di service kita pakai safePost, bentuknya = payload kontrak:
            // { status: 201, message: "...", data: {...} }
            if (linkRes?.status !== 201 && linkRes?.status !== 200) {
              throw new Error(linkRes?.message || 'store-analytic-file: status bukan 201/200')
            }

            // 3) kalau semua sukses → tutup modal dan pindah halaman detail
            setOpenAPK(false)
            nav('/detail/apk-analytics', {
              state: {
                campaign: analytic_name,
                analysisId: analyticId,
                fileName: file_name,
                fileSize: '—',
                analyticId,
                file_id
              }
            })
          } catch (e) {
            console.error('[APK flow] error:', e)
            // kalau kamu pakai toast:
            toast.error(e.message || 'Failed to start APK Analytics')
          }
        }}
      />

      <StartAnalyzingModal
        open={openStart}
        onCancel={() => setOpenStart(false)}
        onNext={async ({ name, method }) => {
          const payload = {
            analytic_name: String(name || '').trim(),
            method: String(method || '').trim()
          }
          if (!payload.analytic_name) {
            toast('Analytic name is required', { icon: '⚠️' })
            return
          }
          if (!isValidMethod(payload.method)) {
            toast(`Invalid method: ${payload.method}`, { icon: '⚠️' })
            return
          }
          try {
            const res = await window.api.analytics.startAnalyzing(payload)
            const analyticId =
              res?.data?.analytic?.id || res?.analytic_id || res?.data?.analytic_id || res?.id
            if (!analyticId) throw new Error('analytic_id tidak ditemukan')

            await fetchHistory({ search: '', methods: methodFilter })
            setOpenStart(false)
            nav('/analytics/devices', {
              state: {
                analysisId: analyticId,
                method: payload.method,
                analysisName: payload.analytic_name
              }
            })
          } catch (e) {
            const server = e
            toast('Failed to start analysis', { icon: '⚠️' })
          }
        }}
      />

      <FilterMethodModal
        open={openFilter}
        selected={methodFilter}
        onToggle={toggleMethodFilter}
        onApply={() => {
          setOpenFilter(false)
          fetchHistory({ search: '', methods: methodFilter })
        }}
        onClear={() => {
          setMethodFilter([])
          setOpenFilter(false)
          fetchHistory({ search: '', methods: [] })
        }}
        onClose={() => setOpenFilter(false)}
      />

      <UploadProgress
        open={progOpen}
        filename={progFile.filename}
        ext={progFile.ext}
        progress={progPct}
        text={progLabel}
        status={progStatus}
        onCancel={cancelUpload}
      />
    </div>
  )
}
