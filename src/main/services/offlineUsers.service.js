import { app } from 'electron'
import { join } from 'path'
import fs from 'fs'

function getUserDbPath() {
  return join(app.getPath('userData'), 'users.json')
}
function ensureUserDb() {
  const p = getUserDbPath()
  if (!fs.existsSync(p)) {
    const seed = [{ username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' }]
    fs.writeFileSync(p, JSON.stringify(seed, null, 2), 'utf-8')
  }
  return p
}
export function readUsers() {
  const p = ensureUserDb()
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'))
  } catch {
    return []
  }
}
export function writeUsers(list) {
  const p = ensureUserDb()
  fs.writeFileSync(p, JSON.stringify(list, null, 2), 'utf-8')
  return p
}
export { getUserDbPath }
