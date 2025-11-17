/* eslint-disable no-empty */
// src/main/ipc/apk.ipc.js
import { ipcMain } from 'electron'
import { uploadApk, analyzeApk, getApkAnalytic } from '../services/apk.service'

function relayAxiosError(err, tag) {
  const payload = {
    tag,
    type: err?.name || 'AxiosError',
    message: err?.message,
    status: err?.response?.status,
    data: err?.response?.data,
    url: err?.config?.url,
    method: err?.config?.method
  }
  // log lengkap di main-process untuk debugging
  console.error(`[${tag}]`, payload)
  // bungkus supaya properti2 ikut sampai ke renderer (di dalam message)
  const wrapped = new Error(JSON.stringify(payload))
  wrapped.name = 'RemoteAxiosError'
  throw wrapped
}

export default function registerApkIpc() {
  // guard hapus handler lama (aman untuk dev hot-reload)
  try {
    ipcMain.removeHandler('apk:upload')
  } catch {}
  try {
    ipcMain.removeHandler('apk:analyze')
  } catch {}
  try {
    ipcMain.removeHandler('apk:get')
  } catch {}

  ipcMain.handle('apk:upload', async (_e, p) => {
    try {
      return await uploadApk(p)
    } catch (err) {
      relayAxiosError(err, 'apk:upload')
    }
  })

  ipcMain.handle('apk:analyze', async (_e, p) => {
    try {
      return await analyzeApk(p)
    } catch (err) {
      relayAxiosError(err, 'apk:analyze')
    }
  })

  ipcMain.handle('apk:get', async (_e, p) => {
    try {
      return await getApkAnalytic(p)
    } catch (err) {
      relayAxiosError(err, 'apk:get')
    }
  })
}
