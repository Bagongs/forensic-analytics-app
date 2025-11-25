/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { create } from 'zustand'

export const useAuth = create((set, get) => ({
  authed: false,
  user: null,
  busy: false,
  error: '',
  isLoaded: false,

  // ========================================
  // INIT / CHECK SESSION
  // ========================================
  init: async () => {
    if (get().isLoaded) return

    try {
      const res = await window.api.auth.me()
      const wrapper = res?.data
      const userData = wrapper?.data || wrapper

      if (!userData) throw new Error('No user data')

      set({
        authed: true,
        user: {
          id: userData.id,
          email: userData.email,
          fullname: userData.fullname,
          tag: userData.tag,
          role: userData.role,
          password: userData.password
        },
        isLoaded: true,
        error: ''
      })

      return true
    } catch (err) {
      set({
        authed: false,
        user: null,
        isLoaded: true
      })
      return false
    }
  },

  check: async () => {
    const ok = await get().init()
    return ok
  },

  // ========================================
  // LOGIN
  // ========================================
  login: async ({ email, password }) => {
    set({ busy: true, error: '' })
    try {
      const res = await window.api.auth.login({ email, password })

      if (!res?.ok) {
        const msg = res?.message || 'Login gagal'
        set({ error: msg, authed: false, user: null })
        return { ok: false, error: msg }
      }

      const payload = res.data
      const userData = payload?.data?.user || payload?.user
      if (!userData) throw new Error('User data missing in response')

      set({
        authed: true,
        user: {
          id: userData.id,
          email: userData.email,
          fullname: userData.fullname,
          tag: userData.tag,
          role: userData.role
        },
        isLoaded: true,
        error: ''
      })

      return { ok: true }
    } catch (e) {
      const msg = e?.message || 'Login gagal'
      set({ error: msg, authed: false, user: null })
      return { ok: false, error: msg }
    } finally {
      set({ busy: false })
    }
  },

  // ========================================
  // LOGOUT
  // ========================================
  logout: async () => {
    try {
      await window.api.auth.logout()
    } catch {}

    set({
      authed: false,
      user: null,
      error: '',
      isLoaded: true
    })
  }
}))
