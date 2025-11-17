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

export default function registerAnalyticsIpc() {
  ipcMain.handle('analytics:startAnalyzing', async (_e, payload) => {
    const name = String(payload?.analytic_name || '').trim()
    const method = String(payload?.method || '').trim()

    if (!name) throw new Error('Validation: analytic_name is required')
    if (!ANALYTICS_METHODS.includes(method)) {
      throw new Error(`Validation: method must be one of: ${ANALYTICS_METHODS.join(', ')}`)
    }
    return await startAnalyzing({ analytic_name: name, method })
  })

  ipcMain.handle('analytics:startExtraction', (_e, p) => startExtraction(p))
  ipcMain.handle('analytics:getAll', (_e, p) => getAllAnalytics(p || {}))

  // results
  ipcMain.handle('analytics:getContactCorrelation', (_e, p) => getContactCorrelation(p))
  ipcMain.handle('analytics:getSocialMediaCorrelation', (_e, p) => getSocialMediaCorrelation(p))
  ipcMain.handle('analytics:getHashfile', (_e, p) => getHashfileAnalytics(p))
  ipcMain.handle('analytics:getDeepCommunication', (_e, p) => getDeepCommunication(p))
  ipcMain.handle('analytics:getPlatformIntensity', (_e, p) => getPlatformCardsIntensity(p))
  ipcMain.handle('analytics:getChatDetail', (_e, p) => getChatDetail(p))

  // device management
  ipcMain.handle('analytics:addDevice', (_e, p) => addDevice(p))
  ipcMain.handle('analytics:getDevices', (_e, p) => getDevices(p))

  // orchestration
  ipcMain.handle('analytics:fetchByMethod', (_e, p) => fetchByMethod(p))
}
