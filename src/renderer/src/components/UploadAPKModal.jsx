/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from 'react'
import Modal from './Modal'
import UploadProgress from './UploadProgress'
import AnalyticsCampaignModal from './apk/AnalyticsCampaignModal'
import toast from 'react-hot-toast'

/* ===== Progress normalizer (toleran variasi BE) ===== */
function normalizeUploadProgress(res) {
  const pctRaw =
    res?.percentage ??
    res?.percent ??
    res?.progress ??
    res?.data?.percentage ??
    res?.data?.percent ??
    res?.data?.progress
  const pct = Number.isFinite(Number(pctRaw)) ? Math.min(100, Math.max(0, Number(pctRaw))) : null
  const status = (res?.upload_status ?? res?.status ?? res?.data?.status ?? '')
    .toString()
    .toLowerCase()
  const message = res?.message ?? res?.data?.message ?? ''
  return { pct, status, message }
}

export default function UploadAPKModal({ open, onCancel, onNext }) {
  const [step, setStep] = useState('upload') // 'upload' | 'progress' | 'campaign'
  const [name, setName] = useState('') // nama analytic (opsional dari step ini)
  const [fileObj, setFileObj] = useState(null) // File dari <input> (opsional, hanya untuk tampilan)
  const [picked, setPicked] = useState(null) // { file_path, file_name } dari native picker
  const [busy, setBusy] = useState(false)

  const [pct, setPct] = useState(0)
  const [label, setLabel] = useState('Uploading APK…')
  const [status, setStatus] = useState('uploading')

  const abortRef = useRef(false)
  const uploadMetaRef = useRef({
    upload_id: null,
    file_id: null,
    file_name: null,
    size_label: null
  })

  useEffect(() => {
    if (!open) {
      // reset state saat modal ditutup
      setStep('upload')
      setName('')
      setFileObj(null)
      setPicked(null)
      setPct(0)
      setLabel('Uploading APK…')
      setStatus('uploading')
      setBusy(false)
      abortRef.current = false
      uploadMetaRef.current = { upload_id: null, file_id: null, file_name: null, size_label: null }
    }
  }, [open])

  const handleBrowseNative = async () => {
    if (busy) return
    const f = await window.api.files.chooseAPK()
    // expected: { file_path, file_name }
    if (f?.file_path) {
      setPicked(f)
      setFileObj(null)
    }
  }

  const handleFileInput = (e) => {
    const f = e.target.files?.[0] ?? null
    if (!f) return

    const fileName = f.name

    const ipaStrict = /^[A-Za-z0-9_-]+\.ipa$/i

    if (!ipaStrict.test(fileName)) {
      toast.error('Filename is not allowed. only .ipa accepted')
      e.target.value = ''
      return
    }

    setFileObj(f)
    setPicked((prev) => ({ ...(prev || {}), file_name: f.name }))
  }

  const getUploadSource = () => {
    if (picked?.file_path) {
      return { filePath: picked.file_path, fileName: picked.file_name || name || 'package.apk' }
    }
    if (fileObj) {
      // kebanyakan environment Electron tidak expose absolute path dari <input type="file">
      throw new Error(
        'File dipilih dari input. Klik tombol "Upload" untuk memilih file via dialog agar path absolut tersedia.'
      )
    }
    throw new Error('Silakan pilih file APK terlebih dahulu.')
  }

  const doUpload = async () => {
    if (busy) return
    if (!name && !picked?.file_name && !fileObj?.name) {
      // setidaknya ada nama untuk ditampilkan; campaign final tetap di step berikutnya
      setName('APK Analysis')
    }
    setBusy(true)
    try {
      const { filePath, fileName } = getUploadSource()

      setStep('progress')
      setPct(1)
      setStatus('uploading')
      setLabel('Uploading APK…')
      abortRef.current = false

      // 1) INIT UPLOAD
      const res = await window.api.apk.upload({ filePath, file_name: fileName })
      const uploadId = res?.data?.upload_id || res?.upload_id || res?.data?.data?.upload_id
      if (!uploadId) throw new Error('Upload ID tidak ditemukan dari /upload-apk')

      uploadMetaRef.current.file_name = fileName
      uploadMetaRef.current.upload_id = uploadId

      // 2) POLLING
      let done = false
      let last = null
      while (!done && !abortRef.current) {
        const p = await window.api.files.uploadProgress({ upload_id: uploadId, type: 'apk' })
        last = p
        const { pct: ppct, status: pstatus, message } = normalizeUploadProgress(p)
        if (ppct !== null) setPct(ppct)
        if (message) setLabel(message)
        if (String(pstatus || '').includes('success')) done = true
        await new Promise((r) => setTimeout(r, 700))
      }
      if (abortRef.current) return

      // 3) Ambil file_id & size
      const data = last?.data
      const first = Array.isArray(data) ? data[0] : data || {}
      const fileId = first?.file_id ?? last?.file_id ?? last?.data?.file_id ?? null
      const sizeLabel =
        first?.total_size_formatted ??
        first?.size ??
        last?.size ??
        (fileObj ? `${(fileObj.size / 1024 / 1024).toFixed(2)} MB` : '—')

      if (!fileId) {
        throw new Error(
          'Upload selesai tetapi file_id tidak ditemukan. Pastikan BE mengembalikan file_id pada /upload-progress (Success).'
        )
      }

      uploadMetaRef.current.file_id = fileId
      uploadMetaRef.current.size_label = sizeLabel

      setPct(100)
      setStatus('success')
      setLabel('Upload complete')

      // 4) Masuk ke step campaign
      setTimeout(() => setStep('campaign'), 400)
    } catch (e) {
      console.error('[UploadAPKModal] upload error:', e)
      setStatus('error')
      setLabel(e?.message || 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const resetAll = () => {
    if (step === 'progress') abortRef.current = true
    setStep('upload')
    setName('')
    setFileObj(null)
    setPicked(null)
    setPct(0)
    setLabel('Uploading APK…')
    setStatus('uploading')
    setBusy(false)
    uploadMetaRef.current = { upload_id: null, file_id: null, file_name: null, size_label: null }
    onCancel?.()
  }

  return (
    <>
      {/* STEP 1: pilih file & nama (opsional) */}
      {step === 'upload' && (
        <Modal
          open={open}
          title="APK Analysis"
          onCancel={resetAll}
          onConfirm={doUpload}
          disableConfirm={!(picked?.file_path || fileObj) || busy}
          size="lg"
        >
          <div className="space-y-5">
            <div>
              <label className="block mb-2 text-white/80">Analytics Name (optional)</label>
              <input
                className="w-full h-11 rounded border border-(--border) bg-transparent px-3"
                placeholder="Mis. APK Malware Detection - SampleApp"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block mb-2 text-white/80">File</label>
              <div className="h-[120px] border border-(--border) rounded grid place-items-center">
                <button
                  type="button"
                  className={`btn-upload px-6 py-2 ${busy ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={handleBrowseNative}
                >
                  Upload
                </button>

                {/* fallback input (hanya untuk tampilkan nama/size) */}
                <input
                  type="file"
                  accept=".apk,.ipa"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              {(picked?.file_name || fileObj) && (
                <p className="mt-2 text-sm text-(--dim)">
                  {picked?.file_name || fileObj?.name}{' '}
                  {fileObj ? `(${(fileObj.size / 1024 / 1024).toFixed(2)} MB)` : ''}
                </p>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* STEP 2: progress */}
      {step === 'progress' && (
        <UploadProgress
          open
          filename={
            uploadMetaRef.current.file_name || picked?.file_name || fileObj?.name || 'package.apk'
          }
          ext="apk"
          progress={pct}
          text={label}
          status={status}
          onCancel={resetAll}
        />
      )}

      {/* STEP 3: campaign */}
      {step === 'campaign' && (
        <AnalyticsCampaignModal
          open
          fileName={
            uploadMetaRef.current.file_name || picked?.file_name || fileObj?.name || 'package.apk'
          }
          fileSize={
            uploadMetaRef.current.size_label ||
            (fileObj ? `${(fileObj.size / 1024 / 1024).toFixed(2)} MB` : '—')
          }
          onClose={resetAll}
          onNext={({ campaign }) => {
            /* inilah FIX utama */
            const analytic_name = campaign || name || 'APK Analysis'
            const { file_id, file_name, size_label } = uploadMetaRef.current
            onNext?.({ analytic_name, file_id, file_name, size_label }) // → AnalyticsPage.onNext
            resetAll()
          }}
        />
      )}
    </>
  )
}
