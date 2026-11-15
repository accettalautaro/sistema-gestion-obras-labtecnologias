import { useEffect } from 'react'
import '../../styles/ConfirmacionEliminar.css'

function ConfirmacionEliminar({ titulo, mensaje, onCancelar, onConfirmar, eliminando = false }) {
	useEffect(() => {
		const cerrarConEscape = (event) => {
			if (event.key === 'Escape' && !eliminando) onCancelar()
		}
		window.addEventListener('keydown', cerrarConEscape)
		return () => window.removeEventListener('keydown', cerrarConEscape)
	}, [eliminando, onCancelar])

	return <div className="confirmacion-eliminar__fondo" onMouseDown={(event) => { if (event.target === event.currentTarget && !eliminando) onCancelar() }}>
		<section className="confirmacion-eliminar" role="alertdialog" aria-modal="true" aria-labelledby="confirmacion-eliminar-titulo" aria-describedby="confirmacion-eliminar-mensaje">
			<div className="confirmacion-eliminar__marca" aria-hidden="true">!</div>
			<div className="confirmacion-eliminar__contenido">
				<h2 id="confirmacion-eliminar-titulo">{titulo}</h2>
				<p id="confirmacion-eliminar-mensaje">{mensaje}</p>
			</div>
			<div className="confirmacion-eliminar__acciones">
				<button className="btn btn-outline-secondary" type="button" onClick={onCancelar} disabled={eliminando} autoFocus>Cancelar</button>
				<button className="btn confirmacion-eliminar__boton" type="button" onClick={onConfirmar} disabled={eliminando}>
					{eliminando ? 'Eliminando...' : 'Sí, eliminar'}
				</button>
			</div>
		</section>
	</div>
}

export default ConfirmacionEliminar
