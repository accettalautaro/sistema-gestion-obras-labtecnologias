import { useState } from 'react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useOutletContext } from 'react-router-dom'
import { listarPagos, crearPago } from '../services/pagosService.js'
import '../../../styles/Pagos.css'

const FORMULARIO_VACIO = { 'id-obra': '', 'id-tarea': '', descripcion: '', monto: '' }

function PagosPage() {
	const { esArquitecto } = useOutletContext()
    const [version, setVersion] = useState(0)
	const { datos, cargando, error } = useFetch(listarPagos, version)
    
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [guardando, setGuardando] = useState(false)
    const [errorMutacion, setErrorMutacion] = useState('')
    const [exito, setExito] = useState('')

	if (esArquitecto === null) {
		return <p className="pagos-page__estado" role="status">Verificando acceso...</p>
	}
	if (cargando) {
		return <p className="pagos-page__estado" role="status">Cargando pagos...</p>
	}
	if (error) {
		return <div className="alert alert-danger" role="alert">{error.message}</div>
	}

	const { pagos = [], obras = [] } = datos || {}

    const guardar = async (event) => {
        event.preventDefault()
        setGuardando(true)
        setErrorMutacion('')
        setExito('')
        try {
            await crearPago(formulario)
            setExito('Formulario funcional. La conexión a la base de datos se implementará en el futuro.')
            setFormulario(FORMULARIO_VACIO)
        } catch (motivo) {
            setErrorMutacion(motivo.message || 'No se pudo registrar el pago.')
        } finally {
            setGuardando(false)
        }
    }

	return (
		<section className="pagos-page">
			<header className="pagos-page__header">
				<div>
					<p className="pagos-page__eyebrow">Área privada</p>
					<h1>Gestión de pagos</h1>
					<p>Historial de pagos de las obras activas</p>
				</div>
			</header>

            {errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}
			{exito && <div className="alert alert-success" role="status">{exito}</div>}

			<div className="pagos-page__workspace">
                {obras.map(obra => {
                    // Filtrar los pagos que pertenecen a esta obra
                    const pagosDeLaObra = pagos.filter(p => Number(p['id-obra']) === Number(obra['id-obra']))
                    const totalObra = pagosDeLaObra.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)

                    return (
                        <section key={obra['id-obra']} className="pagos-page__listado border-bottom">
                            <div className="pagos-page__toolbar">
                                <h2>Obra Lote #{obra.nrolote} (Estado: {obra.Estado})</h2>
                                <span className="badge pagos-page__badge-obra fs-6">Total obra: ${totalObra.toLocaleString('es-AR')}</span>
                            </div>
                            <div className="table-responsive">
                                <table className="table table-hover align-middle pagos-page__tabla">
                                    <thead>
                                        <tr>
                                            <th>ID Pago</th>
                                            <th>ID Tarea</th>
                                            <th>Descripción</th>
                                            <th>Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pagosDeLaObra.map((pago) => (
                                            <tr key={pago['id-pago']}>
                                                <td>#{pago['id-pago']}</td>
                                                <td>{pago['id-tarea']}</td>
                                                <td>{pago.descripcion}</td>
                                                <td className="pagos-page__monto">${pago.monto.toLocaleString('es-AR')}</td>
                                            </tr>
                                        ))}
                                        {!pagosDeLaObra.length && <tr><td colSpan="4" className="pagos-page__vacio">No hay pagos registrados para esta obra.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )
                })}

                {esArquitecto && (
                    <section className="pagos-page__formulario" aria-labelledby="pago-form-titulo">
                        <div className="pagos-page__toolbar">
                            <h2 id="pago-form-titulo">Registrar nuevo pago</h2>
                        </div>
                        <form onSubmit={guardar}>
                            <div className="pagos-page__campos">
                                <label>Obra
                                    <select className="form-select" name="id-obra" value={formulario['id-obra']} onChange={(event) => setFormulario({ ...formulario, 'id-obra': event.target.value })} required>
                                        <option value="" disabled>Seleccionar obra</option>
                                        {obras.map(obra => (
                                            <option key={obra['id-obra']} value={obra['id-obra']}>Lote #{obra.nrolote}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>ID Tarea<input className="form-control" name="id-tarea" value={formulario['id-tarea']} onChange={(event) => setFormulario({ ...formulario, 'id-tarea': event.target.value })} required placeholder="Ej: 3-1" /></label>
                                <label>Monto ($)<input className="form-control" name="monto" type="number" min="1" step="0.01" value={formulario.monto} onChange={(event) => setFormulario({ ...formulario, monto: event.target.value })} required placeholder="Ej: 500000" /></label>
                                <label className="pagos-page__campo-completo">Descripción<input className="form-control" name="descripcion" value={formulario.descripcion} onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })} required placeholder="Ej: Adelanto de materiales" /></label>
                            </div>
                            <div className="pagos-page__form-actions">
                                <button className="btn btn-dark pagos-page__btn-submit" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar pago'}</button>
                            </div>
                        </form>
                    </section>
                )}
			</div>
		</section>
	)
}

export default PagosPage
