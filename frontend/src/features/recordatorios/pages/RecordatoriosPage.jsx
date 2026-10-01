import { useMemo } from 'react'
import { Navigate, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { obtenerDatosRecordatorios } from '../services/recordatoriosService'
import '../../../styles/Recordatorios.css'

function calcularDiasDiferencia(fechaStr) {
    if (!fechaStr) return null;
    const fecha = new Date(fechaStr + 'T00:00:00');
    // For testing and mockup purposes, let's use the local current date from metadata or hardcode
    // Based on user metadata, today is 2026-09-30.
    const hoy = new Date('2026-09-30T00:00:00');
    const diffTime = fecha.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function determinarAlerta(tarea) {
    const diffInicio = calcularDiasDiferencia(tarea.fechaInicio);
    const diffFin = calcularDiasDiferencia(tarea.fechaFin);
    const estado = (tarea.estado || '').toLowerCase();
    
    let tipo = null; // 'red', 'yellow'
    let mensaje = '';
    let diasRestantes = null;

    if (estado === 'sin comenzar') {
        if (diffInicio < 0) {
            tipo = 'red';
            mensaje = `Inicio atrasado por ${Math.abs(diffInicio)} días`;
            diasRestantes = diffInicio;
        } else if (diffInicio <= 7) {
            tipo = 'yellow';
            mensaje = `Debería iniciar en ${diffInicio} días`;
            diasRestantes = diffInicio;
        }
    } else if (estado === 'en ejecucion') {
        if (diffFin < 0) {
            tipo = 'red';
            mensaje = `Finalización atrasada por ${Math.abs(diffFin)} días`;
            diasRestantes = diffFin;
        } else if (diffFin <= 7) {
            tipo = 'yellow';
            mensaje = `Debería finalizar en ${diffFin} días`;
            diasRestantes = diffFin;
        }
    }
    
    return { tipo, mensaje, diasRestantes };
}

function RecordatoriosPage() {
    const { usuario } = useOutletContext()
    
    const { datos, cargando, error } = useFetch(obtenerDatosRecordatorios)
    const { obras = [], tareas = [], recordatorios = [] } = datos || {}

    const alertasObras = useMemo(() => {
        let lista = [];

        obras.forEach(obra => {
            const tareasObra = tareas.filter(t => String(t.obraId) === String(obra.id));
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
                tipo: diff < 0 ? 'red' : (diff <= 7 ? 'yellow' : 'normal')
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
                                <div className="recordatorios-item" key={obra.id}>
                                    <div className="recordatorios-item__header">
                                        <strong>Obra #{obra.id}</strong>
                                        <span className="recordatorios-item__badge">{alertas.length} alertas</span>
                                    </div>
                                    <ul className="recordatorios-alerts">
                                        {alertas.map(alerta => (
                                            <li key={alerta.id} className={`alert-box alert-${alerta.tipo}`}>
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
                                <div className={`recordatorios-custom custom-${rec.tipo}`} key={rec.id}>
                                    <div className="custom-content">
                                        <strong>{rec.mensaje}</strong>
                                        <span>Fecha: {rec.fecha} {rec.diasRestantes < 0 ? '(Atrasado)' : (rec.diasRestantes === 0 ? '(Hoy)' : `(En ${rec.diasRestantes} días)`)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </article>
            </section>
        </div>
    )
}

export default RecordatoriosPage
