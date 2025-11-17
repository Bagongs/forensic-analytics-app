// src/main/services/tokenStore.js
import Store from 'electron-store'

const store = new Store({ name: 'auth' })
const KEY = {
  access: 'auth.access_token',
  refresh: 'auth.refresh_token',
  user: 'auth.user'
}

export function getAccessToken() {
  return store.get(KEY.access, null)
}
export function getRefreshToken() {
  return store.get(KEY.refresh, null)
}
export function setTokens({ access_token, refresh_token }) {
  if (access_token) store.set(KEY.access, access_token)
  if (refresh_token) store.set(KEY.refresh, refresh_token)
}
export function clearTokens() {
  store.delete(KEY.access)
  store.delete(KEY.refresh)
  store.delete(KEY.user)
}
export function setUser(user) {
  store.set(KEY.user, user || null)
}
export function getUser() {
  return store.get(KEY.user, null)
}

export default {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
  setUser,
  getUser
}
