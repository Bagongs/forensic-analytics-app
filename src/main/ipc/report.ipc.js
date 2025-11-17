// src/main/ipc/report.ipc.js
import { ipcMain } from 'electron'
import { saveSummary, editSummary, exportPdf, exportPdfSaveAs } from '../services/report.service.js'

function assertHas(obj, keys = []) {
  for (const k of keys) {
    if (!obj || obj[k] === undefined || obj[k] === null || obj[k] === '')
      throw new Error(`Missing required param: ${k}`)
  }
}

export default function registerReportIpc() {
  ipcMain.handle('report:saveSummary', async (_e, p) => {
    try {
      assertHas(p, ['analytic_id', 'summary'])
      return await saveSummary(p)
    } catch (err) {
      throw new Error(`saveSummary failed: ${err.message || err}`)
    }
  })

  ipcMain.handle('report:editSummary', async (_e, p) => {
    try {
      assertHas(p, ['analytic_id', 'summary'])
      return await editSummary(p)
    } catch (err) {
      throw new Error(`editSummary failed: ${err.message || err}`)
    }
  })

  ipcMain.handle('report:exportPdf', async (_e, p) => {
    try {
      assertHas(p, ['analytic_id'])
      return await exportPdf(p)
    } catch (err) {
      throw new Error(`exportPdf failed: ${err.message || err}`)
    }
  })

  // Opsional: tombol "Save As"
  ipcMain.handle('report:exportPdfSaveAs', async (_e, p) => {
    try {
      assertHas(p, ['analytic_id'])
      return await exportPdfSaveAs(p)
    } catch (err) {
      throw new Error(`exportPdfSaveAs failed: ${err.message || err}`)
    }
  })
}
