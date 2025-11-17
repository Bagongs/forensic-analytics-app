// src/main/services/apk.service.js
import api from './apiClient'
import FormData from 'form-data'
import fs from 'node:fs'

export async function uploadApk({ filePath, file_name }) {
  if (!filePath) throw new Error('uploadApk: filePath is required')
  if (!fs.existsSync(filePath)) throw new Error(`File tidak ditemukan: ${filePath}`)

  const form = new FormData()
  form.append('file', fs.createReadStream(filePath))
  form.append('file_name', file_name || 'package.apk')

  const { data } = await api.post('/api/v1/analytics/upload-apk', form, {
    headers: form.getHeaders()
  })
  return data
}

export async function analyzeApk({ file_id, analytic_id }) {
  const fid = Number(file_id)
  const aid = Number(analytic_id)
  if (!Number.isInteger(fid)) throw new Error('analyzeApk: file_id harus integer')
  if (!Number.isInteger(aid)) throw new Error('analyzeApk: analytic_id harus integer')

  // sesuai curl: POST + query params, body kosong
  const { data } = await api.post('/api/v1/analytics/analyze-apk', null, {
    params: { file_id: fid, analytic_id: aid }
  })
  return data
}

export async function getApkAnalytic({ analytic_id }) {
  const aid = Number(analytic_id)
  if (!Number.isInteger(aid)) throw new Error('getApkAnalytic: analytic_id harus integer')
  const { data } = await api.get('/api/v1/analytics/apk-analytic', {
    params: { analytic_id: aid }
  })
  return data
}
