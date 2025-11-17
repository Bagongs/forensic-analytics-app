// src/renderer/src/pages/DeviceSelectionPage.jsx

import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import HeaderBar from '@renderer/components/HeaderBar'
import { useAnalytics } from '@renderer/store/analytics'
import ButtonStart from '@renderer/assets/image/button_start.svg'
import DeviceCard from '@renderer/components/DeviceCard'
import backIcon from '@renderer/assets/icons/back.svg'
import AddDeviceModal from '@renderer/components/AddDeviceModal'
import LoadingModal from '@renderer/components/LoadingModal'

const MIN_DEVICES = 2

/* Route helper: map method → detail path */
function routeForMethod(method = '') {
  const key = String(method).toLowerCase()
  if (key.includes('contact')) return '/detail/contact-correlation'
  if (key.includes('deep')) return '/detail/deep-communication'
  if (key.includes('hash')) return '/detail/hashfile-analytics'
  if (key.includes('social')) return '/detail/social-media-correlation'
  if (key.includes('apk')) return '/detail/apk-analytics'
  return null
}

/* id file dari berbagai kemungkinan field */
const filePrimaryId = (f) => f?.id ?? f?.file_id ?? f?.upload_id ?? null

/* Normalisasi item device dari BE → model untuk DeviceCard */
function toDeviceCardModel(d) {
  const fid = filePrimaryId(d.file) ?? filePrimaryId(d)
  return {
    id: d?.device_id ?? d?.id ?? fid ?? Math.random().toString(36).slice(2),
    type: d?.type || d?.file?.type || 'Unknown',
    ownerName: d?.name ?? d?.owner_name ?? '-',
    phoneNumber: d?.phone_number ?? '-',
    fileName: d?.file?.file_name ?? d?.file_name ?? '-',
    fileSize: d?.file?.total_size_formatted ?? d?.total_size_formatted ?? '—',
    deviceId: d?.device_id ? `ID ${d.device_id}` : fid ? `ID ${fid}` : 'ID –',
    file_id: fid
  }
}

/* (Opsional) Prefetch data setelah start extraction agar halaman detail punya data awal */
async function prefetchAfterStart({ method, analytic_id }) {
  try {
    await window.api.analytics.fetchByMethod({ method, analytic_id })
  } catch (e) {
    console.warn('[prefetchAfterStart] error:', e?.response?.data || e)
  }
}

