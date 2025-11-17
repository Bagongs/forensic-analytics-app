// src/renderer/src/store/analyticsCache.js
import { create } from 'zustand'

export const useAnalyticsCache = create((set, get) => ({
  results: {}, // key: `${analytic_id}:${methodKey}`

  setResult: (analytic_id, method, data) => {
    const key = `${analytic_id}:${String(method).toLowerCase()}`
    set((s) => ({ results: { ...s.results, [key]: { data, ts: Date.now() } } }))
  },

  getResult: (analytic_id, method) => {
    const key = `${analytic_id}:${String(method).toLowerCase()}`
    return get().results[key] || null
  },

  clearAnalytic: (analytic_id) => {
    const next = { ...get().results }
    Object.keys(next).forEach((k) => {
      if (k.startsWith(`${analytic_id}:`)) delete next[k]
    })
    set({ results: next })
  }
}))
