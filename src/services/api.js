import axios from 'axios'

export const TOKEN_KEY = 'cm_token'
export const USER_KEY = 'cm_user'

const baseURL = import.meta.env.VITE_BASE_URL || 'http://localhost:8003'

// Instancia central de axios para todo el portal del personal (Core Mobile).
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
})

// --- Request: inyecta el Bearer token del asesor en cada petición ---
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// --- Response: manejo de errores HTTP ---
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      const enLogin = window.location.pathname.startsWith('/login') ||
        window.location.pathname === '/'
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      if (!enLogin) window.location.assign('/login')
    }
    if (status === 403) {
      console.warn('[API] Acceso denegado (403):', error?.response?.data?.detail || 'No tiene permisos')
    }
    return Promise.reject(error)
  },
)

export default api
