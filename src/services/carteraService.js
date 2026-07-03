import api from './api.js'

/** Cartera del asesor autenticado con paginación. GET /cartera?pagina=&por_pagina= */
export async function listarCartera({ pagina = 1, por_pagina = 30 } = {}) {
  const params = { pagina, por_pagina }
  const { data } = await api.get('/cartera', { params })
  return data
}

/** Registra el resultado de una visita. POST /cartera/{id}/visita */
export async function marcarVisita(carteraId, payload) {
  const { data } = await api.post(`/cartera/${carteraId}/visita`, payload)
  return data
}
