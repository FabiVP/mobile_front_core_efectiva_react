import api from './api.js'

export async function listarCampanas() {
  const { data } = await api.get('/campanas')
  return data
}

export async function crearCampana(payload) {
  const { data } = await api.post('/campanas', payload)
  return data
}
