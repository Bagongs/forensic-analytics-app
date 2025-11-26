import { ipcMain } from 'electron'
import { login, logout, getProfile } from '../services/auth.service'
import { setAuthEventTarget } from '../services/apiClient'

export default function registerAuthIpc(mainWindow) {
  setAuthEventTarget(mainWindow)

  ipcMain.handle('auth:login', async (_e, payload) => {
    try {
      const data = await login(payload)
      return { ok: true, data } // data = {status, message, data}
    } catch (e) {
      // e dari apiClient sudah "clean" -> e.message = "Invalid credentials"
      const msg =
        e && typeof e === 'object' && e.message ? e.message : e?.message || 'Failed to Login'

      return { ok: false, message: msg, status: e?.status }
    }
  })

  ipcMain.handle('auth:logout', async () => {
    try {
      await logout()
      return { ok: true }
    } catch (e) {
      return { ok: false, message: e?.message || 'Failed to Logout' }
    }
  })

  ipcMain.handle('auth:me', async () => {
    try {
      const data = await getProfile()
      return { ok: true, data }
    } catch (e) {
      return { ok: false, message: e?.message || 'Unauthorized' }
    }
  })
}
