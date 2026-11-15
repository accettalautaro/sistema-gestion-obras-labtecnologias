import { useState } from 'react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useOutletContext } from 'react-router-dom'
import { listarPagos, crearPago, actualizarPago, eliminarPago } from '../services/pagosService.js'
import ConfirmacionEliminar from '../../../shared/components/ConfirmacionEliminar.jsx'
import { soloDecimal } from '../../../shared/utils/filtrosEntrada.js'
import '../../../styles/Pagos.css'

const FORMULARIO_VACIO = { 'id-obra': '', 'id-tarea': '', descripcion: '', monto: '' }

function estadoClase(estado) {
    const normalizado = String(estado ?? '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normalizado.includes('cancel')) return 'pagos-page__estado--cancelada'
    if (normalizado.includes('paus') || normalizado.includes('suspend')) return 'pagos-page__estado--pausada'
    if (normalizado.includes('atras')) return 'pagos-page__estado--atrasada'
    if (normalizado.includes('ejecucion') || normalizado.includes('progreso')) return 'pagos-page__estado--activa'
    if (normalizado.includes('final') || normalizado.includes('complet')) return 'pagos-page__estado--finalizada'
    return 'pagos-page__estado--neutral'
}

function FilaPago({ pago, tareas, onActualizar, onEliminar }) {
    const [estaEditando, setEstaEditando] = useState(false);
    const [datosEdicion, setDatosEdicion] = useState({ ...pago, descripcion: pago.descripcion ?? '' });

    const iniciarEdicion = () => {
        setDatosEdicion({ ...pago, descripcion: pago.descripcion ?? '' });
        setEstaEditando(true);
    };

    const cancelarEdicion = () => {
        setDatosEdicion({ ...pago, descripcion: pago.descripcion ?? '' });
        setEstaEditando(false);
    };

    const confirmarEdicion = async () => {
        try { await onActualizar({ ...datosEdicion, 'id-pago': pago['id-pago'], 'id-obra': pago['id-obra'] }); setEstaEditando(false) }
        catch (error) { window.alert(error.message || 'No se pudo actualizar el pago.') }
    };

    if (estaEditando) {
        return (
            <tr>
                <td>#{pago['id-pago']}</td>
                <td>
                    <select
                        className="form-select form-select-sm"
                        value={datosEdicion['id-tarea']}
                        onChange={e => setDatosEdicion({ ...datosEdicion, 'id-tarea': e.target.value })}
                    >
                        {tareas.filter(t => t['id-obra'] == pago['id-obra'] && t._dbSubtareaId).map(t => (
                            <option key={t['id-tarea']} value={t['id-tarea']}>{t.nombre}</option>
                        ))}
                    </select>
                </td>
                <td>
                    <input
                        type="text"
                        className="form-control form-control-sm"
                        value={datosEdicion.descripcion}
                        onChange={e => setDatosEdicion({ ...datosEdicion, descripcion: e.target.value })}
                    />
                </td>
                <td>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text">$</span>
                        <input
                            type="number"
                            name="monto"
                            className="form-control"
                            value={datosEdicion.monto}
                            onChange={e => { const monto = soloDecimal(e.target.value); if (monto !== null) setDatosEdicion({ ...datosEdicion, monto }) }}
                        />
                    </div>
                </td>
                <td className="text-end">
                    <div className="btn-group" role="group">
                        <button type="button" className="btn btn-sm btn-outline-success" title="Confirmar" onClick={confirmarEdicion}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" /></svg>
                        </button>
                        <button type="button" className="btn btn-sm btn-outline-danger" title="Cancelar" onClick={cancelarEdicion}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" /></svg>
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    // Los valores mostrados corresponden al pago cargado desde PostgreSQL.
    const tareaObj = tareas.find(t => t['id-tarea'] == datosEdicion['id-tarea']);
    const nombreTarea = tareaObj ? tareaObj.nombre : `Tarea #${datosEdicion['id-tarea']}`;

    return (
        <tr>
            <td>#{pago['id-pago']}</td>
            <td>{nombreTarea}</td>
            <td>{datosEdicion.descripcion}</td>
            <td className="pagos-page__monto">${Number(datosEdicion.monto).toLocaleString('es-AR')}</td>
            <td className="text-end">
                <div className="btn-group" role="group">
                    <button type="button" className="btn btn-sm btn-outline-secondary" title="Editar pago" onClick={iniciarEdicion}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z" />
                        </svg>
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-danger" title="Eliminar pago" onClick={() => onEliminar(pago)}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
                            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ObraSeccionPagos({ obra, pagosDeLaObra, totalAbonado, tareas, onActualizar, onEliminar }) {
    const [desplegado, setDesplegado] = useState(false);
    const estado = obra.estado ?? obra.Estado ?? 'Pendiente'
    const nombreObra = obra.nombre || obra.descripcion
        ? `Obra #${obra['id-obra']} · ${obra.nombre || obra.descripcion}`
        : `Obra #${obra['id-obra']}`

    return (
        <section className="pagos-page__listado border-bottom">
            <div className="pagos-page__toolbar">
                <div className="pagos-page__obra-identidad">
                    <div className="pagos-page__obra-datos">
                        <div className="pagos-page__obra-titulo-fila">
                            <h2 className="pagos-page__obra-titulo">{nombreObra}</h2>
                            <span className={`pagos-page__estado ${estadoClase(estado)}`}><span aria-hidden="true" />{estado}</span>
                        </div>
                        <p className="pagos-page__cliente"><span>Cliente:</span> {obra.clienteNombre || 'Sin cliente asignado'}</p>
                    </div>
                    <button
                        className="btn btn-sm btn-outline-secondary pagos-page__btn-desplegar"
                        type="button"
                        onClick={() => setDesplegado(!desplegado)}
                        aria-expanded={desplegado}
                    >
                        {desplegado ? 'Ocultar pagos' : 'Ver pagos'}
                    </button>
                </div>
                <div className="pagos-page__resumen-obra"><span><small>Total abonado</small><strong>${totalAbonado.toLocaleString('es-AR')}</strong></span><span><small>Costo total</small><strong>${Number(obra.costoTotal || 0).toLocaleString('es-AR')}</strong></span></div>
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
                                    <FilaPago key={pago['id-pago']} pago={pago} tareas={tareas} onActualizar={onActualizar} onEliminar={onEliminar} />
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
    const [pagoParaEliminar, setPagoParaEliminar] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [eliminando, setEliminando] = useState(false)
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

    const { pagos = [], obras = [], tareas = [] } = datos || {}

    const eliminar = async () => {
        if (!pagoParaEliminar) return
        setEliminando(true)
        setErrorMutacion('')
        try {
            await eliminarPago(pagoParaEliminar)
            setVersion((actual) => actual + 1)
            setPagoParaEliminar(null)
        } catch (motivo) {
            setErrorMutacion(motivo.message || 'No se pudo eliminar el pago.')
            setPagoParaEliminar(null)
        } finally {
            setEliminando(false)
        }
    }

    const guardar = async (event) => {
        event.preventDefault()
        setGuardando(true)
        setErrorMutacion('')
        setExito('')
        try {
            await crearPago(formulario)
            setVersion((actual) => actual + 1)
            setExito('Pago registrado. El costo real de la tarea se actualizó con este pago parcial.')
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
                    const totalAbonado = pagosDeLaObra.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0)

                    return (
                        <ObraSeccionPagos
                            key={obra['id-obra']}
                            obra={obra}
                            pagosDeLaObra={pagosDeLaObra}
                            totalAbonado={totalAbonado}
                            tareas={tareas}
                            onActualizar={async (pago) => { await actualizarPago(pago); setVersion((actual) => actual + 1) }}
                            onEliminar={setPagoParaEliminar}
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
                                            <option key={obra['id-obra']} value={obra['id-obra']}>Obra #{obra['id-obra']}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>Subtarea
                                    <select className="form-select" name="id-tarea" value={formulario['id-tarea']} onChange={(event) => setFormulario({ ...formulario, 'id-tarea': event.target.value })} required disabled={!formulario['id-obra']}>
                                        <option value="" disabled>{formulario['id-obra'] ? 'Seleccionar tarea' : 'Seleccione una obra primero'}</option>
                                        {tareas.filter(t => t['id-obra'] == formulario['id-obra'] && t._dbSubtareaId).map(tarea => (
                                            <option key={tarea['id-tarea']} value={tarea['id-tarea']}>{tarea.nombre}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>Monto ($)<input className="form-control" name="monto" type="number" min="1" step="0.01" value={formulario.monto} onChange={(event) => { const monto = soloDecimal(event.target.value); if (monto !== null) setFormulario({ ...formulario, monto }) }} required placeholder="Ej: 500000" /></label>
                                <label className="pagos-page__campo-completo">Descripción<input className="form-control" name="descripcion" value={formulario.descripcion} onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })} required placeholder="Ej: Adelanto de materiales" /></label>
                            </div>
                            <div className="pagos-page__form-actions">
                                <button className="btn btn-dark pagos-page__btn-submit" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Registrar pago'}</button>
                            </div>
                        </form>
                    </section>
                )}
            </div>
            {pagoParaEliminar && <ConfirmacionEliminar titulo="Eliminar pago" mensaje={`¿Querés eliminar el pago #${pagoParaEliminar['id-pago']}?`} onCancelar={() => setPagoParaEliminar(null)} onConfirmar={eliminar} eliminando={eliminando} />}
        </section>
    )
}

export default PagosPage
