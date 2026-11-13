import { cloneElement, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Spinner from '../../../shared/components/Spinner'
import { obtenerSesion } from '../service/authService'

function RutaProtegida({ rolesPermitidos, children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const location = useLocation()

  useEffect(() => {
    let activa = true

    obtenerSesion()
      .then((sesion) => {
        if (activa) setUsuario(sesion)
      })
      .catch((motivo) => {
        if (activa) setError(motivo.message || 'No se pudo verificar la sesión.')
      })
      .finally(() => {
        if (activa) setCargando(false)
      })

    return () => {
      activa = false
    }
  }, [])

  if (cargando) return <Spinner />
  if (error) return <p className="alert alert-danger m-4" role="alert">{error}</p>
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />

  if (!rolesPermitidos.includes(usuario.rol)) {
    return <Navigate to={usuario.rol === 'cliente' ? '/cliente' : '/principal'} replace />
  }

  return cloneElement(children, { usuario })
}

export default RutaProtegida
