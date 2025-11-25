/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
// src/renderer/src/pages/DeviceSelectionPage.jsx

import { useLocation, useNavigate } from 'react-router-dom'
import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { handleRedirectContract } from '@renderer/shared/handleRedirectContract'

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
  } catch {}
}

export default function DeviceSelectionPage() {
  const nav = useNavigate()
  const { state } = useLocation()

  // ===== ambil context dari state dulu, fallback ke sessionStorage
  let ss = null
  try {
    ss = JSON.parse(sessionStorage.getItem('analysis.context') || 'null')
  } catch {}

  const analysisId = state?.analysisId || ss?.analysisId || null
  const selectedMethodFromState = state?.method || ss?.method || ''

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
      setDevices([])
      setUsedFileIds([])
    }
  }, [analysisId])

  useEffect(() => {
    refreshDevices()
  }, [refreshDevices])

  /* Ambil files dari BE, filter berdasar method yang dipilih & exclude usedFileIds */
  const loadFilesFromServer = useCallback(async () => {
    try {
      setFilesLoading(true)
      const filterVal = method && method !== 'All' ? method : undefined
      const res = await window.api.files.getFiles({ search: '', filter: filterVal })
      const rawArr = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []

      const filteredByMethod = rawArr.filter((f) => {
        const m = (f?.method || '').trim()
        return filterVal ? m === filterVal : true
      })

      const filtered = filteredByMethod.filter((f) => !usedFileIds.includes(filePrimaryId(f)))
      setServerFiles(filtered)
    } catch {
      setServerFiles([])
    } finally {
      setFilesLoading(false)
    }
  }, [method, usedFileIds])

  useEffect(() => {
    if (addOpen) loadFilesFromServer()
  }, [addOpen, loadFilesFromServer])

  /* Submit dari modal → BE add-device → refresh → tutup modal */
  const handleAddFromModal = async ({ ownerName, phoneNumber, file }) => {
    try {
      const file_id = filePrimaryId(file)
      if (!file_id) throw new Error('file_id tidak ditemukan')

      await window.api.analytics.addDevice({
        file_id,
        name: ownerName,
        phone_number: phoneNumber,
        analytic_id: analysisId
      })
      await refreshDevices()
      setAddOpen(false)
    } catch (e) {
      const server = e
      toast(server?.message || 'Gagal menambahkan device', { icon: '⚠️' })
    }
  }

  /* Start extraction → sesuai kontrak: analytic_id di query */
  const startDisabled = devices.length < MIN_DEVICES

  const handleStart = async () => {
    if (startDisabled || !analysisId || startingRef.current) return
    try {
      startingRef.current = true
      setLoadingOpen(true)

      const res = await window.api.analytics.startExtraction({ analytic_id: analysisId })
      const payload = res?.data || res
      const methodFromBE = payload?.method || method

      await prefetchAfterStart({ method: methodFromBE, analytic_id: analysisId })

      const target = routeForMethod(methodFromBE)
      if (target) {
        nav(target, { state: { analysisId, method: methodFromBE } })
      } else {
        toast(`Detail route not implemented for method: ${methodFromBE}`, { icon: '⚠️' })
      }
    } catch (e) {
      const server = e

      const redirected = handleRedirectContract(server, {
        nav,
        toast,
        ctx: {
          analysisId,
          method,
          analysisName: current?.name || state?.analysisName
        }
      })
      if (redirected) return

      toast(server?.message || 'Gagal memulai extraction', { icon: '⚠️' })
    } finally {
      setLoadingOpen(false)
      startingRef.current = false
    }
  }

  return (
    <div className="w-full min-h-full">
      <HeaderBar />

      {/* Frame konten:
          default (13.3”) max 1680
          27” QHD (2560×1440) max lebih lebar supaya 5 kartu muat tanpa scroll
      */}
      <div
        className="
          mx-auto px-8 py-8 max-w-[1680px]
          [@media(min-width:2560px)_and_(max-height:1500px)]:max-w-[2200px]
        "
      >
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
              style={{ fontFamily: 'Aldrich, sans-serif', fontSize: 36, letterSpacing: '-0.05em' }}
            >
              {current?.name || state?.analysisName || 'Choose Device'}
            </h1>
          </div>

          {/* kanan: counter + Add Device */}
          <div className="flex items-center gap-8">
            <div
              className="select-none"
              style={{ fontFamily: 'Aldrich, sans-serif', fontSize: 28, letterSpacing: '0em' }}
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
              className="
                grid py-2
                gap-x-10 overflow-x-auto overflow-y-hidden
                grid-flow-col auto-cols-[369px]

                /* 27” QHD: bukan carousel, tapi wrap multi-row dan tanpa scroll X */
                [@media(min-width:2560px)_and_(max-height:1500px)]:overflow-x-hidden
                [@media(min-width:2560px)_and_(max-height:1500px)]:gap-x-8
                [@media(min-width:2560px)_and_(max-height:1500px)]:gap-y-8
                [@media(min-width:2560px)_and_(max-height:1500px)]:grid-flow-row
                [@media(min-width:2560px)_and_(max-height:1500px)]:grid-cols-[repeat(auto-fit,369px)]
                [@media(min-width:2560px)_and_(max-height:1500px)]:justify-between
              "
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
        <div className="mt-5 w-full" style={{ border: '1px solid #FFFFFF', opacity: 0.25 }} />

        {devices.length > 0 && devices.length < MIN_DEVICES && (
          <div className="text-center text-sm" style={{ color: 'var(--dim)' }}>
            Minimal {MIN_DEVICES} device untuk memulai data extraction.
          </div>
        )}
      </div>

      {/* BOTTOM CTA */}
      <div className=" flex justify-center pointer-events-auto z-50">
        <div className="pointer-events-auto">
          <button
            className="w-[200px] h-14 2xl:w-[230px] 2xl:h-[77px] relative inline-flex items-center justify-center border-none disabled:opacity-50 disabled:pointer-events-auto"
            style={{
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
            <span className="relative z-10 pointer-events-auto text-xs 2xl:text-sm">
              Start Data Extractions
            </span>
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
