import api from './api.js'

/** Historial / tablero de solicitudes con paginación. GET /solicitudes?pagina=&por_pagina= */
export async function listarSolicitudes({ pagina = 1, por_pagina = 30 } = {}) {
  const params = { pagina, por_pagina }
  const { data } = await api.get('/solicitudes', { params })
  return data
}

/** Crea una solicitud de crédito. POST /solicitudes */
export async function crearSolicitud(payload) {
  const { data } = await api.post('/solicitudes', payload)
  return data
}

/** Notas internas de una solicitud. GET /solicitudes/{id}/notas */
export async function listarNotas(solicitudId) {
  const { data } = await api.get(`/solicitudes/${solicitudId}/notas`)
  return data
}

/** Agrega una nota interna. POST /solicitudes/{id}/notas */
export async function agregarNota(solicitudId, contenido) {
  const { data } = await api.post(`/solicitudes/${solicitudId}/notas`, { contenido })
  return data
}

/** Actualiza estado/evaluación de una solicitud (solo supervisor). PATCH /solicitudes/{id} */
export async function actualizarSolicitud(solicitudId, payload) {
  const { data } = await api.patch(`/solicitudes/${solicitudId}`, payload)
  return data
}

/** Desembolsa una solicitud aprobada/condicionada (solo supervisor). POST /solicitudes/{id}/desembolsar */
export async function desembolsarSolicitud(solicitudId) {
  const { data } = await api.post(`/solicitudes/${solicitudId}/desembolsar`)
  return data
}

/** Sube metadata de un documento a una solicitud. POST /solicitudes/{id}/documentos */
export async function subirDocumento(solicitudId, payload) {
  const { data } = await api.post(`/solicitudes/${solicitudId}/documentos`, payload)
  return data
}

/** Detalle completo de una solicitud. GET /solicitudes/{id} */
export async function obtenerSolicitud(solicitudId) {
  const { data } = await api.get(`/solicitudes/${solicitudId}`)
  return data
}

/** Cronograma de pagos de una solicitud desembolsada. GET /solicitudes/{id}/cronograma */
export async function listarCronograma(solicitudId) {
  const { data } = await api.get(`/solicitudes/${solicitudId}/cronograma`)
  return data
}

/** Bitácora de cambios de estado. GET /solicitudes/{id}/bitacora */
export async function listarBitacora(solicitudId) {
  const { data } = await api.get(`/solicitudes/${solicitudId}/bitacora`)
  return data
}
