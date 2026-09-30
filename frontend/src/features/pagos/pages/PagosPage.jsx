import { useState } from 'react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useOutletContext } from 'react-router-dom'
import { listarPagos, crearPago } from '../services/pagosService.js'
import '../../../styles/Pagos.css'

const FORMULARIO_VACIO = { 'id-obra': '', 'id-tarea': '', descripcion: '', monto: '' }

function FilaPago({ pago }) {
    const [estaEditando, setEstaEditando] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({ ...pago });

    const iniciarEdicion = () => {
        setDatosEdicion({ ...pago });
        setEstaEditando(true);
    };

    const cancelarEdicion = () => {
        setDatosEdicion({ ...pago });
        setEstaEditando(false);
    };

    const confirmarEdicion = () => {
        // En el futuro, aquí se llamaría a la API/servicio para guardar
        // Por ahora, solo cerramos el modo de edición y simulamos el guardado visual local
        setEstaEditando(false);
    };

    if (estaEditando) {
        return (
            <tr>
                <td>#{pago['id-pago']}</td>
                <td>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={datosEdicion['id-tarea']}
                        onChange={e => setDatosEdicion({...datosEdicion, 'id-tarea': e.target.value})}
                    />
                </td>
                <td>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={datosEdicion.descripcion}
                        onChange={e => setDatosEdicion({...datosEdicion, descripcion: e.target.value})}
                    />
                </td>
                <td>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">$</span>
                        <input
                            type="number"
                            className="form-control"
                            value={datosEdicion.monto}
                            onChange={e => setDatosEdicion({...datosEdicion, monto: e.target.value})}
                        />
                    </div>
                </td>
                <td className="text-end">
                    <div className="btn-group" role="group">
                        <button type="button" className="btn btn-sm btn-outline-success" title="Confirmar" onClick={confirmarEdicion}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z"/></svg>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" title="Cancelar" onClick={cancelarEdicion}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    // Por ahora, mostrar 'datosEdicion' en modo lectura permite que los cambios simulados queden guardados temporalmente en pantalla
    return (
        <tr>
            <td>#{pago['id-pago']}</td>
            <td>{datosEdicion['id-tarea']}</td>
            <td>{datosEdicion.descripcion}</td>
            <td className="pagos-page__monto">${Number(datosEdicion.monto).toLocaleString('es-AR')}</td>
            <td className="text-end">
                <div className="btn-group" role="group">
                    <button type="button" className="btn btn-sm btn-outline-secondary" title="Editar pago" onClick={iniciarEdicion}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" title="Eliminar pago">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ObraSeccionPagos({ obra, pagosDeLaObra, totalObra }) {
    const [desplegado, setDesplegado] = useState(false);

    return (
        <section className="pagos-page__listado border-bottom">
            <div className="pagos-page__toolbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <h2>Obra Lote #{obra.nrolote} (Estado: {obra.Estado})</h2>
                    <button
                        className="btn btn-sm btn-outline-secondary pagos-page__btn-desplegar"
                        onClick={() => setDesplegado(!desplegado)}
                        aria-expanded={desplegado}
                    >
                        {desplegado ? 'Ocultar pagos' : 'Ver pagos'}
                    </button>
                </div>
                <span className="badge pagos-page__badge-obra fs-6">Total obra: ${totalObra.toLocaleString('es-AR')}</span>
            </div>
            <div className={`pagos-page__desplegable ${desplegado ? 'abierto' : ''}`}>
                <div className="pagos-page__desplegable-inner">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle pagos-page__tabla">
                            <thead>
                                <tr>
                                    <th>ID Pago</th>
                                    <th>ID Tarea</th>
                                    <th>Descripción</th>
                                    <th>Monto</th>
                                    <th className="text-end" style={{ width: '100px' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pagosDeLaObra.map((pago) => (
                                    <FilaPago key={pago['id-pago']} pago={pago} />
                                ))}
                                {!pagosDeLaObra.length && <tr><td colSpan="5" className="pagos-page__vacio">No hay pagos registrados para esta obra.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

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
                        <ObraSeccionPagos
                            key={obra['id-obra']}
                            obra={obra}
                            pagosDeLaObra={pagosDeLaObra}
                            totalObra={totalObra}
                        />
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
