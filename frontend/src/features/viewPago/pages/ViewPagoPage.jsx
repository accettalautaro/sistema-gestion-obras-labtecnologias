import { Link, useLocation, useParams } from 'react-router-dom'
import { obtenerDetalleTareaYPagos } from '../services/viewPagoService'
import Volver from '../../../shared/components/Volver.jsx'
import { useFetch } from '../../../shared/hooks/useFetch.js'
import '../../../styles/TareaDetalle.css'

const ESTADO_TAREA_BADGE = {
  'finalizada': 'text-bg-secondary',
  'en ejecucion': 'text-bg-primary',
  'sin comenzar': 'text-bg-light text-dark border',
}

const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor || 0)
}
const obtenerDetallePorClave = (valor) => {
  const [obraId, tareaId] = valor.split('|')
  return obtenerDetalleTareaYPagos(obraId, tareaId)
}

function ViewPagoPage() {
  const { idObra, idTarea } = useParams()
  const location = useLocation()
  const esArquitecto = location.pathname.startsWith('/principal/')
  const volverA = location.state?.volverA ?? (esArquitecto ? `/principal/obras/${idObra}/avance` : `/cliente/obras/${idObra}`)
  const clave = `${idObra}|${idTarea}`
  const { datos: data, error: errorCarga, cargando: loading } = useFetch(obtenerDetallePorClave, clave)

  if (loading) return <div className="p-4 text-muted">Cargando detalles de la tarea...</div>
  if (errorCarga) return <div className="p-4 alert alert-danger">Error: {errorCarga.message}</div>
  if (!data) return <div className="p-4 alert alert-warning">No se encontró la tarea.</div>

  const { obra, tarea, pagos, totalAbonado } = data

  const diferenciaPresupuesto = tarea.costoEstimado - totalAbonado
  let presupuestoStatus
  let presupuestoColor
  if (totalAbonado > tarea.costoEstimado && tarea.costoEstimado > 0) {
    presupuestoStatus = `Excedido por ${formatMoneda(Math.abs(diferenciaPresupuesto))}`
    presupuestoColor = 'text-danger'
  } else if (totalAbonado < tarea.costoEstimado) {
    presupuestoStatus = `Falta abonar ${formatMoneda(Math.abs(diferenciaPresupuesto))}`
    presupuestoColor = 'text-success'
  } else if (tarea.costoEstimado > 0 && totalAbonado === tarea.costoEstimado) {
    presupuestoStatus = 'Abonado en su totalidad.'
    presupuestoColor = 'text-success'
  } else {
    presupuestoStatus = 'Sin costo estimado'
    presupuestoColor = 'text-muted'
  }

  return (
    <div className="container-fluid px-0 pb-5 cliente-detalle cliente-detalle-tarea">
      <header className="cliente-detalle__encabezado mb-4 d-flex align-items-center gap-3">
        <Volver to={volverA}>Volver</Volver>
        <div>
          <h4 className="fw-bold mb-1">Tarea: {tarea.nombre}</h4>
          <p className="text-muted mb-0 small">Obra N.º {obra.idObra} - Lote {obra.nroLote}</p>
        </div>
        <div className="ms-auto">
          <span className={`badge ${ESTADO_TAREA_BADGE[tarea.estado?.toLowerCase()] ?? 'text-bg-secondary'} rounded-pill px-3 py-2 fs-6 fw-normal`}>
            {tarea.estado}
          </span>
        </div>
      </header>

      <div className="row g-4 mb-4">
        {/* Información general de la tarea */}
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h6 className="tarea-detalle__titulo mb-4 fw-bold">INFORMACIÓN DE LA TAREA</h6>
              
              <p className="text-dark mb-4">{tarea.descripcion || 'Sin descripción detallada.'}</p>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3">
                    <span className="d-block text-muted small mb-1"><i className="bi bi-calendar-event me-2"></i>Inicio estimado</span>
                    <strong className="fs-6">{tarea.fechaInicioEstimada || '-'}</strong>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3">
                    <span className="d-block text-muted small mb-1"><i className="bi bi-calendar-check me-2"></i>Fin estimado</span>
                    <strong className="fs-6">{tarea.fechaFinEstimada || '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6"><div className="p-3 bg-light rounded-3"><span className="d-block text-muted small mb-1"><i className="bi bi-play-circle me-2"></i>Inicio real</span><strong className="fs-6">{tarea.fechaInicioReal || 'Pendiente'}</strong></div></div>
                <div className="col-6"><div className="p-3 bg-light rounded-3"><span className="d-block text-muted small mb-1"><i className="bi bi-check-circle me-2"></i>Fin real</span><strong className="fs-6">{tarea.fechaFinReal || 'Pendiente'}</strong></div></div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Progreso de la Tarea</span>
                  <span className="small fw-bold">{tarea.porcentaje}%</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div className="progress-bar tarea-detalle__barra" style={{ width: `${tarea.porcentaje}%` }}></div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <span className="text-muted d-block small">Duración Estimada</span>
                  <span className="fw-medium">{tarea.duracionEstimada ?? 'Sin datos'}{tarea.duracionEstimada != null ? ' días' : ''}</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small">Duración Real</span>
                  <span className={`fw-bold ${tarea.duracionReal > tarea.duracionEstimada ? 'text-danger' : 'text-success'}`}>
                    {tarea.duracionReal ?? 'Pendiente'}{tarea.duracionReal != null ? ' días' : ''}
                    {tarea.duracionReal > tarea.duracionEstimada && <i className="bi bi-exclamation-triangle ms-2"></i>}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de costos y pagos */}
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4 d-flex flex-column">
              <h6 className="tarea-detalle__titulo mb-4 fw-bold">RESUMEN DE PAGOS</h6>
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <span className="text-muted">Costo estimado</span>
                <span className="fs-5 fw-bold">{formatMoneda(tarea.costoEstimado)}</span>
              </div>
              <div className="d-flex justify-content-between align-items-center bg-light p-3 rounded-3 mb-3">
                <span className="tarea-detalle__total-label fw-medium">Total abonado</span>
                <span className="fs-4 fw-bold text-dark">{formatMoneda(totalAbonado)}</span>
              </div>
              <div className={`fw-semibold text-center py-2 ${presupuestoColor} bg-opacity-10 rounded-3 mt-auto`} style={{ backgroundColor: totalAbonado > tarea.costoEstimado && tarea.costoEstimado > 0 ? '#f8d7da' : '#d1e7dd' }}>
                <i className={`bi bi-${totalAbonado > tarea.costoEstimado && tarea.costoEstimado > 0 ? 'exclamation-circle' : 'check-circle'} me-2`}></i>
                {presupuestoStatus}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Las tareas principales muestran sus subtareas; las subtareas conservan el historial de pagos. */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          {tarea.subtareas.length > 0 ? <>
            <h6 className="tarea-detalle__titulo mb-4 fw-bold">SUBTAREAS</h6>
            <div className="tarea-detalle__subtareas">{tarea.subtareas.map((subtarea) => {
              const detalleUrl = esArquitecto ? `/principal/obras/${idObra}/avance/tareas/${encodeURIComponent(subtarea.idTarea)}` : `/cliente/obras/${idObra}/tareas/${encodeURIComponent(subtarea.idTarea)}`
              const completada = Number(subtarea.porcentaje) >= 100
              const volverATarea = `${location.pathname}${location.search}`
              return <article className="tarea-detalle__subtarea" key={subtarea.idTarea}>
                <div className="tarea-detalle__subtarea-principal"><Link className="tarea-detalle__subtarea-enlace" state={{ volverA: volverATarea }} to={detalleUrl}>{subtarea.nombre}</Link><span className={`tarea-detalle__estado ${completada ? 'is-completa' : 'is-pendiente'}`}>{completada ? 'Completado' : 'No completado'}</span></div>
                <div className="tarea-detalle__subtarea-costo"><span>Costo estimado</span><strong>{formatMoneda(subtarea.costoEstimado)}</strong></div>
                <div className="tarea-detalle__subtarea-costo"><span>Costo real</span><strong>{formatMoneda(subtarea.costoReal)}</strong></div>
                <Link aria-label={`Ver detalle de ${subtarea.nombre}`} className="tarea-detalle__ver" state={{ volverA: volverATarea }} to={detalleUrl}>Ver detalle →</Link>
              </article>
            })}</div>
          </> : <>
            <h6 className="text-muted mb-4 fw-bold">HISTORIAL DE PAGOS PARCIALES</h6>
            {pagos.length === 0 ? (
              <div className="alert alert-light text-center py-4 text-muted border">No hay pagos registrados para esta tarea.</div>
            ) : (
            <div className="list-group list-group-flush rounded-3 border">
              {pagos.map((pago) => (
                <div key={pago.idPago} className="list-group-item p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <div className="bg-success bg-opacity-10 text-success rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                      <i className="bi bi-cash fs-5"></i>
                    </div>
                    <div>
                      <h6 className="mb-0 fw-bold">Pago N.º {pago.idPago}</h6>
                      <small className="text-muted">{pago.descripcion}</small>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="fs-5 fw-bold text-dark">{formatMoneda(pago.monto)}</span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </>}
        </div>
      </div>
    </div>
  )
}

export default ViewPagoPage
