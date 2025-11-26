// src/main/services/analytics.service.js
import api from './apiClient'
import FormData from 'form-data'
import crypto from 'node:crypto'

/* ============================================================
   ERROR ADAPTER (Redirect Contract Aware)
   - Support 2 bentuk error:
     (1) Axios error: err.response.data = payload kontrak
     (2) Interceptor lempar payload flat langsung: err = {status, message, data}
============================================================ */
function adaptError(err) {
  // ====== (A) jika interceptor sudah lempar payload flat ======
  if (err && typeof err === 'object') {
    const st = err.status
    const hasRedirect = err?.data?.next_action && err?.data?.redirect_to

    // ✅ kontrak redirect flat
    if (st === 400 || st === 404) {
      throw err
    }
    if (hasRedirect) {
      throw err
    }

    // ✅ kalau payload flat lain (punya status) tetap lempar apa adanya
    if (typeof st === 'number') {
      throw err
    }
  }

  // ====== (B) axios-like error ======
  const payload = err?.response?.data

  if (payload && typeof payload === 'object') {
    const st = payload.status
    const hasRedirect = payload?.data?.next_action && payload?.data?.redirect_to

    // ✅ kontrak redirect nested
    if (st === 400 || st === 404) {
      throw payload
    }
    if (hasRedirect) {
      throw payload
    }

    // ✅ payload lain yang punya status → lempar payload
    if (typeof st === 'number') {
      throw payload
    }
  }

  // ====== (C) fallback konsisten ======
  throw {
    status: err?.response?.status || err?.status || 500,
    message: payload?.message || err?.message || 'Unexpected server error',
    data: payload?.data || err?.data || payload || null
  }
}

/* ============================================================
   SAFE WRAPPERS
============================================================ */
async function safeGet(url, params, config = {}) {
  try {
    const { data } = await api.get(url, { params, ...config })
    return data
  } catch (err) {
    adaptError(err)
  }
}

async function safePost(url, body, config = {}) {
  try {
    const { data } = await api.post(url, body, config)
    return data
  } catch (err) {
    adaptError(err)
  }
}

/* ============================================================
   CORE
============================================================ */

// === Create Analytic (Start Analyzing) ===
export async function startAnalyzing({ analytic_name, method }) {
  try {
    const form = new FormData()
    form.append('analytic_name', analytic_name)
    form.append('method', method)

    const { data } = await api.post('/api/v1/analytics/start-analyzing', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  } catch (err) {
    adaptError(err)
  }
}

// === Start Extraction (QUERY: analytic_id) ===
export async function startExtraction({ analytic_id }) {
  try {
    const idempotencyKey = crypto.randomUUID()
    const { data } = await api.post('/api/v1/analytics/start-extraction', null, {
      params: { analytic_id },
      headers: { 'X-Idempotency-Key': idempotencyKey },
      timeout: 45_000
    })
    return data
  } catch (err) {
    adaptError(err)
  }
}

// === Store Analytics FOR APK ONLY (QUERY: analytic_id, file_id) ===
export async function storeAnalyticFile({ analytic_id, file_id }) {
  // sesuai CURL: POST dengan query params, body kosong
  return safePost('/api/v1/analytics/store-analytic-file', null, {
    params: { analytic_id, file_id }
  })
}

// === List Analytics (search, method) ===
export async function getAllAnalytics({ search, method } = {}) {
  return safeGet('/api/v1/analytics/get-all-analytic', { search, method })
}

/* ======================= RESULT ENDPOINTS ======================= */

export async function getContactCorrelation({ analytic_id }) {
  return safeGet('/api/v1/analytic/contact-correlation', { analytic_id })
}

export async function getHashfileAnalytics({ analytic_id }) {
  return safeGet('/api/v1/analytics/hashfile-analytics', { analytic_id })
}

export async function getDeepCommunication({ analytic_id }) {
  return safeGet('/api/v1/analytic/deep-communication-analytics', { analytic_id })
}

export async function getSocialMediaCorrelation({ analytic_id, platform }) {
  return safeGet('/api/v1/analytics/social-media-correlation', { analytic_id, platform })
}

// Platform Cards Intensity
export async function getPlatformCardsIntensity({ analytic_id, platform, device_id }) {
  return safeGet('/api/v1/analytic/platform-cards/intensity', {
    analytic_id,
    platform,
    device_id
  })
}

// Chat Detail
export async function getChatDetail({ analytic_id, person_name, platform, device_id, search }) {
  return safeGet('/api/v1/analytic/chat-detail', {
    analytic_id,
    person_name,
    platform,
    device_id,
    search
  })
}

/* ======================= DEVICE MANAGEMENT ======================= */

export async function addDevice({ file_id, name, phone_number, analytic_id }) {
  try {
    const form = new FormData()
    form.append('file_id', file_id)
    form.append('name', name)
    form.append('phone_number', phone_number)
    form.append('analytic_id', analytic_id)

    const { data } = await api.post('/api/v1/analytics/add-device', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  } catch (err) {
    adaptError(err)
  }
}

export async function getDevices({ analytic_id }) {
  return safeGet('/api/v1/analytics/get-devices', { analytic_id })
}

/* ======================= ORCHESTRATION ======================= */

export async function fetchByMethod({ method, analytic_id }) {
  try {
    const m = String(method || '').toLowerCase()

    if (m.includes('contact')) return await getContactCorrelation({ analytic_id })
    if (m.includes('hash')) return await getHashfileAnalytics({ analytic_id })
    if (m.includes('deep')) return await getDeepCommunication({ analytic_id })
    if (m.includes('social')) return await getSocialMediaCorrelation({ analytic_id })

    return { ok: true, message: 'No prefetch for this method.' }
  } catch (err) {
    adaptError(err)
  }
}
