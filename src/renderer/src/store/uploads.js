/* eslint-disable no-unused-vars */
// src/renderer/src/store/uploads.js
/* eslint-disable no-empty */
import { create } from 'zustand'

const KEY = 'uploads.v2'

const loadLocal = () => {
  try {
    const raw = localStorage.getItem(KEY)
    const arr = JSON.parse(raw || '[]')
    if (!Array.isArray(arr)) return []
    return arr.map((u) => ({
      id: u.id ?? String(Date.now()),
      date: u.date ?? new Date().toISOString(),
      kind: u.kind ?? 'FILE',
      fileName: u.fileName ?? u.file_name ?? 'Unnamed',
      notes: u.notes ?? '',
      type: u.type ?? null,
      tools: Array.isArray(u.tools) ? u.tools : u.tools ? [u.tools] : [],
      file_path: u.file_path ?? undefined,
      file_id: u.file_id ?? undefined
    }))
  } catch {
    return []
  }
}
const saveLocal = (list) => localStorage.setItem(KEY, JSON.stringify(list))

const createId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`

export const useUploads = create((set, get) => ({
  uploads: loadLocal(), // persisted
  runtime: { previewMap: {} }, // id -> objectURL (non-persist)

  // === getters ===
  getPreviewURL: (id) => {
    const { uploads, runtime } = get()
    const row = uploads.find((u) => u.id === id)
    if (!row) return null
    if (row.file_path) return null // jika ada path, UI gunakan file:// via preload, tidak objectURL
    return runtime.previewMap[id] || null
  },

  // === actions ===
  addUpload: ({ kind, fileName, notes, type, tools, filePath, fileBlob, file_id }) => {
    const id = createId()
    const row = {
      id,
      date: new Date().toISOString(),
      kind: (kind || '').toUpperCase() || 'FILE',
      fileName,
      notes,
      type: type || null,
      tools: Array.isArray(tools) ? tools : tools ? [tools] : [],
      ...(filePath ? { file_path: filePath } : {}),
      ...(file_id ? { file_id } : {})
    }

    const next = [row, ...get().uploads]
    saveLocal(next)

    if (!filePath && fileBlob instanceof Blob) {
      const url = URL.createObjectURL(fileBlob)
      set((s) => ({
        uploads: next,
        runtime: { previewMap: { ...s.runtime.previewMap, [id]: url } }
      }))
    } else {
      set({ uploads: next })
    }
    return row
  },

  setPreviewFor: (id, fileBlob) => {
    if (!(fileBlob instanceof Blob)) return
    const { runtime } = get()
    const old = runtime.previewMap[id]
    if (old) URL.revokeObjectURL(old)
    const url = URL.createObjectURL(fileBlob)
    set({ runtime: { previewMap: { ...runtime.previewMap, [id]: url } } })
  },

  // Alias yang dipakai oleh UI terbaru (kamu bisa pakai ini untuk set dari buffer BE)
  setPreviewURL: (id, objectUrl) => {
    const { runtime } = get()
    // revoke dulu kalau ada
    const old = runtime.previewMap[id]
    if (old && old !== objectUrl) {
      try {
        URL.revokeObjectURL(old)
      } catch {}
    }
    set({ runtime: { previewMap: { ...runtime.previewMap, [id]: objectUrl } } })
  },

  removeUpload: (id) => {
    const { uploads, runtime } = get()
    const next = uploads.filter((u) => u.id !== id)
    saveLocal(next)
    const prevUrl = runtime.previewMap[id]
    if (prevUrl) {
      try {
        URL.revokeObjectURL(prevUrl)
      } catch {}
    }
    const { [id]: _, ...rest } = runtime.previewMap
    set({ uploads: next, runtime: { previewMap: rest } })
  },

  clearAll: () => {
    const { runtime } = get()
    Object.values(runtime.previewMap || {}).forEach((u) => {
      try {
        URL.revokeObjectURL(u)
      } catch {}
    })
    localStorage.removeItem(KEY)
    set({ uploads: [], runtime: { previewMap: {} } })
  },

  /**
   * === NEW ===
   * Ambil list uploaded files dari BE dan merge ke tabel kiri.
   * Mapper ini *defensif* untuk berbagai bentuk shape data.
   */
  loadFromServer: async ({ search, filter = 'All' } = {}) => {
    try {
      const res = await window.api.files.getFiles({ search, filter })
      const list = Array.isArray(res?.data) ? res.data : res?.items || res?.rows || []
      const mapped = list.map((r) => {
        const id = r.local_id || r.id || r.file_id || createId()
        return {
          id: String(id),
          date: r.created_at || r.date || new Date().toISOString(),
          kind: (
            r.kind ||
            r.file_kind ||
            (r.file_name?.toLowerCase()?.endsWith('.apk') ? 'APK' : 'SDP') ||
            'FILE'
          ).toUpperCase(),
          fileName: r.file_name || r.name || 'Unnamed',
          notes: r.notes || '',
          type: r.type || null,
          tools: Array.isArray(r.tools) ? r.tools : r.tools ? [r.tools] : [],
          file_path: r.file_path || undefined, // jika BE mengembalikan path lokal (opsional)
          file_id: r.file_id || r.id || undefined
        }
      })

      // Strategi merge: ganti semua (paling aman & simpel)
      saveLocal(mapped)
      set((s) => ({ uploads: mapped, runtime: s.runtime }))
    } catch (e) {
      console.error('loadFromServer uploads error:', e)
    }
  }
}))
