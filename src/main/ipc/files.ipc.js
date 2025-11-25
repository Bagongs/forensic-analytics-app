/* eslint-disable no-empty */
/* eslint-disable no-useless-escape */
// src/main/ipc/files.ipc.js

import { ipcMain, dialog, app } from 'electron'
import { promises as fsp } from 'node:fs'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import {
  uploadData,
  uploadProgress,
  getFiles,
  getFilePreviewRaw,
  fetchBinaryByUrl
} from '../services/files.service.js'

function writeTempFile(buffer, fileName = 'preview.bin') {
  const dir = app.getPath('temp') || os.tmpdir()
  const safe = String(fileName).replace(/[^\w.\-]+/g, '_')
  const full = path.join(dir, `forensic_${Date.now()}_${safe}`)
  fs.writeFileSync(full, buffer)
  return full
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

export default function registerFilesIpc() {
  // === Upload SDP ===
  ipcMain.handle('files:uploadData', async (event, payload) => {
    try {
      const result = await uploadData(payload)
      return result
    } catch (err) {
      console.error('[MAIN uploadData ERROR]', err?.message)

      // Convert backend error to JSON-safe object
      const safe = {
        __error: true,
        message:
          err?.readableMessage || err?.response?.data?.message || err?.message || 'Upload failed',
        status: err?.response?.status
      }

      return safe // 👉 return simple object (Electron can clone this)
    }
  })

  // === Poll progress ===
  ipcMain.handle('files:uploadProgress', async (e, p) => {
    const res = await uploadProgress(p)
    try {
      e.sender.send('debug:uploadProgress', { req: p, res })
    } catch {}
    return res
  })

  // === List uploads ===
  ipcMain.handle('files:getFiles', (_e, p) => getFiles(p || {}))

  // === Preview hasil decrypt (binary) ===
  ipcMain.handle('files:getFilePreview', async (_e, p) => {
    const { file_id, asPath = false } = p || {}
    if (!file_id) throw new Error('files:getFilePreview → file_id kosong')

    const { buffer, mime, file_name } = await getFilePreviewRaw({ file_id })
    if (asPath) {
      const savedPath = writeTempFile(buffer, file_name || `file_${file_id}`)
      return { path: savedPath, mime, file_name }
    }
    return { buffer, mime, file_name }
  })

  // === Native File Picker: .sdp ===
  ipcMain.handle('files:chooseSDP', async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: 'Pilih file .sdp',
        properties: ['openFile'],
        filters: [{ name: 'SDP', extensions: ['sdp'] }]
      })
      if (canceled || !filePaths?.[0]) return null
      const file_path = filePaths[0]
      const stat = fs.statSync(file_path)
      return {
        file_path,
        file_name: path.basename(file_path),
        size: stat.size
      }
    } catch (err) {
      console.error('[files:chooseSDP] error:', err)
      throw err
    }
  })

  // === Native File Picker: .apk ===
  ipcMain.handle('files:chooseAPK', async () => {
    const ret = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Android Package', extensions: ['apk', 'ipa'] }]
    })
    if (ret.canceled || !ret.filePaths?.[0]) return null
    const file_path = ret.filePaths[0]
    const file_name = path.basename(file_path)
    return { file_path, file_name }
  })

  // === Download/Fetch file lewat URL (disimpan ke temp bila asPath) ===
  ipcMain.handle('files:getByUrl', async (_e, p) => {
    const { url, asPath = false } = p || {}
    const { buffer, mime, file_name } = await fetchBinaryByUrl({ url })
    if (asPath) {
      const savedPath = writeTempFile(buffer, file_name)
      return { path: savedPath, mime, file_name }
    }
    return { buffer, mime, file_name }
  })

  // === READ TEXT (untuk preview txt/csv/json …) ===
  ipcMain.handle('files:readText', async (_e, { path: filePath, maxBytes = 2 * 1024 * 1024 }) => {
    if (!filePath) throw new Error('files:readText → path kosong')
    const stat = await fsp.stat(filePath)
    const cap = clamp(Number(maxBytes) || 0, 1, 50 * 1024 * 1024) // hard cap 50MB
    if (stat.size > cap) {
      const fh = await fsp.open(filePath, 'r')
      try {
        const buf = Buffer.allocUnsafe(Math.min(cap, 2 * 1024 * 1024))
        const { bytesRead } = await fh.read(buf, 0, buf.length, 0)
        return buf.slice(0, bytesRead).toString('utf8') + '\n\n…(truncated)'
      } finally {
        await fh.close()
      }
    }
    return fsp.readFile(filePath, 'utf8')
  })

  // === READ BUFFER (untuk XLSX via SheetJS) ===
  ipcMain.handle('files:readBuffer', async (_e, { path: filePath, maxBytes = 8 * 1024 * 1024 }) => {
    if (!filePath) throw new Error('files:readBuffer → path kosong')
    const stat = await fsp.stat(filePath)
    const cap = clamp(Number(maxBytes) || 0, 1, 100 * 1024 * 1024) // hard cap 100MB
    if (stat.size > cap) {
      const fh = await fsp.open(filePath, 'r')
      try {
        const buf = Buffer.allocUnsafe(cap)
        const { bytesRead } = await fh.read(buf, 0, cap, 0)
        return buf.buffer.slice(buf.byteOffset, buf.byteOffset + bytesRead)
      } finally {
        await fh.close()
      }
    }
    const buf = await fsp.readFile(filePath)
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
  })
}
