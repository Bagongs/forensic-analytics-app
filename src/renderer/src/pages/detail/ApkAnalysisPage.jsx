// src/renderer/src/pages/detail/ApkAnalysisPage.jsx
import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'

import HeaderBar from '@renderer/components/HeaderBar'
import APKCard from '@renderer/components/apk/APKCard'
import LoadingModal from '@renderer/components/LoadingModal'
import ButtonStart from '@renderer/assets/image/button_start.svg'
import backIcon from '@renderer/assets/icons/back.svg'

export default function ApkAnalysisPage() {
  const nav = useNavigate()
  const { state } = useLocation()

  // ===== data yang dikirim dari AnalyticsPage (wajib ada analyticId & file_id) =====
  const campaign = state?.campaign || 'APK Analysis'
  const fileName = state?.fileName || 'package.apk'
  const fileSize = state?.fileSize || '—'
  const analyticId = state?.analyticId ?? state?.analysisId
  const fileId = state?.file_id

  // ===== UI state =====
  const [loadingOpen, setLoadingOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  // validasi: kalau pentingnya tidak ada, balik
  useEffect(() => {
    if (!analyticId || !fileId) {
      console.error('[ApkAnalysisPage] missing state:', { analyticId, fileId })
    }
  }, [analyticId, fileId, nav])

  const startDisabled = useMemo(() => !analyticId || !fileId || busy, [analyticId, fileId, busy])

  // === trigger analyze-apk ===
  const handleStart = async () => {
    if (startDisabled) return
    setBusy(true)
    setLoadingOpen(true)
    try {
      // PENTING: service apk.analyze harus POST + query params (sudah kamu perbaiki di main/services)
      await window.api.apk.analyze({ file_id: fileId, analytic_id: analyticId })

      // Sukses → langsung ke halaman result (halaman result nanti GET /apk-analytic?analytic_id=...)
      nav('/detail/apk-analytics/result', {
        state: { campaign, fileName, fileSize, analyticId }
      })
    } catch (e) {
      // tampilkan alasan dari server jika ada
      console.error('[APK analyze] error:', e?.response?.data || e)
      // TODO: kalau ada util toast, panggil di sini
    } finally {
      setLoadingOpen(false)
      setBusy(false)
    }
  }

  return (
    <div className="w-full min-h-full">
      <HeaderBar />

      {/* Frame utama */}
      <div className="mx-auto px-8 py-8" style={{ maxWidth: 1680 }}>
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => nav(-1)}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              style={{ color: 'var(--text)' }}
              aria-label="Back"
              title="Back"
            >
              <img src={backIcon} alt="" className="w-[26px] h-[26px] opacity-90" />
            </button>

            <h1
              className="select-none"
              style={{ fontFamily: 'Aldrich, sans-serif', fontSize: 36, letterSpacing: '0.02em' }}
            >
              {campaign}
            </h1>
          </div>

          <div style={{ width: 160 }} />
        </div>

        {/* CONTENT */}
        <div className="mt-8">
          <div className="grid gap-8 justify-center" style={{ gridTemplateColumns: '369px' }}>
            <APKCard fileName={fileName} fileSize={fileSize} footerId={`ID ${analyticId || '-'}`} />
          </div>
        </div>

        {/* Divider */}
        <div
          className="mt-10 mb-10 w-full"
          style={{ border: '1px solid #FFFFFF', opacity: 0.25 }}
        />
      </div>

      {/* BOTTOM CTA */}
      <div className="fixed left-0 right-0 bottom-16 flex justify-center pointer-events-none z-50">
        <div className="pointer-events-auto">
          <button
            className="relative inline-flex items-center justify-center border-none disabled:opacity-50 disabled:pointer-events-none"
            style={{
              width: 318,
              height: 77,
              borderRadius: 14,
              fontSize: 18,
              fontFamily: 'Aldrich, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.03em',
              color: '#0C0C0C'
            }}
            disabled={startDisabled}
            onClick={handleStart}
          >
            <img
              src={ButtonStart}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              draggable="false"
            />
            <span className="relative z-10 pointer-events-none">
              {busy ? 'Processing…' : 'Start Data Extractions'}
            </span>
          </button>
        </div>
      </div>

      {/* Loading modal saat proses analyze */}
      <LoadingModal open={loadingOpen} onClose={() => setLoadingOpen(false)} />
    </div>
  )
}
