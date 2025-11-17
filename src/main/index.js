// src/main/index.js
import { app, BrowserWindow } from 'electron'
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
    show: true,
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
}

/* ====== App lifecycle ====== */
app.whenReady().then(() => {
  electronApp.setAppUserModelId('forensic-analytics')

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

  createWindow()

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
