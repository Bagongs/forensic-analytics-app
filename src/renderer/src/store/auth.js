/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
import { create } from 'zustand'

export const useAuth = create((set, get) => ({
  authed: false,
  user: null,
  busy: false,
  error: '',
  isLoaded: false, // <<< penting untuk tahu "sudah cek session atau belum"

  // ========================================
  // INIT / CHECK SESSION (dipanggil saat app start)
  // ========================================
  init: async () => {
    // Jangan spam kalau sudah pernah dipanggil
    if (get().isLoaded) return

    try {
      const res = await window.api.auth.me()
      const wrapper = res?.data // sesuai API contract: { status, message, data: {...user} }
      const userData = wrapper?.data || wrapper // jaga-jaga kalau langsung user

      if (!userData) throw new Error('No user data')

      set({
        authed: true,
        user: {
          id: userData.id,
          email: userData.email,
          fullname: userData.fullname,
          tag: userData.tag,
          role: userData.role
          // ⚠️ JANGAN simpan password, walaupun backend ngasih
        },
        isLoaded: true,
        error: ''
      })

      return true
    } catch (err) {
      // kalau token invalid / expired, anggap belum login
      set({
        authed: false,
        user: null,
        isLoaded: true
      })
      return false
    }
  },

  // Kalau kamu masih mau pakai manual check di beberapa tempat
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

      // API Contract:
      // res.data = { status, message, data: { user, access_token, refresh_token } }
      const payload = res?.data
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
          // ⚠️ jangan simpan password di sini
        },
        isLoaded: true,
        error: ''
      })

      return { ok: true }
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Login gagal'

      set({
        error: msg,
        authed: false,
        user: null
      })
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
