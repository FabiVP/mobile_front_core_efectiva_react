import api from './api.js'

export async function promover() {
  const { data } = await api.post('/sync/promover')
  return data
}

export async function outbox() {
  const { data } = await api.get('/sync/outbox')
  return data
}
