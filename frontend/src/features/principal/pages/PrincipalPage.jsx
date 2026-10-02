import { useMemo } from 'react'
import { Link, Navigate, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { obtenerDatosPanel } from '../services/principalService'
import '../../../styles/Principal.css'

const leerPorcentaje = (valor) => {
    const numero = Number.parseFloat(String(valor ?? '0').replace('%', '').replace(',', '.'))
    return Number.isFinite(numero) ? Math.min(100, Math.max(0, numero)) : 0
}

const estadoNormalizado = (estado = '') => estado
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace('Ã³', 'o')

const mostrarEstado = (estado = '') => {
    const normalizado = estadoNormalizado(estado)
    if (normalizado.includes('ejecuci')) return 'En ejecución'
    if (normalizado.includes('pausa')) return 'En pausa'
    if (normalizado.includes('termin') || normalizado.includes('finaliz') || normalizado.includes('complet')) return 'Finalizada'
    return estado || 'Sin estado'
}

const formatearPesos = (valor) => new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
}).format(valor)

function PrincipalPage() {
    const { usuario } = useOutletContext()
    
    // 1. Llamamos al Hook. Él se encarga de todo.
    const { datos, cargando, error } = useFetch(obtenerDatosPanel)

    // 2. Extraemos las listas del objeto datos (con un fallback de array vacío por seguridad)
    // Al hacer esto, no necesitas cambiar absolutamente nada de tu código de abajo.
    const { obras = [], clientes = [], tareas = [] } = datos || {}

    // 3. Ejecutamos todos los hooks (useMemo) ANTES de cualquier return condicional
    const resumen = useMemo(() => {
        const activas = obras.filter((obra) => estadoNormalizado(obra.Estado).includes('ejecuci') || estadoNormalizado(obra.Estado).includes('activa')).length
        const pausadas = obras.filter((obra) => estadoNormalizado(obra.Estado).includes('pausa')).length
        const terminadas = obras.filter((obra) => ['termin', 'finaliz', 'complet'].some((palabra) => estadoNormalizado(obra.Estado).includes(palabra))).length
        const avance = obras.length
            ? Math.round(obras.reduce((total, obra) => total + leerPorcentaje(obra.Porcentaje), 0) / obras.length)
            : 0
        const costoTotal = tareas.filter((tarea) => tarea.EsUnidadFinal).reduce((total, tarea) => total + (Number(tarea.CostReal) || 0), 0)
        return { activas, pausadas, terminadas, avance, costoTotal }
    }, [obras, tareas])

    // 4. Protegemos la ruta
    if (!usuario) return <Navigate to="/login" replace />

    // 5. Manejamos los estados de carga y error (ahora sí podemos hacer returns temprano)
    if (cargando) return <div className="dashboard-loading" role="status">Preparando el resumen de obras…</div>
    if (error) return (
        <section className="dashboard-error" role="alert">
            <h1>No pudimos cargar el resumen</h1>
            <p>Revisá que el servidor esté iniciado e intentá actualizar la página.</p>
        </section>
    )

    const clientePorId = (id) => clientes.find((cliente) => String(cliente.id) === String(id))
    
    const nombreCliente = (obra) => {
        const cliente = clientePorId(obra.clienteId)
        return cliente ? `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim() || `Cliente #${cliente.id}` : 'Cliente sin asignar'
    }
    
    const tareasDeObra = (obra) => tareas.filter((tarea) => String(tarea.obraId) === String(obra.id))
    
    const necesitaAtencion = obras.filter((obra) => estadoNormalizado(obra.Estado).includes('pausa') || (leerPorcentaje(obra.Porcentaje) < 20 && estadoNormalizado(obra.Estado).includes('ejecuci')))

    return (
        <div className="dashboard">
            <header className="dashboard__header">
                <div>
                    <p className="dashboard__eyebrow">Panel de gestión</p>
                    <h1>Buen día, {usuario.nombre}</h1>
                    <p className="dashboard__subtitle">Este es el estado general de tus obras.</p>
                </div>
                <Link className="dashboard__action" to="/principal/clientes">Gestionar clientes <span aria-hidden="true">→</span></Link>
            </header>

            <section className="dashboard__stats" aria-label="Resumen de obras">
                <article className="dashboard-stat dashboard-stat--primary">
                    <span className="dashboard-stat__icon" aria-hidden="true">⌂</span>
                    <p>Obras en ejecución</p><strong>{resumen.activas}</strong>
                    <small>de {obras.length} obras registradas</small>
                </article>
                <article className="dashboard-stat">
                    <span className="dashboard-stat__icon dashboard-stat__icon--green" aria-hidden="true">✓</span>
                    <p>Finalizadas</p><strong>{resumen.terminadas}</strong>
                    <small>obras completadas</small>
                </article>
                <article className="dashboard-stat">
                    <span className="dashboard-stat__icon dashboard-stat__icon--amber" aria-hidden="true">Ⅱ</span>
                    <p>En pausa</p><strong>{resumen.pausadas}</strong>
                    <small>requieren seguimiento</small>
                </article>
                <article className="dashboard-stat">
                    <span className="dashboard-stat__icon dashboard-stat__icon--blue" aria-hidden="true">↗</span>
                    <p>Avance promedio</p><strong>{resumen.avance}<span>%</span></strong>
                    <small>avance declarado por obra</small>
                </article>
            </section>

            <section className="dashboard__middle">
                <article className="dashboard-panel dashboard-progress">
                    <div className="dashboard-panel__heading">
                        <div><p className="dashboard-panel__eyebrow">Seguimiento</p><h2>Avance por obra</h2></div>
                        <span className="dashboard-panel__count">{obras.length} {obras.length === 1 ? 'obra' : 'obras'}</span>
                    </div>
                    {obras.length === 0 ? <p className="dashboard-empty">Todavía no hay obras para mostrar.</p> : (
                        <div className="dashboard-progress__list">
                            {obras.map((obra) => {
                                const avance = leerPorcentaje(obra.Porcentaje)
                                return <div className="dashboard-progress__item" key={obra.id}>
                                    <div className="dashboard-progress__meta"><div><strong>Obra #{obra.id}</strong><span>{nombreCliente(obra)}</span></div><b>{avance}%</b></div>
                                    <div className="dashboard-progress__track" role="progressbar" aria-label={`Avance de la obra ${obra.id}`} aria-valuenow={avance} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${avance}%` }} /></div>
                                    <div className="dashboard-progress__foot"><span>{mostrarEstado(obra.Estado)}</span><span>{tareasDeObra(obra).length} tareas asignadas</span></div>
                                </div>
                            })}
                        </div>
                    )}
                </article>

                <aside className="dashboard-panel dashboard-investment">
                    <p className="dashboard-panel__eyebrow">Costos registrados</p>
                    <h2>Inversión ejecutada</h2>
                    <strong className="dashboard-investment__amount">{formatearPesos(resumen.costoTotal)}</strong>
                    <p>Suma de los costos reales cargados en las tareas.</p>
                    <div className="dashboard-investment__rule" />
                    <div className="dashboard-investment__foot"><span>{tareas.length} tareas registradas</span><span>ARS</span></div>
                </aside>
            </section>

            <div className={`dashboard-notice ${necesitaAtencion.length ? 'dashboard-notice--attention' : ''}`}>
                <span className="dashboard-notice__symbol" aria-hidden="true">{necesitaAtencion.length ? '!' : '✓'}</span>
                <div><strong>{necesitaAtencion.length ? 'Obras para revisar' : 'Todo en orden'}</strong><p>{necesitaAtencion.length ? `${necesitaAtencion.length} ${necesitaAtencion.length === 1 ? 'obra necesita' : 'obras necesitan'} seguimiento por su estado o avance.` : 'No hay obras pausadas ni con avance bajo en este momento.'}</p></div>
                {necesitaAtencion.length > 0 && <span className="dashboard-notice__number">{necesitaAtencion.length}</span>}
            </div>
        </div>
    )
}

export default PrincipalPage
