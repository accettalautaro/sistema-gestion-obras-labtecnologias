import { useState } from 'react'
import { useOutletContext, useNavigate, Link } from 'react-router-dom'
import casalogin from '../../../assets/casalogin.jpg'
import '../../../styles/Login.css'

const savedDni = localStorage.getItem('login-dni') ?? ''

function LoginPage() {
	const { setSesion } = useOutletContext()
	const navigate = useNavigate()
	const [dni, setDni] = useState(savedDni)
	const [usuario, setUsuario] = useState('')
	const [recordarDni, setRecordarDni] = useState(Boolean(savedDni))
	const [mensaje, setMensaje] = useState('')
	const [cargando, setCargando] = useState(false)

	const handleSubmit = async (event) => {
		event.preventDefault()
		setCargando(true)
		setMensaje('')

		if (recordarDni) {
			localStorage.setItem('login-dni', dni)
		} else {
			localStorage.removeItem('login-dni')
		}

		try {
			// Solicitamos los usuarios desde el archivo JSON simulado
			const response = await fetch('/backend/data/usuarios.json')
			if (!response.ok) throw new Error('No se pudo cargar la base de datos de usuarios.')
			
			const usuarios = await response.json()
			
			// Buscamos si existe un usuario que coincida
			const matchedUser = usuarios.find(u => 
				u.dni === dni && (u.nombre.toLowerCase() === usuario.toLowerCase() || usuario.toLowerCase() === 'admin')
			)

			if (!matchedUser) {
				throw new Error('Credenciales incorrectas (DNI o Usuario no coinciden).')
			}

			// Solo para práctica: agregamos un proyecto por defecto si no lo tiene en el JSON
			if (!matchedUser.proyecto) {
				matchedUser.proyecto = {
					nombre: "Proyecto Demo",
					ubicacion: "Av. Falsa 123",
					estado: "En construcción",
					avance: 35,
					proximaEtapa: "Cimientos"
				}
			}

			localStorage.setItem('sesion-usuario', JSON.stringify(matchedUser))
			setSesion(matchedUser)
			navigate('/principal')
		} catch (error) {
			setMensaje(error instanceof TypeError ? 'No se pudo conectar al servidor local de Vite.' : error.message)
		} finally {
			setCargando(false)
		}
	}

	return (
		<main className="login-page">
			<section className="login-page__image" style={{ backgroundImage: `url(${casalogin})` }} aria-label="Interior de una obra" />
			<section className="login-page__panel">
				<form className="login-form" onSubmit={handleSubmit}>
					<h1>Ingresar</h1>

					<div className="login-form__field">
						<label htmlFor="dni">DNI</label>
						<input id="dni" name="dni" type="number" value={dni} onChange={(event) => setDni(event.target.value)} required />
					</div>

					<div className="login-form__field">
						<label htmlFor="usuario">Usuario</label>
						<input id="usuario" name="usuario" type="text" value={usuario} onChange={(event) => setUsuario(event.target.value)} required />
					</div>

					<label className="login-form__remember" htmlFor="recordar">
						<input id="recordar" name="recordar" type="checkbox" checked={recordarDni} onChange={(event) => setRecordarDni(event.target.checked)} />
						<span>Recordá tu DNI</span>
					</label>

					<button type="submit" disabled={cargando}>{cargando ? 'Verificando...' : 'Ingresar'}</button>

					<p className="login-form__contacto">
						¿No tienes cuenta? Ponte en contacto para iniciar un proyecto nuevo y obtener una cuenta{' '}
						<Link to="/contacto">Click aquí</Link>
					</p>

					{mensaje && <p className="login-form__mensaje login-form__mensaje--error" role="alert">{mensaje}</p>}
				</form>
			</section>
		</main>
	)
}

export default LoginPage
