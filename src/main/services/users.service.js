// src/main/services/users.service.js
import api from './apiClient'

// === Shape mapping helper (BE → FE) ===
export function mapServerUser(u = {}) {
  return {
    id: u.id,
    fullname: u.fullname || u.name || '',
    email: u.email || '',
    tag: u.tag || '',
    role: u.role || '',
    is_active: u.is_active ?? true,
    createdAt: u.created_at || null
  }
}

// === GET ALL USERS ===
export async function getAllUsers({ skip = 0, limit = 100, search = '', tag = '' } = {}) {
  const { data } = await api.get('/api/v1/auth/get-all-users', {
    params: { skip, limit, search, tag }
  })
  return data
}

// === CREATE USER ===
export async function createUser(payload) {
  const { data } = await api.post('/api/v1/auth/create-user', payload)
  return data
}

// === UPDATE USER ===
export async function updateUser({ user_id, body }) {
  const { data } = await api.put(`/api/v1/auth/update-user/${user_id}`, body)
  return data
}

// === DELETE USER ===
export async function deleteUser({ user_id }) {
  const { data } = await api.delete(`/api/v1/auth/delete-user/${user_id}`)
  return data
}
