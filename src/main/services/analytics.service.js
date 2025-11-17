// src/main/services/analytics.service.js
import api from './apiClient'
import FormData from 'form-data'
import crypto from 'node:crypto'

// === Create Analytic (Start Analyzing) ===
export async function startAnalyzing({ analytic_name, method }) {
  const form = new FormData()
  form.append('analytic_name', analytic_name)
  form.append('method', method)

  const { data } = await api.post('/api/v1/analytics/start-analyzing', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

// === Start Extraction (QUERY: analytic_id) ===
// Tambah: Idempotency-Key untuk cegah double processing di BE bila kebetulan double-click lolos.
export async function startExtraction({ analytic_id }) {
  const idempotencyKey = crypto.randomUUID()
  const { data } = await api.post('/api/v1/analytics/start-extraction', null, {
    params: { analytic_id },
    headers: { 'X-Idempotency-Key': idempotencyKey },
    timeout: 45_000 // supaya renderer gak nunggu terlalu lama kalau backend lambat
  })
  return data
}

// === List Analytics (search, method) ===
export async function getAllAnalytics({ search, method } = {}) {
  const { data } = await api.get('/api/v1/analytics/get-all-analytic', {
    params: { search, method }
  })
  return data
}

/* ======================= RESULT ENDPOINTS ======================= */
export async function getContactCorrelation({ analytic_id }) {
  const { data } = await api.get('/api/v1/analytic/contact-correlation', {
    params: { analytic_id }
  })
  return data
}
export async function getHashfileAnalytics({ analytic_id }) {
  const { data } = await api.get('/api/v1/analytics/hashfile-analytics', {
    params: { analytic_id }
  })
  return data
}
export async function getDeepCommunication({ analytic_id }) {
  const { data } = await api.get('/api/v1/analytic/deep-communication-analytics', {
    params: { analytic_id }
  })
  return data
}
export async function getSocialMediaCorrelation({ analytic_id }) {
  const { data } = await api.get('/api/v1/analytics/social-media-correlation', {
    params: { analytic_id }
  })
  return data
}

// Platform Cards Intensity
export async function getPlatformCardsIntensity({ analytic_id, platform, device_id }) {
  const { data } = await api.get('/api/v1/analytic/platform-cards/intensity', {
    params: { analytic_id, platform, device_id }
  })
  return data
}

// Chat Detail
export async function getChatDetail({ analytic_id, person_name, platform, device_id, search }) {
  const { data } = await api.get('/api/v1/analytic/chat-detail', {
    params: { analytic_id, person_name, platform, device_id, search }
  })
  return data
}

/* ======================= DEVICE MANAGEMENT ======================= */
export async function addDevice({ file_id, name, phone_number }) {
  const form = new FormData()
  form.append('file_id', file_id)
  form.append('name', name)
  form.append('phone_number', phone_number)
  const { data } = await api.post('/api/v1/analytics/add-device', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

export async function getDevices({ analytic_id }) {
  const { data } = await api.get('/api/v1/analytics/get-devices', { params: { analytic_id } })
  return data
}

/* ======================= ORCHESTRATION ======================= */
// Satu pintu untuk prefetch berdasarkan method (biar logic ada di main-process)
export async function fetchByMethod({ method, analytic_id }) {
  const m = String(method || '').toLowerCase()
  if (m.includes('contact')) return getContactCorrelation({ analytic_id })
  if (m.includes('hash')) return getHashfileAnalytics({ analytic_id })
  if (m.includes('deep')) return getDeepCommunication({ analytic_id })
  if (m.includes('social')) return getSocialMediaCorrelation({ analytic_id })
  // APK / lainnya: tidak ada prefetch umum
  return { ok: true, message: 'No prefetch for this method.' }
}
