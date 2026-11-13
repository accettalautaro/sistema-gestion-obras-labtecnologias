import { useLocation, useNavigate } from 'react-router-dom'
import '../../styles/Volver.css'

function Volver({ to, onClick, className = '' }) {
	const navigate = useNavigate()
	const location = useLocation()
	const contenido = <><span className="boton-volver__flecha" aria-hidden="true">←</span><span>Volver</span></>
	const volver = () => {
		if (onClick) return onClick()
		if (Number.isInteger(window.history.state?.idx) && window.history.state.idx > 0) return navigate(-1)
		const destinoAlternativo = location.state?.volverA ?? to
		if (destinoAlternativo) return navigate(destinoAlternativo, { replace: true })
	}
	return <button className={`boton-volver ${className}`.trim()} type="button" onClick={volver}>{contenido}</button>
}

export default Volver
