import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { obtenerDetalleObra } from '../services/obraService'
import { construirEtapas } from '../../../shared/utils/avanceObra.js'
import Volver from '../../../shared/components/Volver.jsx'
import '../../../styles/SeguimientoObra.css'
import { useFetch } from '../../../shared/hooks/useFetch.js'

function claseEstadoObra(estado) {
  const normalizado = String(estado ?? '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  if (normalizado.includes('cancel')) return 'seguimiento-obra__estado-badge--cancelada'
  if (normalizado.includes('pausa') || normalizado.includes('suspend') || normalizado.includes('pendiente')) return 'seguimiento-obra__estado-badge--neutral'
  if (normalizado.includes('atras')) return 'seguimiento-obra__estado-badge--atrasada'
  if (normalizado.includes('final') || normalizado.includes('complet')) return 'seguimiento-obra__estado-badge--finalizada'
  if (normalizado.includes('ejecuci') || normalizado.includes('progreso')) return 'seguimiento-obra__estado-badge--activa'
  return 'seguimiento-obra__estado-badge--neutral'
}

function fechaCorta(valor) {
  if (!valor) return 'Sin fecha'
  const [anio, mes, dia] = String(valor).split('-').map(Number)
  if (!anio || !mes || !dia) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(anio, mes - 1, dia))
}

function formatoOracion(valor) {
  const texto = String(valor ?? '').trim().toLocaleLowerCase('es-AR')
  return texto ? texto.charAt(0).toLocaleUpperCase('es-AR') + texto.slice(1) : ''
}

function claseAvance(valor) {
  if (valor >= 100) return 'is-completa'
  if (valor > 0) return 'is-activa'
  return 'is-pendiente'
}

function codigoVisible(id) { return String(id ?? '').replaceAll('-', '.').replaceAll('_', '.').replaceAll(',', '.') }

const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor || 0)
}

