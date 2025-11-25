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
          // password hanya di RAM (state), tidak ke storage permanen
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
      // 1) Login dulu → ini akan set token di main process
      const res = await window.api.auth.login({ email, password })

      if (!res?.ok) {
        const msg = res?.message || 'Login gagal'
        set({ error: msg, authed: false, user: null })
        return { ok: false, error: msg }
      }

      // 2) Setelah login sukses, ambil profil lengkap dari /auth/me
      const meRes = await window.api.auth.me()
      const wrapper = meRes?.data
      const userData = wrapper?.data || wrapper

      if (!userData) throw new Error('User data missing in /auth/me')

      set({
        authed: true,
        user: {
          id: userData.id,
          email: userData.email,
          fullname: userData.fullname,
          tag: userData.tag,
          role: userData.role,
          // password hanya ada di state, tidak disimpan di mana-mana lagi
          password: userData.password
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
