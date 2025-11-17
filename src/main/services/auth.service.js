import api, { setTokens, clearTokens, cancelAllRequests } from './apiClient'

export async function login({ email, password }) {
  const { data } = await api.post('/api/v1/auth/login', { email, password })
  const access_token = data?.data?.access_token
  const refresh_token = data?.data?.refresh_token
  if (access_token || refresh_token) {
    setTokens({ access_token, refresh_token })
  }
  return data
}

export async function logout() {
  try {
    await api.post('/api/v1/auth/logout') // Authorization disuntikkan otomatis
  } finally {
    cancelAllRequests()
    clearTokens()
  }
}

export async function getProfile() {
  const { data } = await api.get('/api/v1/auth/me')
  return data
}
