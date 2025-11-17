/* eslint-disable no-empty */
// src/main/ipc/ap1.js
const { ipcMain } = require('electron')
const FormData = require('form-data')
const fs = require('fs')
const path = require('path')
const { http, tokens } = require('../services/httpClient')

function registerApiIpc() {
  ipcMain.handle('api:auth:login', async (_e, { email, password }) => {
    const { data } = await http.post('/auth/login', { email, password })
    const access = data?.data?.tokens?.access_token
    const refresh = data?.data?.tokens?.refresh_token
    const user = data?.data?.user
    tokens.set({ access, refresh })
    return { user }
  })

  ipcMain.handle('api:auth:logout', async () => {
    try {
      await http.post('/auth/logout') // Bearer by interceptor
    } catch {}
    tokens.clear()
    return { ok: true }
  })

  ipcMain.handle('api:files:all', async () => {
    const { data } = await http.get('/analytics/files/all')
    return data
  })

  // Upload data (multipart): file + metadata (file_name, notes, type, tools)
  ipcMain.handle('api:analytics:upload-data', async (_e, payload) => {
    const { filePath, file_name, notes, type, tools } = payload
    if (!filePath || !fs.existsSync(filePath)) throw new Error('File path invalid.')
    const fd = new FormData()
    fd.append('file', fs.createReadStream(filePath), path.basename(filePath))
    fd.append('file_name', file_name)
    fd.append('notes', notes)
    fd.append('type', type) // Handphone | SSD | Harddisk | PC | Laptop | DVR
    fd.append('tools', tools) // Oxygen | Cellebrite | Axiom | Encase

    const { data } = await http.post('/analytics/upload-data', fd, {
      headers: fd.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    })
    return data // { status, message, data: { upload_id, file_id, ... } }
  })

  ipcMain.handle('api:analytics:create-with-devices', async (_e, body) => {
    const { data } = await http.post('/analytics/create-analytic-with-devices', body)
    return data
  })

  ipcMain.handle('api:analytics:save-summary', async (_e, { analytic_id, summary }) => {
    const { data } = await http.post(`/analytic/${analytic_id}/save-summary`, { summary })
    return data
  })

  // Contoh fetch hasil
  ipcMain.handle('api:analytic:contact-correlation', async (_e, { analytic_id }) => {
    const { data } = await http.get(`/analytic/${analytic_id}/contact-correlation`)
    return data
  })

  ipcMain.handle('api:analytic:hashfile-analytics', async (_e, { analytic_id }) => {
    const { data } = await http.get(`/analytic/${analytic_id}/hashfile-analytics`)
    return data
  })

  ipcMain.handle('api:analytics:deep-communication', async (_e, { analytic_id }) => {
    const { data } = await http.get(`/analytics/${analytic_id}/deep-communication`)
    return data
  })

  ipcMain.handle('api:analytics:apk-analytic', async (_e, { analytic_id }) => {
    const { data } = await http.get(`/analytics/${analytic_id}/apk-analytic`)
    return data
  })
}

module.exports = { registerApiIpc }
