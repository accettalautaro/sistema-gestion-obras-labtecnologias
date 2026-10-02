import { Link } from 'react-router-dom'
import '../../styles/Volver.css'

function Volver({ to, onClick, children = 'Volver', className = '' }) {
	const contenido = <><span className="boton-volver__flecha" aria-hidden="true">←</span><span>{children}</span></>
	if (to) return <Link className={`boton-volver ${className}`.trim()} to={to}>{contenido}</Link>
	return <button className={`boton-volver ${className}`.trim()} type="button" onClick={onClick}>{contenido}</button>
}

export default Volver
