import { useRef, useState } from 'react'
// Importa tus validaciones reales aquí
import { esRequerido, esDniValido } from '../../../shared/utils/validacion'
import { soloNumeros } from '../../../shared/utils/filtrosEntrada.js'

function validar(valores) {
  const errores = {}
  
  // Validación del DNI
  if (!esRequerido(valores.dni)) {
    errores.dni = 'Ingresá tu DNI.'
  } else if (!esDniValido(valores.dni)) {
    errores.dni = 'El DNI debe contener entre 7 y 8 números.'
  }

  // Validación del Usuario
  if (!esRequerido(valores.usuario)) {
    errores.usuario = 'Ingresá tu usuario.'
  }

  return errores
}

// Recibimos onIngresar como prop desde la página principal de Login
function FormularioContacto({ onIngresar }) {
  // 1. Estado adaptado para DNI y Usuario
  const [valores, setValores] = useState({ dni: '', usuario: '' })
  const [errores, setErrores] = useState({})
  const [errorServidor, setErrorServidor] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [recordarDni, setRecordarDni] = useState(false) // Estado para el checkbox
  
  const formularioRef = useRef(null)

  function handleChange(e) {
    const { name } = e.target
    const value = name === 'dni' ? soloNumeros(e.target.value).slice(0, 8) : e.target.value
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
      // 2. Pasamos los valores correctos a la función onIngresar
      await onIngresar(valores.dni, valores.usuario)
      setValores((actuales) => ({ ...actuales, usuario: '' }))
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
          pattern="[0-9]{7,8}"
          minLength="7"
          maxLength="8"
          autoComplete='dni'
          className={`form-control ${errores.dni ? 'is-invalid' : ''}`}  
          value={valores.dni}
          onChange={handleChange}
          required 
        />
        {/* Mostrar mensaje de error si existe */}
        {errores.dni && <div className="invalid-feedback text-danger">{errores.dni}</div>}
      </div>

      <div className="login-form__field">
        <label htmlFor="usuario">Contraseña</label>
        <input 
          id="usuario"
          name="usuario"
          type="password"
          autoComplete="current-password"
          className={`form-control ${errores.usuario ? 'is-invalid' : ''}`}
          value={valores.usuario}
          onChange={handleChange}
          required
        />
        {errores.usuario && <div className="invalid-feedback text-danger">{errores.usuario}</div>}
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
