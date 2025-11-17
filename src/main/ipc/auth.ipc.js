import { ipcMain } from 'electron'
import { login, logout, getProfile } from '../services/auth.service'
import { setAuthEventTarget } from '../services/apiClient'

export default function registerAuthIpc(mainWindow) {
  setAuthEventTarget(mainWindow)

  ipcMain.handle('auth:login', async (_e, payload) => login(payload))
  ipcMain.handle('auth:logout', async () => logout())
  ipcMain.handle('auth:me', async () => getProfile())
}
