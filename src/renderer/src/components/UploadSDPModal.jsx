// src/renderer/src/components/UploadSDPModal.jsx
/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import SelectField from './SelectField'
import UnsavedChangesModal from './UnsavedChangesModal'
import IncompleteFormModal from './IncompleteFormModal'
import { validateSafeFileName } from '../utils/safeTextValidators'

const COLORS = {
  inputBg: '#202C3C',
  inputBorder: '#394F6F',
  text: '#E7E9EE',
  dim: 'var(--dim)',
  gold: '#EDC702',
  btnUploadBg: '#2A3A51'
}

const TYPE_OPTIONS = [
  { value: 'Handphone', label: 'Handphone' },
  { value: 'SSD', label: 'SSD' },
  { value: 'Harddisk', label: 'Harddisk' },
  { value: 'PC', label: 'PC' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'DVR', label: 'DVR' }
]

const TOOL_OPTIONS = [
  { value: 'Cellebrite', label: 'Cellebrite' },
  { value: 'Oxygen', label: 'Oxygen' },
  { value: 'Magnet Axiom', label: 'Magnet Axiom' },
  { value: 'Encase', label: 'Encase' }
]

const METHOD_OPTIONS = [
  { value: 'Deep Communication Analytics', label: 'Deep Communication Analytics' },
  { value: 'Contact Correlation', label: 'Contact Correlation' },
  { value: 'Hashfile Analytics', label: 'Hashfile Analytics' },
  { value: 'Social Media Correlation', label: 'Social Media Correlation' }
]

function InputField({ label, value, onChange, placeholder = 'Name', error }) {
  const hasError = !!error

  return (
    <div>
      <label className="block mb-2">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className="w-full h-12 px-4 outline-none"
        style={{
          background: COLORS.inputBg,
          border: `1px solid ${hasError ? '#f87171' : COLORS.inputBorder}`,
          color: COLORS.text
        }}
      />
      {hasError && <div className="mt-1 text-xs text-red-400">{error}</div>}
    </div>
  )
}

// helper untuk cek apakah file berakhiran .txt.sdp
function isTxtSdpFile(name = '') {
  return /\.txt\.sdp$/i.test(name)
}

