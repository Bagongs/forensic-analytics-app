// src/main/ipc/util.ipc.js
import { ipcMain, shell, clipboard } from 'electron'
import { pathToFileURL } from 'node:url'

ipcMain.handle('util:pathToFileURL', (_e, p) => {
  if (!p?.path) throw new Error('util:pathToFileURL → path kosong')
  return pathToFileURL(p.path).toString()
})

ipcMain.handle('util:showInFolder', (_e, p) => {
  if (!p?.path) throw new Error('util:showInFolder → path kosong')
  shell.showItemInFolder(p.path)
  return true
})

ipcMain.handle('util:openPath', (_e, p) => {
  if (!p?.path) throw new Error('util:openPath → path kosong')
  return shell.openPath(p.path)
})

ipcMain.handle('util:copyText', (_e, p) => {
  clipboard.writeText(p?.text || '')
  return true
})
