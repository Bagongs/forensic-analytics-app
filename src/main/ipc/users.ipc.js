// src/main/ipc/users.ipc.js
import { ipcMain } from 'electron'
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  mapServerUser
} from '../services/users.service.js'

export default function registerUsersIpc() {
  // GET ALL USERS
  ipcMain.handle('users:getAll', async (_e, params) => {
    const res = await getAllUsers(params)
    const users = (res?.data || []).map(mapServerUser)
    return { users, total: res?.total ?? users.length }
  })

  // CREATE USER
  ipcMain.handle('users:create', async (_e, payload) => {
    return await createUser(payload) // backend already returns {data: user}
  })

  // UPDATE USER
  ipcMain.handle('users:update', async (_e, { id, payload }) => {
    return await updateUser({ user_id: id, body: payload })
  })

  // DELETE USER
  ipcMain.handle('users:delete', async (_e, { id }) => {
    return await deleteUser({ user_id: id })
  })
}
