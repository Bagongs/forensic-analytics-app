/* eslint-disable no-empty */
// src/main/services/files.service.js
import api from './apiClient.js'
import FormData from 'form-data'
import fs from 'node:fs'
import axios from 'axios'

export async function uploadData({ filePath, file_name, notes, type, tools, method }) {
  if (!filePath) throw new Error('uploadData: filePath kosong')

  // 🔍 LOG: apa yang datang dari renderer
  console.log('[FILES uploadData] payload from renderer:', {
    filePath,
    file_name,
    notes,
    type,
    tools,
    method
  })

  const form = new FormData()
  form.append('file', fs.createReadStream(filePath))
  if (file_name) form.append('file_name', file_name)
  if (notes) form.append('notes', notes)
  if (type) form.append('type', type)
  if (tools) form.append('tools', tools)
  if (method) form.append('method', method)

  // (optional) bisa log headersnya
  // console.log('[FILES uploadData] form headers:', form.getHeaders())

  try {
    const { data } = await api.post('/api/v1/analytics/upload-data', form, {
      headers: form.getHeaders()
    })

    console.log('[FILES uploadData] API response OK:', data)
    return data // { upload_id, ... }
  } catch (err) {
    // 🔍 LOG: detail error dari backend
    console.error('[FILES uploadData] API ERROR status:', err?.response?.status)
    console.error('[FILES uploadData] API ERROR data  :', err?.response?.data)

    // lempar lagi supaya ketangkep di IPC
    throw err
  }
}

export async function uploadProgress({ upload_id, type = 'data' }) {
  if (!upload_id) throw new Error('uploadProgress: upload_id kosong')
  const { data } = await api.get('/api/v1/analytics/upload-progress', {
    params: { upload_id, type }
  })
  return data // { progress, status, file_id, message, ... }
}

export async function getFiles({ search, method } = {}) {
  // filter value “Deep Communication Analytics” sudah sesuai Contract changelog
  const { data } = await api.get('/api/v1/analytics/get-files', { params: { search, method } })
  return data // biasanya { data: [...] }
}

export async function getFilePreviewRaw({ file_id }) {
  if (!file_id) throw new Error('getFilePreviewRaw: file_id kosong')
  // asumsi endpoint preview:
  const res = await api.get(`/api/v1/analytics/files/${file_id}`, { responseType: 'arraybuffer' })
  const mime = res.headers['content-type'] || 'application/octet-stream'
  const disp = res.headers['content-disposition'] || ''
  let file_name = `file_${file_id}`
  try {
    const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(disp)
    file_name = decodeURIComponent(m?.[1] || m?.[2] || file_name)
  } catch {}
  const buffer = Buffer.from(res.data)
  return { buffer, mime, file_name }
}

export async function fetchBinaryByUrl({ url }) {
  if (!url) throw new Error('fetchBinaryByUrl: url kosong')
  const res = await axios.get(url, { responseType: 'arraybuffer' })
  const mime = res.headers['content-type'] || 'application/octet-stream'
  const disp = res.headers['content-disposition'] || ''
  let file_name = url.split('/').pop() || 'file'
  try {
    const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(disp)
    file_name = decodeURIComponent(m?.[1] || m?.[2] || file_name)
  } catch {}
  const buffer = Buffer.from(res.data)
  return { buffer, mime, file_name }
}
