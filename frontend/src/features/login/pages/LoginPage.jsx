import { useState } from 'react'
import casalogin from '../../../assets/casalogin.jpg'
import '../../../styles/Login.css'

const savedDni = localStorage.getItem('login-dni') ?? ''

function LoginPage() {
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
			const response = await fetch('/api/login', {
				body: JSON.stringify({ dni, usuario }),
				headers: { 'Content-Type': 'application/json' },
				method: 'POST',
			})
			const responseText = await response.text()
			let data = {}

			if (responseText) {
				try {
					data = JSON.parse(responseText)
				} catch {
					throw new Error('El servidor devolvió una respuesta inválida.')
				}
			}

			if (!response.ok) throw new Error(data.mensaje || 'No se pudo iniciar sesión.')

			localStorage.setItem('sesion-usuario', JSON.stringify(data.usuario))
			window.location.hash = 'principal'
		} catch (error) {
			setMensaje(error instanceof TypeError ? 'No se pudo conectar con el backend. Inícialo en otra terminal con: cd backend; npm start' : error.message)
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
						<a href="#contacto">Click aquí</a>
					</p>

					{mensaje && <p className="login-form__mensaje login-form__mensaje--error" role="alert">{mensaje}</p>}
				</form>
			</section>
		</main>
	)
}

export default LoginPage
