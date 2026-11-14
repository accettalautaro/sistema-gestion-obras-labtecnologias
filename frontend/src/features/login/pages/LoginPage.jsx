import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import FormularioIngreso from '../components/FormularioContacto'
import { cambiarContrasenaInicial, iniciarSesion } from '../service/authService'
import casalogin from '../../../assets/casalogin.jpg'
import '../../../styles/Login.css'

function LoginPage() {
    const navigate = useNavigate()
    const [cambioPendiente, setCambioPendiente] = useState(null)
    const [contrasenaNueva, setContrasenaNueva] = useState('')
    const [mostrarContrasenaNueva, setMostrarContrasenaNueva] = useState(false)
    const [confirmacion, setConfirmacion] = useState('')
    const [errorCambio, setErrorCambio] = useState('')
    const [guardandoCambio, setGuardandoCambio] = useState(false)
    const [versionFormulario, setVersionFormulario] = useState(0)

    const requisitos = [
        { texto: 'Al menos 12 caracteres', valido: [...contrasenaNueva].length >= 12 },
        { texto: 'Una letra mayúscula', valido: /\p{Lu}/u.test(contrasenaNueva) },
        { texto: 'Una letra minúscula', valido: /\p{Ll}/u.test(contrasenaNueva) },
        { texto: 'Un número', valido: /\p{N}/u.test(contrasenaNueva) },
        { texto: 'Un símbolo (por ejemplo: !, @ o #)', valido: /[^\p{L}\p{N}\s]/u.test(contrasenaNueva) },
    ]
    const contrasenaValida = requisitos.every((requisito) => requisito.valido)
    const confirmacionValida = Boolean(confirmacion) && contrasenaNueva === confirmacion

    // Esta es la función puente que le pasamos al formulario
    const handleIngresar = async (dni, usuario) => {
        const sesionData = await iniciarSesion(dni, usuario)

        if (sesionData.requiereCambioContrasena) {
            setCambioPendiente({ token: sesionData.tokenCambioContrasenaInicial })
            setContrasenaNueva('')
            setConfirmacion('')
            setMostrarContrasenaNueva(false)
            setErrorCambio('')
            return
        }

        if (sesionData.rol === 'arquitecto') {
            navigate('/principal')
        } else {
            navigate('/cliente')
        }
    }

    const handleCambiarContrasena = async (event) => {
        event.preventDefault()
        if (!cambioPendiente || !contrasenaValida || !confirmacionValida) return
        setGuardandoCambio(true)
        setErrorCambio('')
        try {
            const sesion = await cambiarContrasenaInicial(cambioPendiente.token, contrasenaNueva)
            navigate(sesion.rol === 'arquitecto' ? '/principal' : '/cliente', { replace: true })
        } catch (error) {
            setErrorCambio(error.message || 'No se pudo cambiar la contraseña.')
        } finally {
            setGuardandoCambio(false)
        }
    }

    const volverAIngresar = () => {
        setCambioPendiente(null)
        setContrasenaNueva('')
        setConfirmacion('')
        setMostrarContrasenaNueva(false)
        setErrorCambio('')
        setVersionFormulario((version) => version + 1)
    }

    return (
        <>
        <main className="login-page">
            <section 
                className="login-page__image" 
                style={{ backgroundImage: `url(${casalogin})` }} 
                aria-label="Interior de una obra" 
            />
            <section className="login-page__panel">
                {/*
                  Aquí llamamos al componente limpio que armamos en la respuesta anterior.
                  Le pasamos handleIngresar como la propiedad 'onIngresar'
                */}
                <FormularioIngreso key={versionFormulario} onIngresar={handleIngresar} />
            </section>
        </main>
        {cambioPendiente && <div className="login-password-modal__fondo">
            <section className="login-password-modal" role="dialog" aria-modal="true" aria-labelledby="cambio-contrasena-titulo" aria-describedby="cambio-contrasena-ayuda">
                <div className="login-password-modal__cabecera">
                    <div>
                        <p className="login-password-modal__eyebrow">Primer ingreso</p>
                        <h2 id="cambio-contrasena-titulo">Creá una contraseña segura</h2>
                    </div>
                    <button className="login-password-modal__cerrar" type="button" onClick={volverAIngresar} disabled={guardandoCambio} aria-label="Cerrar y volver al ingreso">×</button>
                </div>
                <p id="cambio-contrasena-ayuda">Para continuar, reemplazá la contraseña inicial por una contraseña propia.</p>
                <ul className="login-password-modal__requisitos" aria-live="polite">
                    {requisitos.map((requisito) => <li className={requisito.valido ? 'is-cumplido' : ''} key={requisito.texto}>
                        <span aria-hidden="true">{requisito.valido ? '✓' : '○'}</span>{requisito.texto}
                    </li>)}
                </ul>
                <form onSubmit={handleCambiarContrasena} aria-busy={guardandoCambio}>
                    <label className="login-password-modal__campo" htmlFor="nueva-contrasena">Nueva contraseña
                        <span className="login-password-modal__contrasena-control">
                            <input id="nueva-contrasena" className="form-control" type={mostrarContrasenaNueva ? 'text' : 'password'} autoComplete="new-password" value={contrasenaNueva} onChange={(event) => { setContrasenaNueva(event.target.value); setErrorCambio('') }} autoFocus disabled={guardandoCambio} required />
                            <button type="button" onClick={() => setMostrarContrasenaNueva((mostrar) => !mostrar)} disabled={guardandoCambio} aria-label={mostrarContrasenaNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={mostrarContrasenaNueva} title={mostrarContrasenaNueva ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                                <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                                    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
                                    <circle cx="12" cy="12" r="3" />
                                    {!mostrarContrasenaNueva && <path d="m3 3 18 18" />}
                                </svg>
                            </button>
                        </span>
                    </label>
                    <label className="login-password-modal__campo" htmlFor="confirmar-contrasena">Repetí la contraseña
                        <input id="confirmar-contrasena" className="form-control" type="password" autoComplete="new-password" value={confirmacion} onChange={(event) => { setConfirmacion(event.target.value); setErrorCambio('') }} disabled={guardandoCambio} required />
                    </label>
                    {confirmacion && !confirmacionValida && <p className="login-password-modal__error" role="alert">Las contraseñas no coinciden.</p>}
                    {errorCambio && <p className="login-password-modal__error" role="alert">{errorCambio}</p>}
                    <button className="login-password-modal__guardar" type="submit" disabled={guardandoCambio || !contrasenaValida || !confirmacionValida}>
                        {guardandoCambio ? 'Guardando contraseña…' : 'Guardar contraseña y continuar'}
                    </button>
                    {errorCambio.includes('venció') && <button className="login-password-modal__volver" type="button" onClick={volverAIngresar}>Volver a ingresar</button>}
                </form>
            </section>
        </div>}
        </>
    )
}

export default LoginPage
