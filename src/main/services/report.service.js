/* eslint-disable no-control-regex */
// src/main/services/report.service.js
import api from './apiClient'
import fs from 'node:fs'
import path from 'node:path'
import { app, dialog } from 'electron'

function safeFileName(name = 'Report') {
  const base = String(name)
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 150)
  return base || 'Report'
}

function compactParams(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '')
  )
}

/* ======================= SUMMARY ======================= */
// POST /api/v1/analytic/save-summary?analytic_id=...   body: { summary }
export async function saveSummary({ analytic_id, summary }) {
  const { data } = await api.post(
    '/api/v1/analytic/save-summary',
    { summary: summary },
    { params: compactParams({ analytic_id }) }
  )
  return data
}

// PUT /api/v1/analytic/edit-summary?analytic_id=...   body: { summary }
export async function editSummary({ analytic_id, summary }) {
  const { data } = await api.put(
    '/api/v1/analytic/edit-summary',
    { summary },
    { params: compactParams({ analytic_id }) }
  )
  return data
}

/* ======================= EXPORT PDF ======================= */
// GET /api/v1/analytic/export-pdf?analytic_id=...&person_name=...&device_id=...&source=...
async function fetchPdfBuffer({ analytic_id, person_name, device_id, source }) {
  const { data, headers } = await api.get('/api/v1/analytic/export-pdf', {
    params: compactParams({ analytic_id, person_name, device_id, source }),
    responseType: 'arraybuffer'
  })

  const contentType = String(headers['content-type'] || '').toLowerCase()
  if (!contentType.includes('pdf')) {
    // kemungkinan error JSON dari server
    try {
      const json = JSON.parse(Buffer.from(data).toString('utf8'))
      throw new Error(json?.message || 'Export PDF gagal: respons bukan PDF')
    } catch {
      throw new Error('Export PDF gagal: respons bukan PDF')
    }
  }

  let fileName = `analytics_${analytic_id}.pdf`
  const disp = headers['content-disposition'] || ''
  const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(disp)
  if (m?.[1]) fileName = decodeURIComponent(m[1])
  else if (m?.[2]) fileName = m[2]

  return { buffer: Buffer.from(data), mime: contentType, file_name: fileName }
}

/** Auto-save ke ~/Downloads bila outPath tidak diberikan */
export async function exportPdf({
  analytic_id,
  person_name,
  device_id,
  source,
  outPath,
  fileName
}) {
  const {
    buffer,
    mime,
    file_name: serverName
  } = await fetchPdfBuffer({
    analytic_id,
    person_name,
    device_id,
    source
  })

  let destPath = outPath
  if (!destPath) {
    const downloads = app.getPath('downloads')
    const base = safeFileName(fileName || serverName || `Report_${analytic_id}`)
    const finalName = base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`
    destPath = path.join(downloads, finalName)
  }

  fs.writeFileSync(destPath, buffer, 'binary')
  return { ok: true, path: destPath, contentType: mime, file_name: path.basename(destPath) }
}

export async function exportPdfSaveAs({ analytic_id, person_name, device_id, source, fileName }) {
  const {
    buffer,
    mime,
    file_name: serverName
  } = await fetchPdfBuffer({
    analytic_id,
    person_name,
    device_id,
    source
  })

  const defaultName = safeFileName(fileName || serverName || `Report_${analytic_id}`)
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Save Analytics PDF',
    defaultPath: defaultName.toLowerCase().endsWith('.pdf') ? defaultName : `${defaultName}.pdf`,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })
  if (canceled || !filePath) return { ok: false, canceled: true }

  fs.writeFileSync(filePath, buffer, 'binary')
  return { ok: true, path: filePath, contentType: mime, file_name: path.basename(filePath) }
}
