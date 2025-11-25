// src/main/ipc/analytics.ipc.js
import { ipcMain } from 'electron'
import { ANALYTICS_METHODS } from '../../renderer/src/shared/analyticsMethods'
import {
  startAnalyzing,
  startExtraction,
  getAllAnalytics,
  getContactCorrelation,
  getSocialMediaCorrelation,
  getHashfileAnalytics,
  getDeepCommunication,
  getPlatformCardsIntensity,
  getChatDetail,
  addDevice,
  getDevices,
  fetchByMethod
} from '../services/analytics.service'

/* ============================================================
   Helper: pastikan payload kontrak tidak "hilang"
   - Plain object kontrak => Error(JSON.stringify(obj))
   - Error instance biasa => lempar apa adanya
   - Error instance dengan message JSON => lempar apa adanya
============================================================ */
const wrapIpc = (fn) => async (_e, payload) => {
  try {
    return await fn(payload)
  } catch (err) {
    // 1) kalau sudah Error instance, jangan stringify lagi
    if (err instanceof Error) {
      // message JSON kontrak juga tetap aman (renderer akan parse)
      throw err
    }

    // 2) kalau plain object kontrak / object lain
    if (err && typeof err === 'object') {
      try {
        throw new Error(JSON.stringify(err))
      } catch {
        // fallback terakhir kalau stringify gagal (circular)
        throw new Error(
          JSON.stringify({
            status: err.status || 500,
            message: err.message || 'Unknown error',
            data: err.data || null
          })
        )
      }
    }

    // 3) string / primitive
    throw new Error(String(err))
  }
}

export default function registerAnalyticsIpc() {
  ipcMain.handle(
    'analytics:startAnalyzing',
    wrapIpc(async (_payload) => {
      const name = String(_payload?.analytic_name || '').trim()
      const method = String(_payload?.method || '').trim()

      if (!name) throw new Error('Validation: analytic_name is required')
      if (!ANALYTICS_METHODS.includes(method)) {
        throw new Error(`Validation: method must be one of: ${ANALYTICS_METHODS.join(', ')}`)
      }
      return await startAnalyzing({ analytic_name: name, method })
    })
  )

  ipcMain.handle('analytics:startExtraction', wrapIpc(startExtraction))
  ipcMain.handle(
    'analytics:getAll',
    wrapIpc((p) => getAllAnalytics(p || {}))
  )

  // results
  ipcMain.handle('analytics:getContactCorrelation', wrapIpc(getContactCorrelation))
  ipcMain.handle('analytics:getSocialMediaCorrelation', wrapIpc(getSocialMediaCorrelation))
  ipcMain.handle('analytics:getHashfile', wrapIpc(getHashfileAnalytics))
  ipcMain.handle('analytics:getDeepCommunication', wrapIpc(getDeepCommunication))
  ipcMain.handle('analytics:getPlatformIntensity', wrapIpc(getPlatformCardsIntensity))
  ipcMain.handle('analytics:getChatDetail', wrapIpc(getChatDetail))

  // device management
  ipcMain.handle('analytics:addDevice', wrapIpc(addDevice))
  ipcMain.handle('analytics:getDevices', wrapIpc(getDevices))

  // orchestration
  ipcMain.handle('analytics:fetchByMethod', wrapIpc(fetchByMethod))
}
