import { useEffect, useState } from 'react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useOutletContext } from 'react-router-dom'
import { listarPagos, crearPago, actualizarPago, eliminarPago } from '../services/pagosService.js'
import ConfirmacionEliminar from '../../../shared/components/ConfirmacionEliminar.jsx'
import { soloDecimal } from '../../../shared/utils/filtrosEntrada.js'
import '../../../styles/Pagos.css'

const FORMULARIO_VACIO = { 'id-obra': '', 'id-tarea': '', 'id-subtarea': null, descripcion: '', monto: '' }

function estadoClase(estado) {
    const normalizado = String(estado ?? '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    if (normalizado.includes('cancel')) return 'pagos-page__estado--cancelada'
    if (normalizado.includes('paus') || normalizado.includes('suspend')) return 'pagos-page__estado--pausada'
    if (normalizado.includes('atras')) return 'pagos-page__estado--atrasada'
    if (normalizado.includes('ejecucion') || normalizado.includes('progreso')) return 'pagos-page__estado--activa'
    if (normalizado.includes('final') || normalizado.includes('complet')) return 'pagos-page__estado--finalizada'
    return 'pagos-page__estado--neutral'
}

function FilaPago({ pago, tareas, onEditar, onEliminar }) {
    const tareaObj = tareas.find((tarea) => String(tarea['id-tarea']) === String(pago['id-tarea']))
    const nombreTarea = tareaObj ? tareaObj.nombre : `Tarea #${pago['id-tarea']}`
    return (
        <tr>
            <td>#{pago['id-pago']}</td>
            <td>{nombreTarea}</td>
            <td>{pago.descripcion}</td>
            <td className="pagos-page__monto">${Number(pago.monto).toLocaleString('es-AR')}</td>
            <td className="text-end">
                <div className="btn-group" role="group">
                    <button type="button" className="btn btn-sm btn-outline-secondary" title="Editar pago" onClick={() => onEditar(pago)}>
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

function ObraSeccionPagos({ obra, pagosDeLaObra, totalAbonado, tareas, onEditar, onEliminar }) {
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
                                    <FilaPago key={pago['id-pago']} pago={pago} tareas={tareas} onEditar={onEditar} onEliminar={onEliminar} />
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
    const [formularioAbierto, setFormularioAbierto] = useState(false)
    const [pagoEditando, setPagoEditando] = useState(null)
    const [errorFormulario, setErrorFormulario] = useState('')
    const [pagoParaEliminar, setPagoParaEliminar] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [eliminando, setEliminando] = useState(false)
    const [errorMutacion, setErrorMutacion] = useState('')
    const [exito, setExito] = useState('')

    useEffect(() => {
        if (!formularioAbierto) return
        const cerrarConEscape = (event) => {
            if (event.key === 'Escape' && !guardando) {
                setFormularioAbierto(false)
                setPagoEditando(null)
                setFormulario(FORMULARIO_VACIO)
                setErrorFormulario('')
            }
        }
        window.addEventListener('keydown', cerrarConEscape)
        return () => window.removeEventListener('keydown', cerrarConEscape)
    }, [formularioAbierto, guardando])

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

    const abrirNuevoPago = () => {
        setPagoEditando(null)
        setFormulario(FORMULARIO_VACIO)
        setErrorFormulario('')
        setErrorMutacion('')
        setExito('')
        setFormularioAbierto(true)
    }

    const editarPago = (pago) => {
        setPagoEditando(pago)
        setFormulario({
            'id-obra': String(pago['id-obra'] ?? ''),
            'id-tarea': String(pago['id-tarea'] ?? ''),
            'id-subtarea': String(pago['id-subtarea'] ?? ''),
            descripcion: pago.descripcion ?? '',
            monto: String(pago.monto ?? ''),
        })
        setErrorFormulario('')
        setErrorMutacion('')
        setExito('')
        setFormularioAbierto(true)
    }

    const cerrarFormulario = () => {
        setFormularioAbierto(false)
        setPagoEditando(null)
        setFormulario(FORMULARIO_VACIO)
        setErrorFormulario('')
    }

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
        setErrorFormulario('')
        setErrorMutacion('')
        setExito('')
        try {
            if (pagoEditando) {
                await actualizarPago(pagoEditando['id-pago'], formulario)
                setExito('Pago actualizado correctamente.')
            } else {
                await crearPago(formulario)
                setExito('Pago registrado. El costo real de la tarea se actualizó con este pago parcial.')
            }
            setVersion((actual) => actual + 1)
            cerrarFormulario()
        } catch (motivo) {
            setErrorFormulario(motivo.message || 'No se pudo guardar el pago.')
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
                            onEditar={editarPago}
                            onEliminar={setPagoParaEliminar}
                        />
                    )
                })}

                {esArquitecto && (
                    <div className="pagos-page__listado-acciones">
                        <button className="btn btn-dark pagos-page__btn-submit" type="button" onClick={abrirNuevoPago} disabled={!obras.length}>Registrar nuevo pago</button>
                    </div>
                )}
            </div>
            {formularioAbierto && (
                <div className="pagos-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget && !guardando) cerrarFormulario() }}>
                    <section className="pagos-page__modal" role="dialog" aria-modal="true" aria-labelledby="pago-form-titulo" aria-describedby="pago-form-ayuda">
                        <div className="pagos-page__modal-cabecera">
                            <div>
                                <h2 id="pago-form-titulo">{pagoEditando ? `Editar pago #${pagoEditando['id-pago']}` : 'Registrar nuevo pago'}</h2>
                                <p id="pago-form-ayuda">Asociá el pago a una subtarea de una obra.</p>
                            </div>
                            <button className="pagos-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={cerrarFormulario} disabled={guardando}>×</button>
                        </div>
                        <form onSubmit={guardar} aria-busy={guardando}>
                            <div className="pagos-page__campos">
                                <label>Obra
                                    <select className="form-select" name="id-obra" value={formulario['id-obra']} onChange={(event) => setFormulario({ ...formulario, 'id-obra': event.target.value, 'id-tarea': '', 'id-subtarea': null })} required disabled={Boolean(pagoEditando)} autoFocus={!pagoEditando}>
                                        <option value="" disabled>Seleccionar obra</option>
                                        {obras.map((obra) => (
                                            <option key={obra['id-obra']} value={obra['id-obra']}>Obra #{obra['id-obra']} · {obra.nombre || 'Sin nombre'}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>Subtarea
                                    <select className="form-select" name="id-tarea" value={formulario['id-tarea']} onChange={(event) => setFormulario({ ...formulario, 'id-tarea': event.target.value, 'id-subtarea': null })} required disabled={!formulario['id-obra']} autoFocus={Boolean(pagoEditando)}>
                                        <option value="" disabled>{formulario['id-obra'] ? 'Seleccionar tarea' : 'Seleccione una obra primero'}</option>
                                        {tareas.filter((tarea) => String(tarea['id-obra']) === String(formulario['id-obra']) && tarea._dbSubtareaId).map((tarea) => (
                                            <option key={tarea['id-tarea']} value={tarea['id-tarea']}>{tarea.nombre}</option>
                                        ))}
                                    </select>
                                </label>
                                <label>Monto ($)<input className="form-control" name="monto" type="number" min="1" step="0.01" value={formulario.monto} onChange={(event) => { const monto = soloDecimal(event.target.value); if (monto !== null) setFormulario({ ...formulario, monto }) }} required placeholder="Ej: 500000" /></label>
                                <label className="pagos-page__campo-completo">Descripción<input className="form-control" name="descripcion" value={formulario.descripcion} onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })} required placeholder="Ej: Adelanto de materiales" /></label>
                            </div>
                            {errorFormulario && <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">{errorFormulario}</p>}
                            <div className="pagos-page__form-actions">
                                <button className="btn btn-outline-secondary" type="button" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button>
                                <button className="btn btn-dark pagos-page__btn-submit" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : pagoEditando ? 'Guardar cambios' : 'Registrar pago'}</button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
            {pagoParaEliminar && <ConfirmacionEliminar titulo="Eliminar pago" mensaje={`¿Querés eliminar el pago #${pagoParaEliminar['id-pago']}?`} onCancelar={() => setPagoParaEliminar(null)} onConfirmar={eliminar} eliminando={eliminando} />}
        </section>
    )
}

export default PagosPage