function ViewObraPage() {
  const { id } = useParams()
  const { datos: obra, error: errorCarga, cargando: loading } = useFetch(obtenerDetalleObra, id)

  const etapas = useMemo(() => {
    if (!obra?.tareas) return []
    return construirEtapas(obra.tareas.map((tarea) => ({ ...tarea, 'id-tarea': tarea.idTarea })))
      .map((etapa, indice) => ({
        ...etapa,
        numeroOrden: indice + 1,
        idTarea: etapa['id-tarea'],
        subtareas: etapa.subtareas.map((tarea) => ({ ...tarea, idTarea: tarea['id-tarea'] })),
      }))
  }, [obra])

  const ganttDatos = useMemo(() => {
    const parseFecha = (iso) => {
      if (!iso) return null
      const [y, m, d] = iso.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    const conFechas = etapas.map((tarea) => ({ tarea, inicio: parseFecha(tarea.fechaInicioEstimada), fin: parseFecha(tarea.fechaFinEstimada) }))
      .filter(({ inicio, fin }) => inicio && fin && fin >= inicio)
    if (!conFechas.length) return null
    const minDate = new Date(Math.min(...conFechas.map(({ inicio }) => inicio.getTime())))
    const maxDate = new Date(Math.max(...conFechas.map(({ fin }) => fin.getTime())))
    const totalDays = Math.max(1, (maxDate - minDate) / 86400000)
    return {
      minDate,
      maxDate,
      tasks: conFechas.map(({ tarea, inicio, fin }) => ({
        ...tarea,
        estado: tarea.avance >= 100 ? 'finalizada' : tarea.avance > 0 ? 'en ejecucion' : 'sin comenzar',
        leftPercent: ((inicio - minDate) / 86400000 / totalDays) * 100,
        widthPercent: Math.max(.5, ((fin - inicio) / 86400000 / totalDays) * 100),
      })),
    }
  }, [etapas])

  if (loading) return <div className="p-4 text-muted">Cargando detalles de la obra...</div>
  if (errorCarga) return <div className="p-4 alert alert-danger">Error: {errorCarga.message}</div>
  if (!obra) return <div className="p-4 alert alert-warning">Obra no encontrada.</div>

  const costoEstimado = Number(obra.costoEstimadoTotal) || 0
  const montoAbonado = Number(obra.montoAbonado) || 0
  const diferenciaPresupuesto = costoEstimado - montoAbonado
  const porcentajeAbonado = costoEstimado > 0
    ? Math.min(100, Math.max(0, (montoAbonado / costoEstimado) * 100))
    : 0
  const presupuestoStatus = costoEstimado <= 0
    ? 'Sin estimación de costos'
    : montoAbonado > costoEstimado
      ? `Excedido por ${formatMoneda(Math.abs(diferenciaPresupuesto))}`
      : montoAbonado === costoEstimado
        ? 'Presupuesto completado exactamente.'
        : `Dentro del presupuesto (Faltan abonar ${formatMoneda(Math.abs(diferenciaPresupuesto))})`
  const presupuestoColor = costoEstimado <= 0
    ? 'text-muted'
    : montoAbonado > costoEstimado
      ? 'text-danger'
      : 'seguimiento-obra__presupuesto-ok'
  const avanceGeneral = Math.min(100, Math.max(0, Number(obra.porcentaje) || 0))
  const unidades = etapas.flatMap((etapa) => etapa.subtareas.length ? etapa.subtareas : [etapa])
  const completadas = unidades.filter((tarea) => (
    Number(tarea.porcentaje) >= 100 && Boolean(tarea.fechaFinReal)
  )).length

  return (
    <div className="container-fluid px-0 pb-5 cliente-detalle cliente-detalle-obra seguimiento-obra">
      <header className="seguimiento-obra__header cliente-detalle__encabezado">
        <Volver to="/cliente">Volver a mis obras</Volver>
        <div className="seguimiento-obra__encabezado-texto">
          <p className="seguimiento-obra__eyebrow">Seguimiento de obra</p>
          <div className="seguimiento-obra__titulo-fila">
            <h1>Obra #{obra.idObra} · Lote {obra.nroLote}</h1>
            <span className={`seguimiento-obra__estado-badge ${claseEstadoObra(obra.estado)}`}>
              <span aria-hidden="true" />{obra.estado}
            </span>
          </div>
          <p>{obra.direccionCompleta}</p>
        </div>
      </header>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <div className="seguimiento-obra__tarjeta-titulo"><h6 className="text-muted fw-bold">INFORMACIÓN GENERAL</h6></div>
              <ul className="list-unstyled mb-0">
                <li className="seguimiento-obra__dato-lote">
                  <span className="seguimiento-obra__dato-general">
                    <i className="bi bi-map" />
                    <span><span className="seguimiento-obra__dato-etiqueta">Lote:</span> <strong className="seguimiento-obra__dato-valor">{obra.nroLote}</strong></span>
                  </span>
                  <Link to={`/cliente/lotes/${obra.nroLote}`} className="btn btn-sm btn-outline-dark rounded-pill" style={{ fontSize: '0.75rem' }}>Ver información</Link>
                </li>
                <li className="seguimiento-obra__dato-general">
                  <i className="bi bi-person" />
                  <span><span className="seguimiento-obra__dato-etiqueta">Cliente:</span> <strong className="seguimiento-obra__dato-valor">{obra.cliente}</strong></span>
                </li>
                <li className="seguimiento-obra__dato-general">
                  <i className="bi bi-person-workspace" />
                  <span><span className="seguimiento-obra__dato-etiqueta">Arquitecto:</span> <strong className="seguimiento-obra__dato-valor">{obra.arquitecto}</strong></span>
                </li>
                <li className="seguimiento-obra__dato-general">
                  <i className="bi bi-calendar-event" />
                  <span><span className="seguimiento-obra__dato-etiqueta">Inicio estimado:</span> <strong className="seguimiento-obra__dato-valor">{fechaCorta(obra.fechaInicioEstimada)}</strong></span>
                </li>
                {obra.fechaFinEstimada && (
                  <li className="seguimiento-obra__dato-general">
                    <i className="bi bi-calendar-check" />
                    <span><span className="seguimiento-obra__dato-etiqueta">Fin estimado:</span> <strong className="seguimiento-obra__dato-valor">{fechaCorta(obra.fechaFinEstimada)}</strong></span>
                  </li>
                )}
                {obra.fechaInicioReal && (
                  <li className="seguimiento-obra__dato-general">
                    <i className="bi bi-play-circle" />
                    <span><span className="seguimiento-obra__dato-etiqueta">Inicio real:</span> <strong className="seguimiento-obra__dato-valor">{fechaCorta(obra.fechaInicioReal)}</strong></span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4 d-flex flex-column">
              <h6 className="text-muted fw-bold">ESTADO DE PRESUPUESTO</h6>
              <div className="mb-3">
                <span className="seguimiento-obra__finanzas-etiqueta">Costo estimado</span>
                <strong className="seguimiento-obra__finanzas-valor fs-4">{formatMoneda(costoEstimado)}</strong>
              </div>
              <div className="mb-3">
                <span className="seguimiento-obra__finanzas-etiqueta">Monto abonado</span>
                <strong className="seguimiento-obra__finanzas-valor fs-5">{formatMoneda(montoAbonado)}</strong>
                <div
                  className="seguimiento-obra__barra-presupuesto mt-2"
                  role="progressbar"
                  aria-label="Porcentaje del costo estimado abonado"
                  aria-valuenow={Math.round(porcentajeAbonado)}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span style={{ width: `${porcentajeAbonado}%` }} />
                </div>
              </div>
              <div className={`seguimiento-obra__presupuesto-estado ${presupuestoColor}`}>{presupuestoStatus}</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4 d-flex flex-column">
              <h6 className="text-muted fw-bold">ESTADO DE TIEMPO Y AVANCE</h6>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="seguimiento-obra__finanzas-etiqueta">Avance general</span>
                  <strong className="seguimiento-obra__finanzas-valor small">{avanceGeneral}%</strong>
                </div>
                <div className="progress" style={{ height: 10 }}>
                  <div
                    className="progress-bar bg-dark"
                    role="progressbar"
                    style={{ width: `${avanceGeneral}%` }}
                    aria-valuenow={avanceGeneral}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
              <div className="mb-3">
                <span className="seguimiento-obra__finanzas-etiqueta">Duración estimada · Duración real</span>
                <strong className="seguimiento-obra__finanzas-valor fw-semibold">
                  {obra.duracionEstimada ?? 'Sin datos'}{obra.duracionEstimada != null ? ' días' : ''} · {obra.duracionReal ?? 'Pendiente'}{obra.duracionReal != null ? ' días' : ''}
                </strong>
              </div>
              <div className="mb-3">
                <span className="seguimiento-obra__finanzas-etiqueta">Atraso de obra</span>
                {obra.diasAtrasoTotal > 0
                  ? <strong className="seguimiento-obra__finanzas-valor text-danger">Atrasada por {obra.diasAtrasoTotal} día{obra.diasAtrasoTotal !== 1 ? 's' : ''}</strong>
                  : <span className="seguimiento-obra__tiempo-badge">A tiempo</span>}
              </div>
              <p className="text-muted small mb-0 mt-auto">{completadas} de {unidades.length} tareas completadas</p>
            </div>
          </div>
        </div>
      </div>

      <section className="seguimiento-obra__panel" aria-labelledby="cronograma-cliente-titulo">
        <div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Diagrama de avance</p><h2 id="cronograma-cliente-titulo">Cronograma de tareas</h2></div><p>El cronograma muestra las tareas principales; el avance se calcula a partir de sus subtareas.</p></div>
        {ganttDatos ? <div className="seguimiento-obra__gantt-scroll"><div className="seguimiento-obra__gantt">
          <div className="seguimiento-obra__gantt-fechas"><span>Tarea</span><div><span>{fechaCorta(ganttDatos.minDate.toISOString().slice(0, 10))}</span><span>{fechaCorta(ganttDatos.maxDate.toISOString().slice(0, 10))}</span></div></div>
          {ganttDatos.tasks.map((tarea) => {
            const estado = tarea.avance >= 100 ? 'Finalizada' : tarea.avance > 0 ? 'En ejecución' : 'Sin comenzar'
            const detalleUrl = `/cliente/obras/${obra.idObra}/tareas/${tarea.idTarea}`
            return (
              <div className="seguimiento-obra__gantt-fila" key={tarea.idTarea}>
                <div className="seguimiento-obra__gantt-label">
                  <Link className="seguimiento-obra__tarea-link" to={detalleUrl}>
                    <strong>{codigoVisible(tarea.idTarea)} · {formatoOracion(tarea.nombre)}</strong>
                  </Link>
                  <span className={`seguimiento-obra__gantt-estado ${claseAvance(tarea.avance)}`}>
                    <span>{estado}</span> · <b>{tarea.avance}%</b>
                  </span>
                </div>
                <div className="seguimiento-obra__gantt-pista">
                  <Link
                    to={detalleUrl}
                    className={`seguimiento-obra__gantt-barra ${claseAvance(tarea.avance)}`}
                    style={{ left: `${tarea.leftPercent}%`, width: `${tarea.widthPercent}%` }}
                    title={`${formatoOracion(tarea.nombre)}: ${fechaCorta(tarea.fechaInicioEstimada)}–${fechaCorta(tarea.fechaFinEstimada)}`}
                    aria-label={`Ver detalle de ${formatoOracion(tarea.nombre)}`}
                  >
                    <span style={{ width: `${tarea.avance}%` }} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div></div> : <div className="seguimiento-obra__sin-cronograma">No hay tareas con fechas de inicio y fin para dibujar el cronograma. Abajo podés consultar las tareas cargadas.</div>}
      </section>

      <section className="seguimiento-obra__panel" aria-labelledby="etapas-cliente-titulo">
        <div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Detalle</p><h2 id="etapas-cliente-titulo">Etapas y subtareas</h2></div><span className="seguimiento-obra__contador">{etapas.length} tareas</span></div>
        {etapas.length ? <div className="seguimiento-obra__etapas">{etapas.map((etapa) => <details className={`seguimiento-obra__etapa ${claseAvance(etapa.avance)}`} key={etapa.idTarea}>
          <summary className="seguimiento-obra__etapa-cabecera"><div className="seguimiento-obra__etapa-titulo"><span>{etapa.numeroOrden}</span><div><h3>{etapa.nombre}</h3><small>{etapa.subtareas.length ? `${etapa.subtareas.length} subtareas · clic para ver` : 'Sin subtareas · clic para ver'}</small></div></div><div className={`seguimiento-obra__etapa-avance ${claseAvance(etapa.avance)}`}><strong>{etapa.avance}%</strong><div className={`seguimiento-obra__barra seguimiento-obra__barra--pequena ${claseAvance(etapa.avance)}`} role="progressbar" aria-label={`Avance de ${etapa.nombre}`} aria-valuenow={etapa.avance} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${etapa.avance}%` }} /></div></div></summary>
          <div className="seguimiento-obra__subtareas"><Link className="seguimiento-obra__detalle-cliente" to={`/cliente/obras/${obra.idObra}/tareas/${etapa.idTarea}`}>Ver detalle de {etapa.nombre} →</Link>
            {(etapa.subtareas.length ? etapa.subtareas : [etapa]).map((tarea) => { const completa = Number(tarea.porcentaje) >= 100 || ['finalizada', 'completada', 'completado'].includes(String(tarea.estado).toLowerCase()); return <Link className="seguimiento-obra__subtarea seguimiento-obra__subtarea--cliente" key={tarea.idTarea} to={`/cliente/obras/${obra.idObra}/tareas/${tarea.idTarea}`}><div><span className="seguimiento-obra__subtarea-codigo">{codigoVisible(tarea.idTarea)}</span><strong>{tarea.nombre}</strong></div><span className={`seguimiento-obra__estado-tarea ${completa ? 'is-completa' : 'is-pendiente'}`}>{completa ? 'Completada' : 'No completada'}</span><span className="seguimiento-obra__detalle-fila">Ver detalle →</span></Link> })}
          </div>
        </details>)}</div> : <div className="seguimiento-obra__sin-cronograma">No hay tareas registradas para esta obra.</div>}
      </section>
    </div>
  )
}

export default ViewObraPage
