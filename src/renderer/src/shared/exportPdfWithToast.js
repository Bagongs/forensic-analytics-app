// src/renderer/shared/exportPdfWithToast.js
import { toast } from 'react-hot-toast'
import { extractHttpMessage } from '@renderer/utils/httpError'

/**
 * Wrapper export PDF dengan:
 * - toast loading / success / error
 * - optional disable handler (setIsExporting)
 * - mengembalikan hasil dari preload (mis. path)
 */
export async function exportPdfWithToast({
  analytic_id,
  person_name,
  device_id,
  source,
  fileName, // optional → nama file result
  setIsExporting // optional → state setter utk disable tombol
}) {
  if (setIsExporting) setIsExporting(true)
  const t = toast.loading('Exporting PDF...')

  try {
    const res = await window.api.report.exportPdf({
      analytic_id,
      person_name,
      device_id,
      source,
      fileName
    })
    const savedPath = res?.outPath || res?.path || res?.data?.outPath || res?.data?.path
    toast.success(savedPath ? `Export berhasil: ${savedPath}` : 'Export PDF berhasil')
    return res
  } catch (e) {
    toast.error(extractHttpMessage(e, 'Export PDF gagal'))
    throw e
  } finally {
    toast.dismiss(t)
    if (setIsExporting) setIsExporting(false)
  }
}
