import { useRef, useState } from 'react'
import { esRequerido, esDniValido, tieneLongitudMinima } from '../../../shared/utils/validacion'

function validar(valores) {
  const errores = {}
  
  // Validación del DNI
  if (!esRequerido(valores.dni)) {
    errores.dni = 'Ingresá tu DNI.'
  } else if (!esDniValido(valores.dni)) {
    errores.dni = 'El DNI debe contener entre 7 y 8 números.'
  }

  if (!esRequerido(valores.contrasena)) {
    errores.contrasena = 'Ingresá tu contraseña.'
  } else if (!tieneLongitudMinima(valores.contrasena, 4)) {
    errores.contrasena = 'La contraseña debe tener al menos 4 caracteres.'
  }

  return errores
}

// Recibimos onIngresar como prop desde la página principal de Login
function FormularioContacto({ onIngresar }) {
  const [valores, setValores] = useState({ dni: '', contrasena: '' })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recordarDni, setRecordarDni] = useState(false) // Estado para el checkbox
  
  const formularioRef = useRef(null)

  function handleChange(e) {
    const { name, value } = e.target
    setValores({ ...valores, [name]: value })
    // Borrar el error específico cuando el usuario empieza a tipear de nuevo
    if (errores[name]) setErrores({ ...errores, [name]: undefined })
    setErrorServidor('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const nuevosErrores = validar(valores)
    setErrores(nuevosErrores)

    const primerCampoConError = Object.keys(nuevosErrores)[0]
    if (primerCampoConError) {
      formularioRef.current.elements[primerCampoConError].focus()
      return
    }

    setEnviando(true)
    try {
      await onIngresar(valores.dni, valores.contrasena)
    } catch (error) {
      setErrorServidor(error.message)
      setEnviando(false)
    }
  }

  return (
    <form ref={formularioRef} className="login-form" onSubmit={handleSubmit} noValidate>
      {errorServidor && (
        <div className="alert alert-danger py-2" role="alert">
          {errorServidor}
        </div>
      )}
      
      <h1>Ingresar</h1>

      <div className="login-form__field">
        <label htmlFor="dni">DNI</label>
        <input 
          id="dni" 
          name="dni" 
          type="text"
          inputMode="numeric"
          autoComplete="username"
          maxLength={8}
          className={`form-control ${errores.dni ? 'is-invalid' : ''}`}  
          value={valores.dni}
          onChange={handleChange}
          required 
        />
        {/* Mostrar mensaje de error si existe */}
        {errores.dni && <div className="invalid-feedback text-danger">{errores.dni}</div>}
      </div>

      <div className="login-form__field">
        <label htmlFor="contrasena">Usuario</label>
        <input 
          id="contrasena"
          name="contrasena"
          type="password"
          autoComplete="current-password"
          className={`form-control ${errores.contrasena ? 'is-invalid' : ''}`}
          value={valores.contrasena}
          onChange={handleChange}
          required
        />
        {errores.contrasena && <div className="invalid-feedback text-danger">{errores.contrasena}</div>}
      </div>

      <label className="login-form__remember" htmlFor="recordar">
        <input 
          id="recordar" 
          name="recordar" 
          type="checkbox" 
          checked={recordarDni} 
          onChange={(event) => setRecordarDni(event.target.checked)} 
        />
        <span>Recordá tu DNI</span>
      </label>

      {/* 3. Se unificó la variable a 'enviando' */}
      <button type="submit" disabled={enviando}>
        {enviando ? 'Verificando...' : 'Ingresar'}
      </button>

      <p className="login-form__contacto">
        ¿No tienes cuenta? Ponte en contacto para iniciar un proyecto nuevo y obtener una cuenta{' '}
        <a href="#contacto">Click aquí</a>
      </p>
    </form>
  )           
}

export default FormularioContacto