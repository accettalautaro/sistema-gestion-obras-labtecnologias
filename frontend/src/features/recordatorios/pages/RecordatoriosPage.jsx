import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import {
    actualizarRecordatorio,
    crearRecordatorio,
    eliminarRecordatorio,
    obtenerDatosRecordatorios,
} from '../services/recordatoriosService'
import ConfirmacionEliminar from '../../../shared/components/ConfirmacionEliminar.jsx'
import '../../../styles/Recordatorios.css'

const FORMULARIO_VACIO = { 'id-cliente': '', 'id-obra': '', fecha: '', descripcion: '' }

function calcularDiasDiferencia(fechaStr) {
    if (!fechaStr) return null
    const partes = fechaStr.split('-')
    const fecha = new Date(partes[0], partes[1] - 1, partes[2])
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const diffTime = fecha.getTime() - hoy.getTime()
    return Math.round(diffTime / (1000 * 60 * 60 * 24))
}

function RecordatoriosPage() {
    const { usuario } = useOutletContext()
    const navigate = useNavigate()
    const [version, setVersion] = useState(0)

    const { datos, cargando, error } = useFetch(obtenerDatosRecordatorios, version)
    const { obras = [], recordatorios = [], clientes = [] } = datos || {}

    const [obraFiltro, setObraFiltro] = useState('')
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [recordatorioEditando, setRecordatorioEditando] = useState(null)
    const [recordatorioParaEliminar, setRecordatorioParaEliminar] = useState(null)
    const [guardando, setGuardando] = useState(false)
    const [eliminando, setEliminando] = useState(false)
    const [errorMutacion, setErrorMutacion] = useState('')
    const [exito, setExito] = useState('')

    useEffect(() => {
        if (!usuario) navigate('/login', { replace: true })
    }, [navigate, usuario])

    const cancelarEdicion = () => {
        setRecordatorioEditando(null)
        setFormulario(FORMULARIO_VACIO)
        setErrorMutacion('')
        setExito('')
    }

    const editar = (recordatorio) => {
        const obra = obras.find((item) => String(item.id) === String(recordatorio.obraId))
        setRecordatorioEditando(recordatorio)
        setFormulario({
            'id-cliente': String(obra?.clienteId ?? ''),
            'id-obra': String(recordatorio.obraId),
            fecha: recordatorio.fecha,
            descripcion: recordatorio.descripcion,
        })
        setErrorMutacion('')
        setExito('')
    }

    const guardar = async (event) => {
        event.preventDefault()
        setGuardando(true)
        setErrorMutacion('')
        setExito('')
        try {
            if (recordatorioEditando) {
                await actualizarRecordatorio(recordatorioEditando.id, formulario)
            } else {
                await crearRecordatorio(formulario)
            }
            setVersion((actual) => actual + 1)
            setExito(recordatorioEditando ? 'Recordatorio actualizado correctamente.' : 'Recordatorio registrado correctamente.')
            setRecordatorioEditando(null)
            setFormulario(FORMULARIO_VACIO)
        } catch (motivo) {
            setErrorMutacion(motivo.message || 'No se pudo guardar el recordatorio.')
        } finally {
            setGuardando(false)
        }
    }

    const eliminar = async () => {
        if (!recordatorioParaEliminar) return
        setEliminando(true)
        setErrorMutacion('')
        setExito('')
        try {
            await eliminarRecordatorio(recordatorioParaEliminar.id)
            if (recordatorioEditando?.id === recordatorioParaEliminar.id) cancelarEdicion()
            setVersion((actual) => actual + 1)
            setExito('Recordatorio eliminado correctamente.')
            setRecordatorioParaEliminar(null)
        } catch (motivo) {
            setErrorMutacion(motivo.message || 'No se pudo eliminar el recordatorio.')
            setRecordatorioParaEliminar(null)
        } finally {
            setEliminando(false)
        }
    }

    const recordatoriosProcesados = useMemo(() => {
        return recordatorios.map(rec => {
            const diff = calcularDiasDiferencia(rec.fecha)
            return {
                ...rec,
                diasRestantes: diff,
                tipo: diff !== null && diff < 0 ? 'red' : (diff !== null && diff <= 15 ? 'yellow' : 'normal')
            }
        }).sort((a, b) => (a.diasRestantes ?? Number.MAX_SAFE_INTEGER) - (b.diasRestantes ?? Number.MAX_SAFE_INTEGER))
    }, [recordatorios]);

    const recordatoriosFiltrados = useMemo(() => {
        if (!obraFiltro) return recordatoriosProcesados
        return recordatoriosProcesados.filter((recordatorio) => String(recordatorio.obraId) === obraFiltro)
    }, [obraFiltro, recordatoriosProcesados])

    if (!usuario) return null

    if (cargando) return <div className="dashboard-loading" role="status">Cargando recordatorios…</div>
    if (error) return (
        <section className="dashboard-error" role="alert">
            <h1>Error cargando recordatorios</h1>
            <p>Revisá que el servidor esté iniciado e intentá actualizar la página.</p>
        </section>
    )

    return (
        <div className="recordatorios-page">
            <header className="recordatorios__header">
                <div>
                    <p className="recordatorios__eyebrow">Área privada</p>
                    <h1>Gestión de recordatorios</h1>
                    <p>Organizá los avisos asociados a tus obras.</p>
                </div>
                <span className="recordatorios__count">{recordatoriosProcesados.length} {recordatoriosProcesados.length === 1 ? 'recordatorio' : 'recordatorios'}</span>
            </header>

            {errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}
            {exito && <div className="alert alert-success" role="status">{exito}</div>}

            <div className="recordatorios__workspace">
                <section className="recordatorios__listado" aria-labelledby="recordatorios-listado-titulo">
                    <div className="recordatorios__toolbar">
                        <h2 id="recordatorios-listado-titulo">Recordatorios registrados</h2>
                        <label className="recordatorios__filtro">
                            <span className="visually-hidden">Filtrar recordatorios por obra</span>
                            <select className="form-select" value={obraFiltro} onChange={(event) => setObraFiltro(event.target.value)}>
                                <option value="">Todas las obras</option>
                                {obras.map((obra) => (
                                    <option key={obra.id} value={obra.id}>Obra #{obra.id} · {obra.nombre || 'Sin nombre'}</option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {recordatoriosFiltrados.length === 0 ? <p className="recordatorios__vacio">{obraFiltro ? 'No hay recordatorios para esta obra.' : 'Todavía no hay recordatorios registrados.'}</p> : (
                        <div className="recordatorios__lista">
                            {recordatoriosFiltrados.map(rec => {
                                const obra = obras.find((item) => String(item.id) === String(rec.obraId))
                                return (
                                    <article className={`recordatorios__item recordatorios__item--${rec.tipo}`} key={rec.id}>
                                        <div className="recordatorios__item-contenido">
                                            <strong>{rec.descripcion}</strong>
                                            <span>Obra #{rec.obraId} · {obra?.nombre || 'Sin nombre'}</span>
                                            <span>{rec.fecha} {rec.diasRestantes === null ? '' : rec.diasRestantes < 0 ? '(Atrasado)' : rec.diasRestantes === 0 ? '(Hoy)' : `(En ${rec.diasRestantes} días)`}</span>
                                        </div>
                                        <div className="recordatorios__acciones">
                                            <button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(rec)}>Editar</button>
                                            <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setRecordatorioParaEliminar(rec)}>Eliminar</button>
                                        </div>
                                    </article>
                                )
                            })}
                        </div>
                    )}
                </section>

                <section className="recordatorios__formulario" aria-labelledby="recordatorio-form-titulo">
                    <div className="recordatorios__formulario-header">
                        <div>
                            <h2 id="recordatorio-form-titulo">{recordatorioEditando ? `Editar recordatorio #${recordatorioEditando.id}` : 'Nuevo recordatorio'}</h2>
                            <p>Asociado a una obra existente.</p>
                        </div>
                        {recordatorioEditando && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={cancelarEdicion}>Nuevo recordatorio</button>}
                    </div>
                    <form onSubmit={guardar}>
                        <div className="recordatorios__campos">
                            <label>Cliente
                                <select className="form-select" name="id-cliente" value={formulario['id-cliente']} onChange={(event) => setFormulario({ ...formulario, 'id-cliente': event.target.value, 'id-obra': '' })} required disabled={Boolean(recordatorioEditando)}>
                                    <option value="">Seleccioná un cliente</option>
                                    {clientes.map(cliente => <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>)}
                                </select>
                            </label>
                            <label>Obra
                                <select className="form-select" name="id-obra" value={formulario['id-obra']} onChange={(event) => setFormulario({ ...formulario, 'id-obra': event.target.value })} required disabled={!formulario['id-cliente'] || Boolean(recordatorioEditando)}>
                                    <option value="">Seleccioná una obra</option>
                                    {obras.filter(o => String(o.clienteId) === String(formulario['id-cliente'])).map(obra => (
                                        <option key={obra.id} value={obra.id}>Obra #{obra.id} · {obra.nombre || 'Sin nombre'}</option>
                                    ))}
                                </select>
                            </label>
                            <label>Fecha
                                <input className="form-control" name="fecha" type="date" value={formulario.fecha} onChange={(event) => setFormulario({ ...formulario, fecha: event.target.value })} required />
                            </label>
                            <label>Descripción
                                <input className="form-control" name="descripcion" type="text" value={formulario.descripcion} onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })} required placeholder="Ej: Llamar al proveedor de materiales" />
                            </label>
                        </div>
                        <div className="recordatorios__form-actions">
                            {recordatorioEditando && <button className="btn btn-outline-secondary" type="button" onClick={cancelarEdicion}>Cancelar</button>}
                            <button className="btn btn-dark" type="submit" disabled={guardando}>
                                {guardando ? 'Guardando...' : recordatorioEditando ? 'Guardar cambios' : 'Crear recordatorio'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
            {recordatorioParaEliminar && <ConfirmacionEliminar titulo="Eliminar recordatorio" mensaje={`¿Querés eliminar el recordatorio "${recordatorioParaEliminar.descripcion}"?`} onCancelar={() => setRecordatorioParaEliminar(null)} onConfirmar={eliminar} eliminando={eliminando} />}
        </div>
    )
}

export default RecordatoriosPage
