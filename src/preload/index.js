// src/preload/index.js
import { contextBridge, ipcRenderer, shell, clipboard } from 'electron'

const call = (channel, payload) => ipcRenderer.invoke(channel, payload)

contextBridge.exposeInMainWorld('api', {
  // ============ AUTH ============
  auth: {
    login: (p) => call('auth:login', p),
    logout: () => call('auth:logout'),
    // baru: cek profil user via /auth/me (cek sesi)
    me: () => call('auth:me'),
    // optional: kalau nanti mau pakai manual refresh token di renderer
    refresh: () => call('auth:refresh')
  },

  // ============ USER ============
  users: {
    getAll: (params) => ipcRenderer.invoke('users:getAll', params),
    create: (payload) => ipcRenderer.invoke('users:create', payload),
    update: (payload) => ipcRenderer.invoke('users:update', payload),
    delete: (payload) => ipcRenderer.invoke('users:delete', payload)
  },

  // ============ FILES ============
  files: {
    uploadData: (p) => call('files:uploadData', p),
    uploadProgress: (p) => call('files:uploadProgress', p),
    getFiles: (p) => call('files:getFiles', p),
    listUploads: () => call('files:getFiles', {}),
    getFilePreview: (p) => call('files:getFilePreview', p),
    chooseSDP: () => call('files:chooseSDP'),
    chooseAPK: () => call('files:chooseAPK'),
    getByUrl: (p) => call('files:getByUrl', p),
    readText: (p) => call('files:readText', p),
    readBuffer: (p) => call('files:readBuffer', p),
    onUploadProgressDebug: (cb) => {
      const handler = (_evt, payload) => cb?.(payload)
      ipcRenderer.on('debug:uploadProgress', handler)
      return () => ipcRenderer.removeListener('debug:uploadProgress', handler)
    }
  },

  // ============ ANALYTICS ============
  analytics: {
    // Core
    startAnalyzing: (p) => call('analytics:startAnalyzing', p),
    startExtraction: (p) => call('analytics:startExtraction', p),
    getAll: (p) => call('analytics:getAll', p),

    // ===== Result endpoints =====
    contactCorrelation: (p) => call('analytics:getContactCorrelation', p),
    socialMediaCorrelation: (p) => call('analytics:getSocialMediaCorrelation', p),
    hashfile: (p) => call('analytics:getHashfile', p),
    deepCommunication: (p) => call('analytics:getDeepCommunication', p),

    // === Deep Communication detail ===
    platformIntensity: (p) => call('analytics:getPlatformIntensity', p),
    chatDetail: (p) => call('analytics:getChatDetail', p),

    // === Aliases untuk kompatibilitas kode lama ===
    getContactCorrelation: (p) => call('analytics:getContactCorrelation', p),
    getSocialMediaCorrelation: (p) => call('analytics:getSocialMediaCorrelation', p),
    getHashfileAnalytics: (p) => call('analytics:getHashfile', p),
    getDeepCommunication: (p) => call('analytics:getDeepCommunication', p),

    // alias baru supaya tidak error di DeepCommunicationPage.jsx
    getPlatformIntensity: (p) => call('analytics:getPlatformIntensity', p),
    getPlatformCardsIntensity: (p) => call('analytics:getPlatformIntensity', p),
    getChatDetail: (p) => call('analytics:getChatDetail', p),

    // Satu pintu prefetch
    fetchByMethod: (p) => call('analytics:fetchByMethod', p),

    // ===== Device Management =====
    addDevice: (p) => call('analytics:addDevice', p),
    getDevices: (p) => call('analytics:getDevices', p)
  },

  // ============ DEVICE ============
  device: {
    add: (p) => call('device:add', p),
    listByAnalytic: (p) => call('device:listByAnalytic', p)
  },

  // ============ APK ============
  apk: {
    upload: (p) => call('apk:upload', p),
    analyze: (p) => call('apk:analyze', p),
    get: (p) => call('apk:get', p)
  },

  // ============ REPORT ============
  report: {
    saveSummary: (p) => call('report:saveSummary', p),
    editSummary: (p) => call('report:editSummary', p),
    exportPdf: (p) => call('report:exportPdf', p),
    exportPdfSaveAs: (p) => ipcRenderer.invoke('report:exportPdfSaveAs', p)
  },

  // ============ SHELL & CLIPBOARD ============
  shell: {
    openPath: (p) => shell.openPath(p),
    showItemInFolder: (p) => shell.showItemInFolder(p)
  },
  clipboard: {
    writeText: (t) => clipboard.writeText(t || '')
  }
})

contextBridge.exposeInMainWorld('nativeBridge', {
  pathToFileURL: (p) => call('util:pathToFileURL', p),
  showInFolder: (p) => call('util:showInFolder', p),
  openPath: (p) => call('util:openPath', p),
  copyText: (p) => call('util:copyText', p)
})
