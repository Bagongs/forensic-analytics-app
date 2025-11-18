/* eslint-disable no-unused-vars */
/* eslint-disable no-empty */
/* ============================================================
   API CLIENT — Forensic Analytics (Electron-Vite / React JS)
   ============================================================ */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.15.2.105:8000'

/* ---------- Token helpers ---------- */
export const getToken = () => localStorage.getItem('access_token') || ''
export const setToken = (t) => t && localStorage.setItem('access_token', t)
export const clearToken = () => {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}

/* ---------- Core fetch wrapper (JSON) ---------- */
export async function apiFetch(path, { method = 'GET', headers = {}, body } = {}) {
  const token = getToken()
  const finalHeaders = {
    ...(body && typeof body === 'object' && !(body instanceof FormData)
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body && body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
  })

  let data = null
  try {
    data = await res.json()
  } catch (_) {}

  if (!res.ok) {
    const err = new Error(data?.message || `HTTP ${res.status}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

/* ---------- Upload with progress (FormData) ---------- */
/** onProgress: fn(percent: number) */
export function xhrUpload(path, formData, { method = 'POST', onProgress, headers = {} } = {}) {
  const token = getToken()
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(method, `${BASE_URL}${path}`, true)
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v))

    xhr.upload.onprogress = (evt) => {
      if (!evt.lengthComputable || !onProgress) return
      const pct = Math.round((evt.loaded / evt.total) * 100)
      onProgress(pct)
    }

    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) return
      if (xhr.status >= 200 && xhr.status < 300) {
        let json = null
        try {
          json = JSON.parse(xhr.responseText || '{}')
        } catch {}
        resolve(json)
      } else {
        let msg = `HTTP ${xhr.status}`
        try {
          msg = JSON.parse(xhr.responseText)?.message || msg
        } catch {}
        const err = new Error(msg)
        err.status = xhr.status
        reject(err)
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))
    xhr.send(formData)
  })
}

/* ---------- File download helper ---------- */
export async function apiDownload(path, filename, { method = 'GET', body } = {}) {
  const token = getToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'download'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* ============================================================
      AUTH
      ============================================================ */
export const AuthAPI = {
  async login(email, password) {
    const res = await apiFetch('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    const token = res?.data?.access_token
    const user = res?.data?.user
    if (!token) throw new Error('Token is missing in response')
    setToken(token)
    if (user) localStorage.setItem('user', JSON.stringify(user))
    return { token, user }
  },

  async me() {
    const res = await apiFetch('/api/v1/auth/me')
    return res?.data?.user
  },

  async logout() {
    try {
      await apiFetch('/api/v1/auth/logout', { method: 'POST' })
    } catch (_) {}
    clearToken()
  }
}

/* ============================================================
      UPLOADS (XDP, APK) — gunakan xhrUpload agar ada progress
      ============================================================ */
export const UploadAPI = {
  /** formData: {file: File, ...} */
  uploadXDP(formData, { onProgress } = {}) {
    return xhrUpload('/api/v1/xdp/upload', formData, { onProgress })
  },
  uploadAPK(formData, { onProgress } = {}) {
    return xhrUpload('/api/v1/apk/upload', formData, { onProgress })
  }
}

/* ============================================================
      ANALYTICS — start & get result untuk setiap metode
      (Nama path sesuaikan kontrak kamu; ganti jika berbeda)
      ============================================================ */
export const AnalyticsAPI = {
  // Deep Communication
  startDeep(payload) {
    return apiFetch('/api/v1/analytics/deep-communication', {
      method: 'POST',
      body: payload
    })
  },
  getDeepResult(id) {
    return apiFetch(`/api/v1/analytics/deep-communication/${id}`)
  },

  // Contact Correlation
  startContact(payload) {
    return apiFetch('/api/v1/analytics/contact-correlation', {
      method: 'POST',
      body: payload
    })
  },
  getContactResult(id) {
    return apiFetch(`/api/v1/analytics/contact-correlation/${id}`)
  },

  // Hashfile Analytics
  startHashfile(payload) {
    return apiFetch('/api/v1/analytics/hashfile', {
      method: 'POST',
      body: payload
    })
  },
  getHashfileResult(id) {
    return apiFetch(`/api/v1/analytics/hashfile/${id}`)
  },

  // Social Media Correlation
  startSocial(payload) {
    return apiFetch('/api/v1/analytics/social-media', {
      method: 'POST',
      body: payload
    })
  },
  getSocialResult(id) {
    return apiFetch(`/api/v1/analytics/social-media/${id}`)
  },

  // Generic status polling (opsional)
  getStatus(jobId) {
    return apiFetch(`/api/v1/analytics/status/${jobId}`)
  }
}

/* ============================================================
      CASES & DEVICES
      ============================================================ */
export const CaseAPI = {
  list(params = {}) {
    return apiFetch('/api/v1/cases' + toQuery(params))
  },
  create(payload) {
    return apiFetch('/api/v1/cases', { method: 'POST', body: payload })
  },
  detail(id) {
    return apiFetch(`/api/v1/cases/${id}`)
  }
}

export const DeviceAPI = {
  list(params = {}) {
    return apiFetch('/api/v1/devices' + toQuery(params))
  },
  detail(id) {
    return apiFetch(`/api/v1/devices/${id}`)
  }
}

/* ============================================================
      REPORT / EXPORT
      ============================================================ */
export const ReportAPI = {
  // contoh: export hasil analitik ke CSV/PDF
  exportAnalysis(id, format = 'pdf') {
    return apiDownload(
      `/api/v1/analytics/${id}/export?format=${encodeURIComponent(format)}`,
      `analysis-${id}.${format}`
    )
  }
}

/* ---------- util kecil ---------- */
function toQuery(obj) {
  const q = new URLSearchParams(obj || {}).toString()
  return q ? `?${q}` : ''
}
