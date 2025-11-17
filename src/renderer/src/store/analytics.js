// src/renderer/src/store/analytics.js
import { create } from 'zustand'

/**
 * ==== LEGACY (tetap dipertahankan) ====
 * history[] item:
 *  - id: string
 *  - date: ISO string
 *  - name: string
 *  - methodId: string | number
 *  - method: string
 *  - notes: string
 *
 * ==== BARU ====
 * selectedMethod: string                       // dari StartAnalyzingModal
 * uploadedFiles[] item:                        // hasil upload lokal
 *  - id: number
 *  - file_name: string
 *  - file_path: string
 *  - notes: string
 *  - type: string
 *  - tools: string
 *  - total_size: number
 *  - total_size_formatted: string
 *  - created_at: ISO string
 *
 * devices[] item (lokal):
 *  - device_id: number
 *  - owner_name: string
 *  - phone_number: string
 *  - file_id: number
 */

const KEY_HISTORY = 'analyticsHistory.v2'
const KEY_FILES = 'analyticsFiles.v1'
const KEY_DEVICES = 'analyticsDevices.v1'
const KEY_METHOD = 'analyticsSelectedMethod.v1'

/* ------------------ utils ------------------ */
const loadJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    const val = JSON.parse(raw || 'null')
    return val ?? fallback
  } catch {
    return fallback
  }
}
const saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val))

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

const formatBytes = (bytes = 0) => {
  if (!bytes) return '0 B'
  const u = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), u.length - 1)
  const v = bytes / Math.pow(1024, i)
  return `${v.toFixed(i === 0 ? 0 : 1)} ${u[i]}`
}

/* ------------------ legacy loader ------------------ */
const loadHistory = () => {
  try {
    const raw = localStorage.getItem(KEY_HISTORY)
    const arr = JSON.parse(raw || '[]')
    if (!Array.isArray(arr)) return []
    return arr.map((r) => ({
      id: r.id ?? createId(),
      date: r.date ?? new Date().toISOString(),
      name: r.name ?? 'Untitled',
      methodId: r.methodId ?? null,
      method: r.method ?? r.methodLabel ?? '-',
      notes: r.notes ?? ''
    }))
  } catch {
    return []
  }
}

/* ------------------ store ------------------ */
export const useAnalytics = create((set, get) => ({
  /* ====== LEGACY ====== */
  history: loadHistory(),
  addEntry: ({ name, methodId = null, methodLabel = '-', notes = '' }) => {
    const entry = {
      id: createId(),
      date: new Date().toISOString(),
      name,
      methodId,
      method: methodLabel,
      notes
    }
    const next = [entry, ...get().history]
    saveJSON(KEY_HISTORY, next)
    set({ history: next })
    return entry
  },
  removeById: (id) => {
    const next = get().history.filter((e) => e.id !== id)
    saveJSON(KEY_HISTORY, next)
    set({ history: next })
  },
  clearAll: () => {
    localStorage.removeItem(KEY_HISTORY)
    set({ history: [] })
  },

  /* ====== NEW: METHOD TERPILIH ====== */
  selectedMethod: loadJSON(KEY_METHOD, ''), // ex: "Deep Communication Analytics"
  setSelectedMethod: (m) => {
    saveJSON(KEY_METHOD, m)
    set({ selectedMethod: m })
  },

  /* ====== NEW: FILES LOKAL ====== */
  uploadedFiles: loadJSON(KEY_FILES, []), // metadata saja; File object tidak disimpan
  addUploadedFile: (payload) => {
    const id = Date.now()
    const created_at = new Date().toISOString()
    const size = payload.total_size ?? payload.rawFile?.size ?? 0
    const rec = {
      id,
      file_name: payload.file_name || payload.rawFile?.name || 'Untitled',
      file_path: payload.file_path || payload.rawFile?.name || '',
      notes: payload.notes || '',
      type: payload.type || '',
      tools: payload.tools || '',
      total_size: size,
      total_size_formatted: formatBytes(size),
      created_at
    }
    const next = [rec, ...get().uploadedFiles]
    saveJSON(KEY_FILES, next)
    set({ uploadedFiles: next })
    return rec
  },
  removeUploadedFile: (fileId) => {
    const next = get().uploadedFiles.filter((f) => f.id !== fileId)
    saveJSON(KEY_FILES, next)
    set({ uploadedFiles: next })
  },
  clearUploadedFiles: () => {
    saveJSON(KEY_FILES, [])
    set({ uploadedFiles: [] })
  },

  /* ====== NEW: DEVICES LOKAL ====== */
  devices: loadJSON(KEY_DEVICES, []),
  addDeviceLocal: ({ owner_name, phone_number, file_id }) => {
    const device = { device_id: Date.now(), owner_name, phone_number, file_id }
    const next = [device, ...get().devices]
    saveJSON(KEY_DEVICES, next)
    set({ devices: next })
    return device
  },
  removeDeviceLocal: (device_id) => {
    const next = get().devices.filter((d) => d.device_id !== device_id)
    saveJSON(KEY_DEVICES, next)
    set({ devices: next })
  },
  clearDevices: () => {
    saveJSON(KEY_DEVICES, [])
    set({ devices: [] })
  }
}))
