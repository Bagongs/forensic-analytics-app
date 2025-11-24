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
    return await createUser(payload)
  })

  // UPDATE USER (support both signatures)
  ipcMain.handle('users:update', async (_e, arg1, arg2) => {
    let id, payload

    // style A: invoke('users:update', { id, payload })
    if (arg1 && typeof arg1 === 'object') {
      id = arg1.id ?? arg1.user_id
      payload = arg1.payload ?? arg1.body
    }
    // style B: invoke('users:update', id, payload)
    else {
      id = arg1
      payload = arg2
    }

    if (id == null) throw new Error('Missing user id for update')
    if (!payload || typeof payload !== 'object') throw new Error('Missing update body')

    return await updateUser({ user_id: id, body: payload })
  })

  // DELETE USER (support both signatures)
  ipcMain.handle('users:delete', async (_e, arg1) => {
    let id

    // style A: invoke('users:delete', { id })
    if (arg1 && typeof arg1 === 'object') {
      id = arg1.id ?? arg1.user_id
    }
    // style B: invoke('users:delete', id)
    else {
      id = arg1
    }

    if (id == null) throw new Error('Missing user id for delete')

    return await deleteUser({ user_id: id })
  })
}
