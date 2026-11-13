import { obtenerSesion } from '../../features/login/service/authService.js'

export const API_URL = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '')

export async function api(ruta, opciones = {}) {
  const token = opciones.token ?? obtenerSesion()?.token
  const headers = {
    ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...opciones.headers,
  }
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, { ...opciones, headers })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verificá que el backend esté iniciado.')
  }
  if (respuesta.status === 204) return null
  const texto = await respuesta.text()
  let datos = null
  if (texto) {
    try { datos = JSON.parse(texto) } catch { throw new Error('El servidor devolvió una respuesta inválida.') }
  }
  if (!respuesta.ok) {
    const error = new Error(datos?.error || 'No se pudo completar la solicitud.')
    error.status = respuesta.status
    throw error
  }
  return datos
}

export const jsonBody = (datos) => JSON.stringify(datos)
