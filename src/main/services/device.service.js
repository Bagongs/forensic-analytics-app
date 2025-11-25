import api from './apiClient'

export async function addDevice({ file_id, name, phone_number, analytic_id}) {
  const { data } = await api.post('/api/v1/analytics/add-device', { file_id, name, phone_number, analytic_id })
  return data
}

export async function getDevicesByAnalytic({ analytic_id }) {
  const { data } = await api.get(`/api/v1/analytics/${analytic_id}/get-devices`)
  return data
}
