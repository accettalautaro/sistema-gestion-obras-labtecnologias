import { redirect } from 'react-router-dom'

const URL_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '')
const CLAVE_SESION = 'gestion-obras:sesion'

async function solicitar(ruta, opciones) {
  let respuesta
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, opciones)
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intentá más tarde.')
  }

  const datos = await respuesta.json()
  if (!respuesta.ok) {
    const mensaje = respuesta.status === 401
      ? 'DNI o contraseña incorrectos.'
      : datos.error || 'No se pudo completar la solicitud.'
    throw Object.assign(new Error(mensaje), { status: respuesta.status })
  }
  return datos
}

function guardarSesion(sesion) {
  sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion))
  return sesion
}

export async function iniciarSesion(dni, contrasena) {
  const respuesta = await solicitar('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dni: dni.trim(), contrasena }),
  })

  if (typeof respuesta.token !== 'string' || !respuesta.token
    || typeof respuesta.rol !== 'string' || !respuesta.rol) {
    throw new Error('El servidor devolvió una respuesta de inicio de sesión inválida.')
  }

  return guardarSesion({
    id_usuario: null,
    dni: dni.trim(),
    rol: respuesta.rol,
    token: respuesta.token,
  })
}

export function obtenerSesion() {
  const almacenada = sessionStorage.getItem(CLAVE_SESION)
  if (!almacenada) return null

  try {
    const sesion = JSON.parse(almacenada)
    if (typeof sesion.token === 'string' && sesion.token
      && typeof sesion.rol === 'string' && sesion.rol) return sesion
  } catch {
    sessionStorage.removeItem(CLAVE_SESION)
    return null
  }

  sessionStorage.removeItem(CLAVE_SESION)
  return null
}

export function cerrarSesion() {
  sessionStorage.removeItem(CLAVE_SESION)
}

export async function protegerRuta() {
  const sesion = obtenerSesion()
  if (!sesion) throw redirect('/login')

  let perfil
  try {
    perfil = await solicitar('/auth/perfil', {
      headers: { Authorization: `Bearer ${sesion.token}` },
    })
  } catch (error) {
    if (error.status === 401) {
      cerrarSesion()
      throw redirect('/login')
    }
    throw error
  }

  if (typeof perfil.id_usuario !== 'number' && typeof perfil.id_usuario !== 'string') {
    cerrarSesion()
    throw new Error('El servidor devolvió un perfil de usuario inválido.')
  }
  if (typeof perfil.dni !== 'string' || typeof perfil.rol !== 'string') {
    cerrarSesion()
    throw new Error('El servidor devolvió un perfil de usuario inválido.')
  }

  return guardarSesion({ ...sesion, ...perfil })
}

export function redirigirSiHaySesion() {
  const sesion = obtenerSesion()
  if (sesion) {
    throw redirect(sesion.rol === 'cliente' ? '/cliente' : '/principal')
  }
  return null
}
