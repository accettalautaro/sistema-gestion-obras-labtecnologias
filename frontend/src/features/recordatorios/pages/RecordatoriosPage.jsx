import { useMemo, useState } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { obtenerDatosRecordatorios, crearRecordatorio, eliminarRecordatorio } from '../services/recordatoriosService'
import '../../../styles/Recordatorios.css'

function calcularDiasDiferencia(fechaStr) {
    if (!fechaStr) return null;
    const partes = fechaStr.split('-');
    const fecha = new Date(partes[0], partes[1] - 1, partes[2]);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const diffTime = fecha.getTime() - hoy.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

function determinarAlerta(tarea) {
    const diffInicio = calcularDiasDiferencia(tarea['fecha-inicio']);
    const diffFin = calcularDiasDiferencia(tarea['fecha-fin']);
    const estado = (tarea.estado || '').toLowerCase();

    let tipo = null; // 'red', 'yellow'
    let mensaje = '';
    let diasRestantes = null;

    if (estado === 'sin comenzar') {
        if (diffInicio < 0) {
            tipo = 'red';
            mensaje = `Inicio atrasado por ${Math.abs(diffInicio)} días`;
            diasRestantes = diffInicio;
        } else if (diffInicio <= 15) {
            tipo = 'yellow';
            mensaje = `Debería iniciar en ${diffInicio} días`;
            diasRestantes = diffInicio;
        }
    } else if (estado === 'en ejecucion') {
        if (diffFin < 0) {
            tipo = 'red';
            mensaje = `Finalización atrasada por ${Math.abs(diffFin)} días`;
            diasRestantes = diffFin;
        } else if (diffFin <= 15) {
            tipo = 'yellow';
            mensaje = `Debería finalizar en ${diffFin} días`;
            diasRestantes = diffFin;
        }
    }

    return { tipo, mensaje, diasRestantes };
}

function RecordatoriosPage() {
    const { usuario } = useOutletContext()
    const [version, setVersion] = useState(0)
    const { datos, cargando, error } = useFetch(obtenerDatosRecordatorios, version)
    const { obras = [], tareas = [], recordatorios = [], clientes = [] } = datos || {}

    const FORMULARIO_VACIO = { 'id-cliente': '', 'id-obra': '', fecha: '', descripcion: '', estado: 'pendiente' }
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [guardando, setGuardando] = useState(false)
    const [errorMutacion, setErrorMutacion] = useState('')
    const [exito, setExito] = useState('')

    const guardar = async (event) => {
        event.preventDefault()
        setGuardando(true)
        setErrorMutacion('')
        setExito('')
        try {
            await crearRecordatorio(formulario)
            setVersion((actual) => actual + 1)
            setExito('Recordatorio registrado correctamente.')
            setFormulario(FORMULARIO_VACIO)
        } catch (motivo) {
            setErrorMutacion(motivo.message || 'No se pudo registrar el recordatorio.')
        } finally {
            setGuardando(false)
        }
    }

    const alertasObras = useMemo(() => {
        let lista = [];

        obras.forEach(obra => {
            const tareasObra = tareas.filter(t => String(t['id-obra']) === String(obra['id-obra']));
            let alertas = [];

            tareasObra.forEach(tarea => {
                const alerta = determinarAlerta(tarea);
                if (alerta.tipo) {
                    alertas.push({
                        ...tarea,
                        ...alerta
                    });
                }
            });

            if (alertas.length > 0) {
                // Find the most urgent alert for this obra
                alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);
                lista.push({
                    obra,
                    alertas,
                    alertaMasProxima: alertas[0].diasRestantes
                });
            }
        });

        lista.sort((a, b) => a.alertaMasProxima - b.alertaMasProxima);
        return lista;
    }, [obras, tareas]);

    const recordatoriosProcesados = useMemo(() => {
        return recordatorios.map(rec => {
            const diff = calcularDiasDiferencia(rec.fecha);
            return {
                ...rec,
                diasRestantes: diff,
                tipo: diff < 0 ? 'red' : (diff <= 15 ? 'yellow' : 'normal')
            }
        }).sort((a, b) => a.diasRestantes - b.diasRestantes);
    }, [recordatorios]);

    if (!usuario) return <Navigate to="/login" replace />

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
                    <p className="recordatorios__eyebrow">Avisos y Alertas</p>
                    <h1>Recordatorios</h1>
                    <p className="recordatorios__subtitle">Alertas de plazos de tareas y recordatorios personalizados.</p>
                </div>
            </header>

            <section className="recordatorios__grid">
                <article className="recordatorios-panel">
                    <div className="recordatorios-panel__heading">
                        <h2>Alertas de Obras</h2>
                        <span className="recordatorios-panel__count">{alertasObras.length} obras con alertas</span>
                    </div>

                    {alertasObras.length === 0 ? <p className="recordatorios-empty">No hay alertas de plazos próximas.</p> : (
                        <div className="recordatorios-list">
                            {alertasObras.map(({ obra, alertas }) => (
                                <div className="recordatorios-item" key={obra['id-obra']}>
                                    <div className="recordatorios-item__header">
                                        <strong>Obra #{obra['id-obra']}</strong>
                                        <span className="recordatorios-item__badge">{alertas.length} alertas</span>
                                    </div>
                                    <ul className="recordatorios-alerts">
                                        {alertas.map(alerta => (
                                            <li key={alerta['id-tarea']} className={`alert-box alert-${alerta.tipo}`}>
                                                <div className="alert-content">
                                                    <strong>{alerta.nombre}</strong>
                                                    <span>{alerta.mensaje}</span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </article>

                <article className="recordatorios-panel">
                    <div className="recordatorios-panel__heading">
                        <h2>Recordatorios Personalizados</h2>
                        <span className="recordatorios-panel__count">{recordatoriosProcesados.length} recordatorios</span>
                    </div>

                    {recordatoriosProcesados.length === 0 ? <p className="recordatorios-empty">No tienes recordatorios personalizados.</p> : (
                        <div className="recordatorios-list">
                            {recordatoriosProcesados.map(rec => (
                                <div className={`recordatorios-custom custom-${rec.tipo}`} key={rec['id-recordatorio']}>
                                    <div className="custom-content">
                                        <strong>{rec.descripcion}</strong>
                                        <span>Fecha: {rec.fecha} {rec.diasRestantes < 0 ? '(Atrasado)' : (rec.diasRestantes === 0 ? '(Hoy)' : `(En ${rec.diasRestantes} días)`)}</span>
                                    </div>
                                    <button className="btn btn-sm btn-outline-danger" type="button" onClick={async () => {
                                        if (!window.confirm('¿Eliminar este recordatorio?')) return
                                        try { await eliminarRecordatorio(rec['id-recordatorio']); setVersion((actual) => actual + 1) }
                                        catch (motivo) { setErrorMutacion(motivo.message) }
                                    }}>Eliminar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>

            <section className="recordatorios-formulario-section mt-5 border-top pt-4">
                <div className="recordatorios-panel__heading mb-3">
                    <h2>Registrar nuevo recordatorio</h2>
                </div>
                
                {errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}
                {exito && <div className="alert alert-success" role="status">{exito}</div>}

                <form onSubmit={guardar} className="recordatorios-form card p-4 shadow-sm bg-white">
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Cliente</label>
                            <select className="form-select" name="id-cliente" value={formulario['id-cliente']} onChange={(event) => setFormulario({ ...formulario, 'id-cliente': event.target.value, 'id-obra': '' })} required>
                                <option value="" disabled>Seleccionar cliente</option>
                                {clientes.map(cliente => (
                                    <option key={cliente.id} value={cliente.id}>{cliente.nombre} {cliente.apellido}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="col-md-6">
                            <label className="form-label fw-bold">Obra</label>
                            <select className="form-select" name="id-obra" value={formulario['id-obra']} onChange={(event) => setFormulario({ ...formulario, 'id-obra': event.target.value })} required disabled={!formulario['id-cliente']}>
                                <option value="" disabled>{formulario['id-cliente'] ? 'Seleccionar obra' : 'Seleccione un cliente primero'}</option>
                                {obras.filter(o => String(o.clienteId) === String(formulario['id-cliente'])).map(obra => (
                                    <option key={obra.id} value={obra.id}>Obra #{obra.id} ({obra.estado})</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">Fecha</label>
                            <input className="form-control" name="fecha" type="date" value={formulario.fecha} onChange={(event) => setFormulario({ ...formulario, fecha: event.target.value })} required />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label fw-bold">Descripción</label>
                            <input className="form-control" name="descripcion" type="text" value={formulario.descripcion} onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })} required placeholder="Ej: Llamar al proveedor de materiales" />
                        </div>
                    </div>

                    <div className="mt-4 text-end">
                        <button className="btn btn-dark" type="submit" disabled={guardando}>
                            {guardando ? 'Guardando...' : 'Registrar recordatorio'}
                        </button>
                    </div>
                </form>
            </section>
        </div>
    )
}

export default RecordatoriosPage
