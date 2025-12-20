// src/main/index.js
import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'

/* ====== Registrasi IPC (pastikan file-file ini ada) ====== */
import registerAuthIpc from './ipc/auth.ipc'
import registerFilesIpc from './ipc/files.ipc'
import registerAnalyticsIpc from './ipc/analytics.ipc'
import registerDeviceIpc from './ipc/device.ipc'
import registerApkIpc from './ipc/apk.ipc'
import registerReportIpc from './ipc/report.ipc'
import registerUsersIpc from './ipc/users.ipc'
import axios from 'axios'

const BACKEND_BASE = import.meta.env?.VITE_BACKEND_BASE_URL || 'http://192.168.8.116:8000'

/* ====== Unhandled errors safeguard ====== */
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason)
})

/* ====== Single Instance Lock (hindari multi-window app start) ====== */
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

/* ====== Buat Window ====== */
function createWindow() {
  const win = new BrowserWindow({
    width: 1366,
    height: 900,
    show: false,
    // fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: '#0B0F17',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: true
    }
  })

  // ⭐ Pastikan ketika siap, window benar-benar dimunculkan & difokuskan
  win.once('ready-to-show', () => {
    win.show()
    win.focus()
  })

  if (is.dev) {
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.removeMenu?.()
  }

  // electron-vite: saat dev gunakan ELECTRON_RENDERER_URL,
  // saat prod load file html yang dibundle.
  const pageUrl =
    process.env.ELECTRON_RENDERER_URL || `file://${join(__dirname, '../renderer/index.html')}#/?`

  win.loadURL(pageUrl)

  return win
}

/* ====== App lifecycle ====== */
app.whenReady().then(() => {
  // ⭐ Bagus kalau AppUserModelID dibuat mirip reverse-DNS, tapi ini opsional
  electronApp.setAppUserModelId('com.sii.forensic-analytics')

  // Optimizer: keyboard shortcuts dll di dev
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Registrasi semua kanal IPC
  registerAuthIpc()
  registerFilesIpc()
  registerAnalyticsIpc()
  registerDeviceIpc()
  registerApkIpc()
  registerReportIpc()
  registerUsersIpc()

  ipcMain.on('quit-app', () => {
    console.log('[IPC] quit-app → closing application')
    app.quit()
  })

  createWindow()

  ipcMain.handle('license:getInfo', async () => {
    try {
      const res = await axios.get(`${BACKEND_BASE}/license`)
      return res.data
    } catch (error) {
      console.error('[IPC license:getInfo] Error:', error)
      return {
        status: 500,
        message: 'Failed to get license',
        error: error.message
      }
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('second-instance', () => {
  const [win] = BrowserWindow.getAllWindows()
  if (win) {
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
