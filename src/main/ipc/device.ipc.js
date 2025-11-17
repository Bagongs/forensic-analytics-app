import { ipcMain } from 'electron'
import { addDevice, getDevicesByAnalytic } from '../services/device.service'

export default function registerDeviceIpc() {
  ipcMain.handle('device:add', (_e, p) => addDevice(p))
  ipcMain.handle('device:listByAnalytic', (_e, p) => getDevicesByAnalytic(p))
}
