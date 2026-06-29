import api from './api.js'

export async function listarAlertas() {
  const { data } = await api.get('/alertas')
  return data
}

export async function alertasNoLeidas() {
  const { data } = await api.get('/alertas/no-leidas')
  return data
}

export async function marcarLeida(alertaId) {
  const { data } = await api.post(`/alertas/${alertaId}/leer`)
  return data
}