export default function UploadSDPModal({ open, onCancel, onNext }) {
  const [picked, setPicked] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileNameError, setFileNameError] = useState('')
  const [type, setType] = useState('')
  const [tool, setTool] = useState('')
  const [method, setMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  // flag: kalau true maka Tools & Methods dikunci (auto Encase + Hashfile Analytics)
  const [lockToolMethod, setLockToolMethod] = useState(false)

  const [showUnsaved, setShowUnsaved] = useState(false)
  const [showIncomplete, setShowIncomplete] = useState(false)

  useEffect(() => {
    if (!open) {
      setPicked(null)
      setFileName('')
      setFileNameError('')
      setType('')
      setTool('')
      setMethod('')
      setNotes('')
      setError('')
      setShowUnsaved(false)
      setShowIncomplete(false)
      setLockToolMethod(false)
    }
  }, [open])

  async function chooseSDP() {
    try {
      const res = await window.api.files.chooseSDP()
      if (!res) return

      setPicked(res)

      // tampilkan file_name tanpa .sdp di input "File Name"
      const rawName = res.file_name || ''
      const baseName = rawName.replace(/\.sdp$/i, '')
      setFileName(baseName)

      // validasi langsung nama file auto-set
      const { ok, error: validationError } = validateSafeFileName(baseName)
      setFileNameError(ok ? '' : validationError)

      setError('')

      // cek apakah file adalah *.txt.sdp
      if (isTxtSdpFile(rawName)) {
        // auto-set dan kunci Tools & Methods
        setTool('Encase')
        setMethod('Hashfile Analytics')
        setLockToolMethod(true)
      } else {
        // kalau bukan .txt.sdp, pastikan tidak terkunci
        setLockToolMethod(false)
      }
    } catch (e) {
      console.error('chooseSDP error:', e)
      setError('Gagal membuka dialog file. Cek console & IPC.')
    }
  }

  const isDirty = useMemo(() => {
    return picked || fileName.trim() || type || tool || method || notes.trim()
  }, [picked, fileName, type, tool, method, notes])

  const isValid = useMemo(() => {
    const { ok } = validateSafeFileName(fileName || '')
    return !!(picked && ok && type && tool && method)
  }, [picked, fileName, type, tool, method])

  function handleRequestClose() {
    if (isDirty) setShowUnsaved(true)
    else onCancel?.()
  }

  function handleNext() {
    // validasi spesifik nama file dulu
    const { ok, error: validationError } = validateSafeFileName(fileName)
    if (!ok) {
      setFileNameError(validationError)
      return
    }

    if (!isValid) {
      setShowIncomplete(true)
      return
    }

    onNext?.({
      file_path: picked.file_path,
      file_name: fileName.trim() ? `${fileName.trim()}.sdp` : picked.file_name,
      type,
      tools: tool,
      method,
      notes
    })
  }

  return (
    <>
      <Modal
        open={open}
        onCancel={handleRequestClose}
        title="Upload .SDP"
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <button
              onClick={handleRequestClose}
              className="h-10 px-6 text-sm"
              style={{
                background: 'transparent',
                border: `1.5px solid ${COLORS.gold}`,
                color: COLORS.text
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleNext}
              className="h-10 px-6 app-title text-sm"
              style={{
                background:
                  'radial-gradient(50% 50% at 50% 50%, #EDC702 0%, rgba(237, 199, 2, 0.7) 100%)',
                border: '3px solid #EDC702B2',
                color: '#101217'
              }}
            >
              Next
            </button>
          </div>
        }
        closable
        className="select-none"
      >
        <div className="grid grid-cols-1 gap-5" onClick={(e) => e.stopPropagation()}>
          {/* PICKER */}
          <div>
            <label className="block mb-2">File (.sdp)</label>

            {!picked ? (
              <div
                className="w-full h-36 flex items-center justify-center"
                style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}` }}
              >
                <button
                  onClick={chooseSDP}
                  className="h-10 px-6 app-title text-[15px]"
                  style={{
                    background: COLORS.btnUploadBg,
                    border: `1px solid ${COLORS.inputBorder}`,
                    color: COLORS.text
                  }}
                >
                  Choose File
                </button>
              </div>
            ) : (
              <div
                className="w-full p-4 flex items-center justify-between gap-3"
                style={{ background: COLORS.inputBg, border: `1px solid ${COLORS.inputBorder}` }}
              >
                {/* LEFT: file name + path (truncate, max width constraint) */}
                <div className="min-w-0" style={{ maxWidth: 'calc(100% - 240px)' }}>
                  <div className="truncate">{picked.file_name}</div>
                  <div className="text-xs opacity-70 truncate">{picked.file_path}</div>
                </div>

                {/* RIGHT: buttons */}
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={chooseSDP}
                    className="h-10 px-5 rounded app-title text-[15px]"
                    style={{
                      background: COLORS.btnUploadBg,
                      border: `1px solid ${COLORS.inputBorder}`,
                      color: COLORS.text
                    }}
                  >
                    REPLACE
                  </button>

                  <button
                    onClick={() => {
                      setPicked(null)
                      setFileName('')
                      setFileNameError('')
                      // kalau sebelumnya auto-lock dari .txt.sdp, reset juga Tool & Method
                      if (lockToolMethod) {
                        setTool('')
                        setMethod('')
                        setLockToolMethod(false)
                      }
                    }}
                    className="h-10 px-5 rounded app-title text-[15px]"
                    style={{ background: '#A50808', border: '1px solid #7B0A0A', color: '#fff' }}
                  >
                    DELETE
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-2 text-sm" style={{ color: '#FCA5A5' }}>
                {error}
              </div>
            )}

            <div className="mt-4 h-px w-full" style={{ background: 'rgba(255,255,255,0.25)' }} />
          </div>

          {/* FORM */}
          <InputField
            label="File Name"
            value={fileName}
            onChange={(v) => {
              setFileName(v)
              const { ok, error: validationError } = validateSafeFileName(v)
              setFileNameError(ok ? '' : validationError)
            }}
            placeholder="Name (excluding .sdp)"
            error={fileNameError}
          />

          <SelectField
            label="Type"
            value={type}
            onChange={setType}
            options={TYPE_OPTIONS}
            placeholder="Select type"
          />

          <SelectField
            label="Tools"
            value={tool}
            onChange={lockToolMethod ? undefined : setTool}
            options={TOOL_OPTIONS}
            placeholder="Select tools"
            disabled={lockToolMethod}
          />

          <SelectField
            label="Methods"
            value={method}
            onChange={lockToolMethod ? undefined : setMethod}
            options={METHOD_OPTIONS}
            placeholder="Select method"
            disabled={lockToolMethod}
          />

          <div>
            <label className="block mb-2">Notes</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 resize-y outline-none"
              style={{
                background: COLORS.inputBg,
                border: `1px solid ${COLORS.inputBorder}`,
                color: COLORS.text
              }}
              placeholder="Catatan (opsional)"
            />
          </div>
        </div>
      </Modal>

      {/* UNSAVED CHANGES */}
      <UnsavedChangesModal
        open={showUnsaved}
        onLeave={() => {
          setShowUnsaved(false)
          onCancel?.()
        }}
        onStay={() => setShowUnsaved(false)}
      />

      {/* INCOMPLETE FORM */}
      <IncompleteFormModal open={showIncomplete} onClose={() => setShowIncomplete(false)} />
    </>
  )
}
