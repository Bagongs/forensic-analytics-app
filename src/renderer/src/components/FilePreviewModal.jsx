/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'

const MAX_TEXT_BYTES = 1024 * 1024 * 2 // 2MB
const MAX_XLSX_BYTES = 1024 * 1024 * 8 // 8MB

export default function FilePreviewModal({ open, file, onClose }) {
  const [textContent, setTextContent] = useState(null)
  const [xlsxHtml, setXlsxHtml] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fileName = file?.file_name || 'File'
  const filePath = file?.file_path || null
  const mime = (file?.mime || '').toLowerCase()

  const previewUrl = useMemo(() => {
    if (!filePath) return null
    return encodeURI(`file://${filePath}`)
  }, [filePath])

  const isImage = /^image\//.test(mime) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName)
  const isPdf = mime === 'application/pdf' || /\.pdf$/i.test(fileName)
  const isTextLike =
    /^text\//.test(mime) ||
    /(\.txt|\.log|\.md|\.csv|\.json)$/i.test(fileName) ||
    mime === 'application/json' ||
    mime === 'text/csv'
  const isExcel =
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel' ||
    /\.(xlsx|xls)$/i.test(fileName)

  // Load teks
  useEffect(() => {
    let alive = true
    setTextContent(null)
    if (!(open && isTextLike && filePath)) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        if (!window.api?.files?.readText) {
          setError('Preview teks tidak tersedia (readText belum diekspos).')
          return
        }
        const txt = await window.api.files.readText({ path: filePath, maxBytes: MAX_TEXT_BYTES })
        if (!alive) return
        setTextContent(txt ?? '')
      } catch (e) {
        if (!alive) return
        setError('Gagal membaca konten teks.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [open, isTextLike, filePath])

  // Load XLSX → HTML via SheetJS
  useEffect(() => {
    let alive = true
    setXlsxHtml(null)
    if (!(open && isExcel && filePath)) return
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        if (!window.api?.files?.readBuffer) {
          setError('Preview Excel tidak tersedia (readBuffer belum diekspos).')
          return
        }
        const arrBuf = await window.api.files.readBuffer({
          path: filePath,
          maxBytes: MAX_XLSX_BYTES
        })
        if (!alive) return
        const XLSX = await import('xlsx')
        const wb = XLSX.read(arrBuf, { type: 'array' })
        const firstSheetName = wb.SheetNames?.[0]
        if (!firstSheetName) {
          setXlsxHtml('<div style="padding:12px">Sheet kosong.</div>')
        } else {
          const ws = wb.Sheets[firstSheetName]
          const html = XLSX.utils.sheet_to_html(ws, { editable: false })
          setXlsxHtml(html)
        }
      } catch (e) {
        console.error('XLSX parse error:', e)
        if (!alive) return
        setError('Gagal mem-parsing file Excel.')
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [open, isExcel, filePath])

  return (
    <Modal
      open={open}
      title="File Preview"
      onCancel={onClose}
      onConfirm={null}
      confirmText={null}
      size="lg"
      closable
      className="max-w-[1000px]"
    >
      {!file ? (
        <div className="p-6 text-center text-(--dim)">Tidak ada file yang dipilih.</div>
      ) : (
        <div className="p-4 space-y-3">
          {/* Header info ringkas */}
          <div className="border-b border-(--border) pb-3">
            <div className="text-lg font-semibold truncate">{fileName}</div>
            <div className="text-xs text-(--dim) truncate">{filePath || '-'}</div>
            <div className="text-xs text-(--dim)">{mime || 'unknown'}</div>
          </div>

          {/* IMAGE */}
          {isImage && previewUrl && (
            <div className="rounded border border-(--border) bg-(--panel) overflow-hidden">
              <img
                src={previewUrl}
                alt={fileName}
                className="block max-h-[70vh] w-auto mx-auto object-contain"
              />
            </div>
          )}

          {/* PDF */}
          {isPdf && previewUrl && (
            <div className="rounded border border-(--border) bg-(--panel) overflow-hidden">
              <iframe title="pdf" src={previewUrl} className="w-full" style={{ height: '70vh' }} />
            </div>
          )}

          {/* TEXT/CSV/JSON */}
          {isTextLike && (
            <div className="rounded border border-(--border) bg-(--panel) overflow-hidden">
              <div
                className="p-3 text-sm whitespace-pre-wrap overflow-auto"
                style={{ maxHeight: '70vh' }}
              >
                {loading ? (
                  'Loading…'
                ) : error ? (
                  <span className="text-red-400">{error}</span>
                ) : (
                  (textContent ?? '')
                )}
              </div>
            </div>
          )}

          {/* XLSX */}
          {isExcel && (
            <div className="rounded border border-(--border) bg-(--panel) overflow-hidden">
              <div className="p-2 text-sm border-b border-(--border) flex items-center justify-between">
                <span>Excel Preview (sheet pertama)</span>
                {loading && <span className="text-(--dim)">Parsing…</span>}
              </div>
              <div className="overflow-auto" style={{ maxHeight: '70vh' }}>
                {error ? (
                  <div className="p-4 text-red-400">{error}</div>
                ) : xlsxHtml ? (
                  <div
                    className="p-3 [&_table]:w-full [&_table]:text-sm [&_th]:sticky [&_th]:top-0 [&_th]:bg-[#1b2432]"
                    dangerouslySetInnerHTML={{ __html: xlsxHtml }}
                  />
                ) : (
                  <div className="p-4 text-(--dim)">Loading…</div>
                )}
              </div>
            </div>
          )}

          {/* UNSUPPORTED */}
          {!isImage && !isPdf && !isTextLike && !isExcel && (
            <div className="rounded border border-(--border) bg-(--panel) p-6 text-center">
              <div className="text-base mb-2">Preview untuk tipe file ini belum didukung.</div>
              <div className="text-sm text-(--dim)">Tutup modal ini untuk kembali.</div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
