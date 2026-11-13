import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { obtenerDetalleObra } from '../services/obraService'
import { construirEtapas } from '../../../shared/utils/avanceObra.js'
import Volver from '../../../shared/components/Volver.jsx'
import '../../../styles/SeguimientoObra.css'
import { useFetch } from '../../../shared/hooks/useFetch.js'

const ESTADO_OBRA_BADGE = {
  'En ejecución': 'text-bg-success',
  Atrasada: 'text-bg-danger',
  Pausa: 'text-bg-warning',
  Finalizada: 'text-bg-secondary',
}

function fechaCorta(valor) {
  if (!valor) return 'Sin fecha'
  const [anio, mes, dia] = String(valor).split('-').map(Number)
  if (!anio || !mes || !dia) return 'Sin fecha'
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(anio, mes - 1, dia))
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
      .map((etapa) => ({
        ...etapa,
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

  const diffPresupuesto = obra.costoEstimadoTotal - obra.montoAbonado;
  let presupuestoStatus;
  let presupuestoColor;

  if (obra.montoAbonado > obra.costoEstimadoTotal && obra.costoEstimadoTotal > 0) {
    presupuestoStatus = `Excedido por ${formatMoneda(Math.abs(diffPresupuesto))}`
    presupuestoColor = 'text-danger'
  } else if (obra.montoAbonado < obra.costoEstimadoTotal) {
    presupuestoStatus = `Dentro del presupuesto (Faltan abonar ${formatMoneda(Math.abs(diffPresupuesto))})`
    presupuestoColor = 'text-success'
  } else if (obra.costoEstimadoTotal > 0 && obra.montoAbonado === obra.costoEstimadoTotal) {
    presupuestoStatus = `Presupuesto completado exactamente.`
    presupuestoColor = 'text-success'
  } else {
    presupuestoStatus = 'Sin estimación de costos'
    presupuestoColor = 'text-muted'
  }

  return (
    <div className="container-fluid px-0 pb-5 cliente-detalle cliente-detalle-obra seguimiento-obra">
      <header className="cliente-detalle__encabezado mb-4 d-flex align-items-center gap-3">
        <Volver to="/cliente">Volver a mis obras</Volver>
        <div>
          <h4 className="fw-bold mb-1">Obra N.º {obra.idObra}</h4>
          <p className="text-muted mb-0 small">{obra.direccionCompleta}</p>
        </div>
        <div className="ms-auto">
          <span className={`badge ${ESTADO_OBRA_BADGE[obra.estado] ?? 'text-bg-secondary'} rounded-pill px-3 py-2 fs-6 fw-normal`}>
            {obra.estado}
          </span>
        </div>
      </header>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h6 className="text-muted mb-3 fw-bold">INFORMACIÓN GENERAL</h6>
              <ul className="list-unstyled mb-0">
                <li className="mb-3 d-flex justify-content-between align-items-center">
                  <div>
                    <i className="bi bi-map me-2 text-muted"></i>
                    <strong>Lote:</strong> {obra.nroLote}
                  </div>
                  <Link to={`/cliente/lotes/${obra.nroLote}`} className="btn btn-sm btn-outline-dark rounded-pill" style={{ fontSize: '0.75rem' }}>
                    Ver información
                  </Link>
                </li>
                <li className="mb-2">
                  <i className="bi bi-person-workspace me-2 text-muted"></i>
                  <strong>Arquitecto:</strong> {obra.arquitecto}
                </li>
                {obra.arquitectoTelefono && (
                  <li className="mb-2">
                    <i className="bi bi-telephone me-2 text-muted"></i>
                    <strong>Teléfono Arq:</strong> {obra.arquitectoTelefono}
                  </li>
                )}
                {obra.arquitectoMatricula && (
                  <li className="mb-2">
                    <i className="bi bi-card-heading me-2 text-muted"></i>
                    <strong>Matrícula Arq:</strong> {obra.arquitectoMatricula}
                  </li>
                )}
                <li className="mb-2">
                  <i className="bi bi-calendar-event me-2 text-muted"></i>
                  <strong>Inicio estimado:</strong> {obra.fechaInicioEstimada || 'Sin fecha'}
                </li>
                {obra.fechaFinEstimada && (
                  <li className="mb-2">
                    <i className="bi bi-calendar-check me-2 text-muted"></i>
                    <strong>Fin estimado:</strong> {obra.fechaFinEstimada}
                  </li>
                )}
                {obra.fechaInicioReal && <li className="mb-2"><i className="bi bi-play-circle me-2 text-muted"/><strong>Inicio real:</strong> {obra.fechaInicioReal}</li>}
                {obra.fechaFinReal && <li className="mb-2"><i className="bi bi-check-circle me-2 text-muted"/><strong>Fin real:</strong> {obra.fechaFinReal}</li>}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h6 className="text-muted mb-3 fw-bold">ESTADO DE PRESUPUESTO</h6>
              <div className="mb-3">
                <span className="d-block text-muted small">Costo Estimado</span>
                <span className="fs-4 fw-bold">{formatMoneda(obra.costoEstimadoTotal)}</span>
              </div>
              <div className="mb-3">
                <span className="d-block text-muted small">Monto Abonado</span>
                <span className="fs-5">{formatMoneda(obra.montoAbonado)}</span>
              </div>
              <div className={`fw-semibold ${presupuestoColor} mt-auto`}>
                <i className={`bi bi-${obra.montoAbonado > obra.costoEstimadoTotal ? 'exclamation-circle' : 'check-circle'} me-2`}></i>
                {presupuestoStatus}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4 d-flex flex-column">
              <h6 className="text-muted mb-3 fw-bold">ESTADO DE TIEMPO Y AVANCE</h6>
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Avance General</span>
                  <span className="small fw-bold">{obra.porcentaje}%</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div
                    className="progress-bar bg-dark"
                    role="progressbar"
                    style={{ width: `${obra.porcentaje}%` }}
                    aria-valuenow={obra.porcentaje}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>

              <div className="mb-3">
                <span className="d-block text-muted small mb-1">Duración estimada · Duración real</span>
                <span className="fw-semibold">{obra.duracionEstimada ?? 'Sin datos'}{obra.duracionEstimada != null ? ' días' : ''} · {obra.duracionReal ?? 'Pendiente'}{obra.duracionReal != null ? ' días' : ''}</span>
              </div>

              <div className="mt-auto">
                <span className="d-block text-muted small mb-1">Atraso de Obra</span>
                {obra.diasAtrasoTotal > 0 ? (
                  <span className="text-danger fw-bold fs-5">
                    <i className="bi bi-clock-history me-2"></i>
                    Atrasada por {obra.diasAtrasoTotal} día{obra.diasAtrasoTotal !== 1 && 's'}
                  </span>
                ) : (
                  <span className="text-success fw-bold fs-5">
                    <i className="bi bi-calendar-check me-2"></i>
                    A tiempo
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="seguimiento-obra__panel" aria-labelledby="cronograma-cliente-titulo">
        <div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Diagrama de avance</p><h2 id="cronograma-cliente-titulo">Cronograma de tareas</h2></div><p>El cronograma muestra las tareas principales; el avance se calcula a partir de sus subtareas.</p></div>
        {ganttDatos ? <div className="seguimiento-obra__gantt-scroll"><div className="seguimiento-obra__gantt">
          <div className="seguimiento-obra__gantt-fechas"><span>Tarea</span><div><span>{fechaCorta(ganttDatos.minDate.toISOString().slice(0, 10))}</span><span>{fechaCorta(ganttDatos.maxDate.toISOString().slice(0, 10))}</span></div></div>
          {ganttDatos.tasks.map((tarea) => <div className="seguimiento-obra__gantt-fila" key={tarea.idTarea}>
            <div className="seguimiento-obra__gantt-label"><strong>{codigoVisible(tarea.idTarea)} · {tarea.nombre}</strong><span>{tarea.estado === 'finalizada' ? 'Finalizada' : tarea.estado === 'en ejecucion' ? 'En ejecución' : 'Sin comenzar'} · <b>{tarea.avance}%</b></span></div>
            <div className="seguimiento-obra__gantt-pista"><Link to={`/cliente/obras/${obra.idObra}/tareas/${tarea.idTarea}`} className={`seguimiento-obra__gantt-barra ${tarea.avance >= 100 ? 'is-completa' : tarea.avance > 0 ? 'is-activa' : ''}`} style={{ left: `${tarea.leftPercent}%`, width: `${tarea.widthPercent}%` }} title={`${tarea.nombre}: ${fechaCorta(tarea.fechaInicioEstimada)}–${fechaCorta(tarea.fechaFinEstimada)}`} aria-label={`Ver detalle de ${tarea.nombre}`}><span style={{ width: `${tarea.avance}%` }} /></Link></div>
          </div>)}
        </div></div> : <div className="seguimiento-obra__sin-cronograma">No hay tareas con fechas de inicio y fin para dibujar el cronograma. Abajo podés consultar las tareas cargadas.</div>}
      </section>

      <section className="seguimiento-obra__panel" aria-labelledby="etapas-cliente-titulo">
        <div className="seguimiento-obra__panel-encabezado"><div><p className="seguimiento-obra__eyebrow">Detalle</p><h2 id="etapas-cliente-titulo">Etapas y subtareas</h2></div><span className="seguimiento-obra__contador">{etapas.length} tareas</span></div>
        {etapas.length ? <div className="seguimiento-obra__etapas">{etapas.map((etapa) => <details className="seguimiento-obra__etapa" key={etapa.idTarea}>
          <summary className="seguimiento-obra__etapa-cabecera"><div className="seguimiento-obra__etapa-titulo"><span>{codigoVisible(etapa.idTarea)}</span><div><h3>{etapa.nombre}</h3><small>{etapa.subtareas.length ? `${etapa.subtareas.length} subtareas · clic para ver` : 'Sin subtareas · clic para ver'}</small></div></div><div className="seguimiento-obra__etapa-avance"><strong>{etapa.avance}%</strong><div className="seguimiento-obra__barra seguimiento-obra__barra--pequena" role="progressbar" aria-label={`Avance de ${etapa.nombre}`} aria-valuenow={etapa.avance} aria-valuemin="0" aria-valuemax="100"><span style={{ width: `${etapa.avance}%` }} /></div></div></summary>
          <div className="seguimiento-obra__subtareas"><Link className="seguimiento-obra__detalle-cliente" to={`/cliente/obras/${obra.idObra}/tareas/${etapa.idTarea}`}>Ver detalle de {etapa.nombre} →</Link>
            {(etapa.subtareas.length ? etapa.subtareas : [etapa]).map((tarea) => { const completa = Number(tarea.porcentaje) >= 100 || ['finalizada', 'completada', 'completado'].includes(String(tarea.estado).toLowerCase()); return <Link className="seguimiento-obra__subtarea seguimiento-obra__subtarea--cliente" key={tarea.idTarea} to={`/cliente/obras/${obra.idObra}/tareas/${tarea.idTarea}`}><div><span className="seguimiento-obra__subtarea-codigo">{codigoVisible(tarea.idTarea)}</span><strong>{tarea.nombre}</strong></div><span className={`seguimiento-obra__estado-tarea ${completa ? 'is-completa' : 'is-pendiente'}`}>{completa ? 'Completada' : 'No completada'}</span><span className="seguimiento-obra__detalle-fila">Ver detalle →</span></Link> })}
          </div>
        </details>)}</div> : <div className="seguimiento-obra__sin-cronograma">No hay tareas registradas para esta obra.</div>}
      </section>
    </div>
  )
}

export default ViewObraPage
