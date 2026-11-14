import { useState } from 'react'

function BotonCerrarSesion({ handleCerrarSesion, className = '' }) {
	const [cerrandoSesion, setCerrandoSesion] = useState(false)
	const [errorSesion, setErrorSesion] = useState('')

	async function salir() {
		setCerrandoSesion(true)
		setErrorSesion('')
		try {
			await handleCerrarSesion()
		} catch (error) {
			setErrorSesion(error.message || 'No se pudo cerrar la sesión.')
			setCerrandoSesion(false)
		}
	}

	return <div className={className}>
		{errorSesion && <span className="text-danger small" role="alert">{errorSesion}</span>}
		<button className="navbar-gestor__logout" type="button" onClick={salir} disabled={cerrandoSesion}>
			{cerrandoSesion ? 'Cerrando…' : 'Cerrar sesión'}
		</button>
	</div>
}

export default BotonCerrarSesion
