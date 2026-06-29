import api from './api.js'

export async function listarCampanas() {
  const { data } = await api.get('/campanas')
  return data
}