export default function DeviceSelectionPage() {
  const nav = useNavigate()
  const { state } = useLocation()

  const analysisId = state?.analysisId || null
  const selectedMethodFromState = state?.method || ''

  // (opsional) ambil judul dari store history
  const history = useAnalytics((s) => s.history)
  const current = useMemo(() => history.find((h) => h.id === analysisId), [history, analysisId])

  // sumber kebenaran method = state.method (dari StartAnalyzing)
  const method = selectedMethodFromState || current?.method || ''

  // === devices dari BE
  const [devices, setDevices] = useState([])
  const [usedFileIds, setUsedFileIds] = useState([])
  const [addOpen, setAddOpen] = useState(false)

  // === files untuk modal (server-side)
  const [serverFiles, setServerFiles] = useState([])
  const [filesLoading, setFilesLoading] = useState(false)

  // === loading modal (untuk start-extraction)
  const [loadingOpen, setLoadingOpen] = useState(false)
  const timersRef = useRef([])
  const startingRef = useRef(false)

  /* Ambil devices dari BE */
  const refreshDevices = useCallback(async () => {
    if (!analysisId) return
    try {
      const res = await window.api.analytics.getDevices({ analytic_id: analysisId })
      const serverDevices = res?.data?.devices || res?.devices || res || []
      const mapped = (Array.isArray(serverDevices) ? serverDevices : []).map(toDeviceCardModel)
      setDevices(mapped)
      setUsedFileIds(mapped.map((d) => d.file_id).filter(Boolean))
    } catch (e) {
      console.error('[getDevices] error:', e)
      setDevices([])
      setUsedFileIds([])
    }
  }, [analysisId])

  useEffect(() => {
    refreshDevices()
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
      timersRef.current = []
    }
  }, [refreshDevices])

  /* Ambil files dari BE, filter berdasar method yang dipilih & exclude usedFileIds */
  const loadFilesFromServer = useCallback(async () => {
    try {
      setFilesLoading(true)
      const filterVal = method && method !== 'All' ? method : undefined
      const res = await window.api.files.getFiles({ search: '', filter: filterVal })
      const rawArr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      // jaga-jaga: pastikan cocok method di sisi FE bila BE mengembalikan campuran
      const filteredByMethod = rawArr.filter((f) => {
        const m = (f?.method || '').trim()
        return filterVal ? m === filterVal : true
      })

      const filtered = filteredByMethod.filter((f) => !usedFileIds.includes(filePrimaryId(f)))
      setServerFiles(filtered)
    } catch (e) {
      console.error('[getFiles] error:', e)
      setServerFiles([])
    } finally {
      setFilesLoading(false)
    }
  }, [method, usedFileIds])

  // saat modal dibuka → load files
  useEffect(() => {
    if (addOpen) loadFilesFromServer()
  }, [addOpen, loadFilesFromServer])

  /* Submit dari modal → BE add-device → refresh → tutup modal */
  const handleAddFromModal = async ({ ownerName, phoneNumber, file }) => {
    try {
      const file_id = filePrimaryId(file)
      if (!file_id) throw new Error('file_id tidak ditemukan pada file terpilih')

      await window.api.analytics.addDevice({
        file_id,
        name: ownerName,
        phone_number: phoneNumber
      })
      await refreshDevices()
      setAddOpen(false)
    } catch (e) {
      console.error('[addDevice] error:', e?.response?.data || e)
      alert(
        e?.response?.data?.message ||
          'Gagal menambahkan device. Pastikan file sesuai metode & belum dipakai.'
      )
    }
  }

  /* Start extraction → sesuai kontrak: analytic_id di query */
  const startDisabled = devices.length < MIN_DEVICES

  const handleStart = async () => {
    if (startDisabled || !analysisId || startingRef.current) return
    try {
      startingRef.current = true
      setLoadingOpen(true)

      // 1) Hit kontrak start-extraction (query param)
      const res = await window.api.analytics.startExtraction({ analytic_id: analysisId })
      const payload = res?.data || res // antisipasi variasi shape
      const methodFromBE = payload?.method || method

      // 2) (Opsional) Prefetch data awal berdasarkan method dari BE (lebih andal)
      await prefetchAfterStart({ method: methodFromBE, analytic_id: analysisId })

      // 3) Navigate ke halaman detail
      const target = routeForMethod(methodFromBE)
      if (target) {
        nav(target, { state: { analysisId, method: methodFromBE } })
      } else {
        console.warn('Detail route not implemented for method:', methodFromBE)
      }
    } catch (e) {
      console.error('[startExtraction] error:', e?.response?.data || e)
      alert(
        e?.response?.data?.message ||
          'Gagal memulai extraction. Cek koneksi dan pastikan minimal 2 device.'
      )
    } finally {
      setLoadingOpen(false)
      startingRef.current = false
    }
  }

  return (
    <div className="w-full min-h-full">
      <HeaderBar />

      {/* Frame konten lebar agar muat 5 kartu */}
      <div className="mx-auto px-8 py-8" style={{ maxWidth: 1680 }}>
        {/* TOP BAR */}
        <div className="flex items-center justify-between">
          {/* kiri: back + title besar */}
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
              {current?.name || state?.analysisName || 'Choose Device'}
            </h1>
          </div>

          {/* kanan: counter + Add Device */}
          <div className="flex items-center gap-4">
            <div
              className="select-none"
              style={{ fontFamily: 'Aldrich, sans-serif', fontSize: 28, letterSpacing: '0.02em' }}
            >
              Device ({devices.length})
            </div>

            <button
              className="px-5 h-[46px] text-sm"
              onClick={() => setAddOpen(true)}
              style={{
                background:
                  'radial-gradient(50% 50% at 50% 50%, #EDC702 0%, rgba(237,199,2,0.7) 100%)',
                border: '3px solid #EDC702B2',
                color: '#101217',
                fontFamily: 'Aldrich, sans-serif',
                fontWeight: 700
              }}
            >
              Add Device
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="mt-8">
          {devices.length === 0 ? (
            <div className="grid gap-8" style={{ gridTemplateColumns: '369px' }}>
              <DeviceCard empty />
            </div>
          ) : (
            <div
              className="grid gap-x-10 gap-y-12 justify-start"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(369px, 369px))' }}
            >
              {devices.map((d, i) => (
                <DeviceCard
                  key={d.id}
                  index={i}
                  ownerName={d.ownerName}
                  phoneNumber={d.phoneNumber}
                  fileName={d.fileName}
                  fileSize={d.fileSize}
                  deviceId={d.deviceId}
                />
              ))}
            </div>
          )}
        </div>

        {/* Divider putih di bawah grid */}
        <div
          className="mt-10 mb-10 w-full"
          style={{ border: '1px solid #FFFFFF', opacity: 0.25 }}
        />

        {devices.length > 0 && devices.length < MIN_DEVICES && (
          <div className="text-center text-sm" style={{ color: 'var(--dim)' }}>
            Minimal {MIN_DEVICES} device untuk memulai data extraction.
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div className="fixed left-0 right-0 bottom-16 flex justify-center pointer-events-auto z-50">
        <div className="pointer-events-auto">
          <button
            className="relative inline-flex items-center justify-center border-none disabled:opacity-50 disabled:pointer-events-auto"
            style={{
              width: 318,
              height: 77,
              borderRadius: 14,
              fontSize: 18,
              fontFamily: 'Aldrich, sans-serif',
              fontWeight: 700,
              letterSpacing: '0.03em',
              color: '#0C0C0C',
              filter: startDisabled ? 'grayscale(0.4) brightness(0.9)' : 'none'
            }}
            disabled={startDisabled}
            onClick={handleStart}
          >
            <img
              src={ButtonStart}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-auto"
              draggable="false"
            />
            <span className="relative z-10 pointer-events-auto">Start Data Extractions</span>
          </button>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <AddDeviceModal
        open={addOpen}
        method={method}
        files={serverFiles}
        usedFileIds={usedFileIds}
        loading={filesLoading}
        onCancel={() => setAddOpen(false)}
        onNext={handleAddFromModal}
      />

      {/* Loading saat start-extraction */}
      <LoadingModal open={loadingOpen} onClose={() => setLoadingOpen(false)} />
    </div>
  )
}
