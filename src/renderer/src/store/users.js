/* eslint-disable no-unused-vars */
// src/renderer/src/store/users.js
import { create } from 'zustand'

const mapServerUser = (u = {}) => ({
  id: u.id,
  name: u.fullname || u.name || '',
  email: u.email || '',
  tag: u.tag || '',
  role: u.role || '',
  is_active: u.is_active ?? true,
  createdAt: u.created_at || null
})

export const useUsers = create((set, get) => ({
  users: [],
  total: 0,
  loading: false,
  error: null,

  // ===== LOAD USERS =====
  loadUsers: async () => {
    if (!window.api?.users?.getAll) return
    set({ loading: true, error: null })

    try {
      const res = await window.api.users.getAll({ skip: 0, limit: 100 })
      const mapped = (res?.users || []).map(mapServerUser)

      set({
        users: mapped,
        total: res?.total ?? mapped.length,
        loading: false
      })
    } catch (err) {
      console.error(err)
      set({ loading: false, error: err.message })
    }
  },

  // ===== CREATE USER =====
  addUser: async ({ name, email, password, tag }) => {
    const payload = {
      fullname: name,
      email,
      password,
      confirm_password: password,
      tag
    }

    try {
      const res = await window.api.users.create(payload)
      const created = mapServerUser(res?.data || {})
      set((s) => ({ users: [created, ...s.users], total: s.total + 1 }))
      return created.id
    } catch (err) {
      console.error(err)
      alert(err.message)
      return null
    }
  },

  // ===== UPDATE USER =====
  editUser: async (id, patch) => {
    // kontrak: semua field wajib + password wajib min 8
    if (!patch?.password || patch.password.length < 8) {
      alert('Password wajib diisi (min 8 karakter) saat edit user.')
      return
    }
    if (patch.password !== patch.confirm_password) {
      alert('Confirm password tidak sama.')
      return
    }

    const payload = {
      fullname: patch.name,
      email: patch.email,
      password: patch.password,
      confirm_password: patch.confirm_password,
      tag: patch.tag
    }

    try {
      const res = await window.api.users.update({ id, payload })
      const updated = mapServerUser(res?.data || {})
      set((s) => ({
        users: s.users.map((u) => (u.id === id ? { ...u, ...updated } : u))
      }))
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  },

  // ===== DELETE USER =====
  removeUser: async (id) => {
    try {
      await window.api.users.delete({ id })
      set((s) => ({
        users: s.users.filter((u) => u.id !== id),
        total: Math.max(0, s.total - 1)
      }))
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }
}))
