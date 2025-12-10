/* eslint-disable no-empty */
/* axios instance khusus main-process */
import axios from 'axios'
import { BrowserWindow } from 'electron'

const BASE_URL = import.meta.env?.VITE_BACKEND_BASE_URL || 'http://172.15.2.105:8000'

// ===== State token (hanya di main)
let accessToken = null
let refreshToken = null

// ===== Target broadcast events -> renderer
let _eventTargetWin = null
export function setAuthEventTarget(win) {
  _eventTargetWin = win || null
}
function broadcast(channel, payload) {
  try {
    if (_eventTargetWin?.webContents) {
      _eventTargetWin.webContents.send(channel, payload)
    } else {
      BrowserWindow.getAllWindows().forEach((w) => w.webContents.send(channel, payload))
    }
  } catch {}
}

// ===== Pre-emptive scheduler
let refreshTimer = null
function decodeJwtExp(jwt) {
  try {
    const [, payload] = String(jwt).split('.')
    const json = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))
    return json?.exp ? Number(json.exp) : null
  } catch {
    return null
  }
}
export function schedulePreemptiveRefresh(access) {
  if (refreshTimer) clearTimeout(refreshTimer)
  const exp = decodeJwtExp(access)
  if (!exp) return
  const nowSec = Math.floor(Date.now() / 1000)
  const AHEAD = 5 * 60 // 5 menit sebelum kadaluarsa
  const delayMs = Math.max((exp - nowSec - AHEAD) * 1000, 5_000)
  refreshTimer = setTimeout(() => {
    refreshAccessTokenOnce().catch(() => {
      // fallback ke mekanisme 401→refresh
    })
  }, delayMs)
}
export function cancelPreemptiveRefresh() {
  if (refreshTimer) clearTimeout(refreshTimer)
  refreshTimer = null
}

// ===== Ekspor util token
export function setAccessToken(token) {
  accessToken = token || null
  if (accessToken) schedulePreemptiveRefresh(accessToken)
}
export function setRefreshToken(token) {
  refreshToken = token || null
}
export function setTokens({ access_token, refresh_token }) {
  if (typeof access_token !== 'undefined') {
    accessToken = access_token || null
    if (accessToken) schedulePreemptiveRefresh(accessToken)
  }
  if (typeof refresh_token !== 'undefined') {
    refreshToken = refresh_token || null
  }
}
export function clearAccessToken() {
  accessToken = null
  cancelPreemptiveRefresh()
}
export function clearTokens() {
  accessToken = null
  refreshToken = null
  cancelPreemptiveRefresh()
}
export function getAccessToken() {
  return accessToken
}
export function getRefreshToken() {
  return refreshToken
}

// ===== Axios instance
export const api = axios.create({
  baseURL: BASE_URL
})

// ===== Track & cancel semua request aktif (untuk logout)
const controllers = new Set()
function attachAbortController(cfg) {
  const controller = new AbortController()
  controllers.add(controller)
  cfg.signal = controller.signal
  return () => controllers.delete(controller)
}
export function cancelAllRequests() {
  controllers.forEach((c) => c.abort())
  controllers.clear()
}

// ===== Logger: request
api.interceptors.request.use((cfg) => {
  const method = (cfg.method || 'GET').toUpperCase()
  const url = cfg.baseURL ? `${cfg.baseURL}${cfg.url}` : cfg.url
  const body = cfg.data
    ? ` body=${(typeof cfg.data === 'string' ? cfg.data : JSON.stringify(cfg.data)).slice(0, 400)}`
    : ''
  const params = cfg.params ? ` params=${JSON.stringify(cfg.params)}` : ''
  console.log(`[API →] ${method} ${url}${params}${body}`)

  // inject Authorization
  if (accessToken) {
    cfg.headers = cfg.headers || {}
    cfg.headers.Authorization = `Bearer ${accessToken}`
  }

  // attach abort controller
  const cleanup = attachAbortController(cfg)
  cfg.__cleanupAbort = cleanup
  return cfg
})

// ===== Logger: response sukses (dan cleanup abort)
api.interceptors.response.use((res) => {
  console.log(`[API ←] ${res.status} ${res.config?.url}`)
  res.config?.__cleanupAbort?.()
  return res
})

// ===== Single-flight refresh
let refreshInFlight = null
export async function refreshAccessTokenOnce() {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const rt = getRefreshToken()
    if (!rt) {
      const err = new Error('NO_REFRESH_TOKEN')
      err.code = 'NO_REFRESH_TOKEN'
      throw err
    }

    const { data } = await axios.post(
      `${BASE_URL}/api/v1/auth/refresh`,
      { refresh_token: rt },
      { headers: { 'Content-Type': 'application/json' }, timeout: 30_000 }
    )

    const newAccess = data?.data?.access_token
    const newRefresh = data?.data?.refresh_token
    if (!newAccess || !newRefresh) {
      const err = new Error('INVALID_REFRESH_RESPONSE')
      err.code = 'INVALID_REFRESH_RESPONSE'
      throw err
    }

    setTokens({ access_token: newAccess, refresh_token: newRefresh })
    broadcast('auth:updated', { reason: 'refresh' })
    return newAccess
  })()

  try {
    const token = await refreshInFlight
    return token
  } finally {
    refreshInFlight = null
  }
}

// ===== Response error: auto-refresh + retry + CLEAN ERROR MESSAGE
api.interceptors.response.use(undefined, async (err) => {
  const status = err?.response?.status
  const original = err?.config || {}
  const url = original?.url

  console.error(`[API ✖] ${status || '-'} ${url || '-'} :: ${err.message}`)
  original?.__cleanupAbort?.()

  const isAuthEndpoint =
    url?.includes('/api/v1/auth/login') ||
    url?.includes('/api/v1/auth/refresh') ||
    url?.includes('/api/v1/auth/logout')

  if (status === 401 && !isAuthEndpoint && !original._retry) {
    original._retry = true
    try {
      const newAccess = await refreshAccessTokenOnce()
      original.headers = { ...(original.headers || {}), Authorization: `Bearer ${newAccess}` }
      const cleanup = attachAbortController(original)
      original.__cleanupAbort = cleanup
      return api.request(original)
    } catch (refreshErr) {
      clearTokens()
      cancelAllRequests()
      const e = new Error('AUTH_EXPIRED')
      e.code = 'AUTH_EXPIRED'
      e.cause = refreshErr
      broadcast('auth:expired', { reason: 'refresh_failed' })
      throw e
    }
  }

  const d = err?.response?.data
  if (d?.message) console.error('[API Error]', d.message)

  // ⛔ tetap raw untuk 400/404 (buat guard/redirect logic kamu)
  if (d && typeof d === 'object' && (d.status === 400 || d.status === 404)) {
    return Promise.reject(d)
  }

  // ✅ semua selain 400/404 (termasuk 401 login) jadi Error bersih
  if (d && typeof d === 'object' && d.message) {
    const cleanErr = new Error(d.message)
    cleanErr.status = d.status ?? status
    cleanErr.data = d.data
    cleanErr.isApiError = true
    return Promise.reject(cleanErr)
  }

  return Promise.reject(err)
})

export default api
