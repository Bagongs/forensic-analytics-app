/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// === viewers per tipe ===
import ImageViewer from './types/ImageViewer' // zoom & pan
import PdfViewer from './types/PdfViewer' // iframe
import TextViewer from './types/TextViewer' // readText IPC
import ExcelViewerMulti from './types/ExcelViewerMulti' // multi-sheet + paging

// ==== helper deteksi MIME / ekstensi ====
const MIME = {
  isImage: (m, n = '') => /^image\//.test(m) || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(n),
  isPdf: (m, n = '') => m === 'application/pdf' || /\.pdf$/i.test(n),
  isText: (m, n = '') =>
    /^text\//.test(m) ||
    /(\.txt|\.log|\.md|\.csv|\.json)$/i.test(n) ||
    m === 'application/json' ||
    m === 'text/csv',
  isXlsx: (m, n = '') => /spreadsheetml\.sheet|ms-excel/i.test(m) || /\.(xlsx|xls)$/i.test(n),
  isVideo: (m, n = '') => /^video\//.test(m) || /\.(mp4|webm|ogg|mov|mkv)$/i.test(n),
  isAudio: (m, n = '') => /^audio\//.test(m) || /\.(mp3|wav|ogg|m4a|flac)$/i.test(n)
}

/**
 * props:
 *  - open: boolean
 *  - items: Array<{ id, file_name, file_path, mime }>
 *  - startIndex: number (default 0)
 *  - onClose: () => void
 *
 * Catatan: file_path harus path lokal (bukan URL http). Kita akan buat src `file://...`
 */
export default function FileLightbox({ open, items = [], startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  useEffect(() => {
    if (open) setIndex(startIndex)
  }, [open, startIndex])

  const count = items.length
  const active = items[index] || null

  // navigasi
  const goPrev = useCallback(() => setIndex((i) => (i > 0 ? i - 1 : 0)), [])
  const goNext = useCallback(() => setIndex((i) => (i < count - 1 ? i + 1 : count - 1)), [count])
  const goIdx = (i) => setIndex(Math.max(0, Math.min(count - 1, i)))

  // keyboard ← → Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
      else if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, goPrev, goNext])

  // buat file:// URL untuk viewer berbasis src
  const src = useMemo(() => {
    const p = active?.file_path
    return p ? encodeURI(`file://${p}`) : null
  }, [active?.file_path])

  const fileName = active?.file_name || ''
  const mime = (active?.mime || '').toLowerCase()

  // pilih viewer
  const isImage = MIME.isImage(mime, fileName)
  const isPdf = MIME.isPdf(mime, fileName)
  const isText = MIME.isText(mime, fileName)
  const isXlsx = MIME.isXlsx(mime, fileName)
  const isVideo = MIME.isVideo(mime, fileName)
  const isAudio = MIME.isAudio(mime, fileName)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-999"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* backdrop ala WhatsApp */}
          <motion.div
            className="absolute inset-0 bg-[#0E1624]/90 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative h-full w-full flex flex-col"
            initial={{ scale: 0.98 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          >
            {/* HEADER */}
            <div className="flex items-center justify-between px-3 md:px-4 py-2.5 bg-[#0E1624] border-b border-white/10">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <button
                  className="px-2.5 py-1.5 text-xs md:text-sm bg-white/10 hover:bg-white/20 text-white rounded"
                  onClick={onClose}
                  aria-label="Close"
                >
                  Close
                </button>
                <div className="truncate text-white text-sm md:text-base">{fileName || '-'}</div>
              </div>
              <div className="text-white/80 text-xs md:text-sm">
                {count ? `${index + 1} / ${count}` : ''}
              </div>
            </div>

            {/* BODY + tombol prev/next */}
            <div className="relative flex-1 min-h-0">
              {index > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 grid place-items-center"
                  title="Previous"
                >
                  ‹
                </button>
              )}
              {index < count - 1 && (
                <button
                  onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-10 h-10 grid place-items-center"
                  title="Next"
                >
                  ›
                </button>
              )}

              <div className="w-full h-full flex items-center justify-center p-3">
                {/* Viewer per tipe */}
                {isImage && src && <ImageViewer src={src} alt={fileName} />}
                {isPdf && src && <PdfViewer src={src} />}
                {isText && active?.file_path && <TextViewer path={active.file_path} />}
                {isXlsx && active?.file_path && <ExcelViewerMulti path={active.file_path} />}
                {isVideo && src && (
                  <video
                    src={src}
                    controls
                    className="max-h-[85vh] max-w-[95vw] rounded-md bg-black/30"
                  />
                )}
                {isAudio && src && <audio src={src} controls className="w-[min(720px,90vw)]" />}

                {!isImage && !isPdf && !isText && !isXlsx && !isVideo && !isAudio && (
                  <div className="text-white/80 text-sm text-center">Preview belum didukung.</div>
                )}
              </div>
            </div>

            {/* THUMBNAIL STRIP */}
            <div className="w-full border-t border-white/10 bg-[#0E1624]/90 overflow-x-auto">
              <div className="flex gap-2 p-2">
                {items.map((it, i) => {
                  const nm = (it?.mime || '').toLowerCase()
                  const fn = it?.file_name || ''
                  const thumbIsImg = MIME.isImage(nm, fn)
                  const thumbSrc = it?.file_path ? encodeURI(`file://${it.file_path}`) : null
                  return (
                    <button
                      key={it.id ?? `${fn}-${i}`}
                      onClick={() => goIdx(i)}
                      className={`shrink-0 rounded-md border ${i === index ? 'border-[#EDC702]' : 'border-white/15'}`}
                      title={fn}
                    >
                      {thumbIsImg && thumbSrc ? (
                        <img
                          src={thumbSrc}
                          alt={fn}
                          className="w-20 h-14 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-20 h-14 grid place-items-center text-white/70 text-[10px] bg-white/5 rounded-md">
                          {fn.split('.').pop()?.toUpperCase() || 'FILE'}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
