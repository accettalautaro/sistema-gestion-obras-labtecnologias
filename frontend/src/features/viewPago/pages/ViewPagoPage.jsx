import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerDetalleTareaYPagos } from '../services/viewPagoService'

const ESTADO_TAREA_BADGE = {
  'finalizada': 'text-bg-secondary',
  'en ejecucion': 'text-bg-primary',
  'sin comenzar': 'text-bg-light text-dark border',
}

const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor || 0)
}

function ViewPagoPage() {
  const { idObra, idTarea } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    setLoading(true)
    obtenerDetalleTareaYPagos(idObra, idTarea)
      .then((res) => {
        if (activo) {
          setData(res)
          setLoading(false)
        }
      })
      .catch((e) => {
        if (activo) {
          setError(e.message)
          setLoading(false)
        }
      })
    return () => { activo = false }
  }, [idObra, idTarea])

  if (loading) return <div className="p-4 text-muted">Cargando detalles de la tarea...</div>
  if (error) return <div className="p-4 alert alert-danger">Error: {error}</div>
  if (!data) return <div className="p-4 alert alert-warning">No se encontró la tarea.</div>

  const { obra, tarea, pagos, totalAbonado } = data

  const diffCostoEstimado = tarea.costoEstimado - totalAbonado;
  let presupuestoStatus = '';
  let presupuestoColor = '';
  
  if (totalAbonado > tarea.costoEstimado && tarea.costoEstimado > 0) {
    presupuestoStatus = `Excedido por ${formatMoneda(Math.abs(diffCostoEstimado))}`
    presupuestoColor = 'text-danger'
  } else if (totalAbonado < tarea.costoEstimado) {
    presupuestoStatus = `Falta abonar ${formatMoneda(Math.abs(diffCostoEstimado))}`
    presupuestoColor = 'text-success'
  } else if (tarea.costoEstimado > 0 && totalAbonado === tarea.costoEstimado) {
    presupuestoStatus = `Abonado en su totalidad.`
    presupuestoColor = 'text-success'
  } else {
    presupuestoStatus = 'Sin costo estimado'
    presupuestoColor = 'text-muted'
  }

  return (
    <div className="container-fluid px-0 pb-5">
      <div className="mb-4 d-flex align-items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary rounded-circle" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h4 className="fw-bold mb-1">Tarea: {tarea.nombre}</h4>
          <p className="text-muted mb-0 small">Obra N.º {obra.idObra} - Lote {obra.nroLote}</p>
        </div>
        <div className="ms-auto">
          <span className={`badge ${ESTADO_TAREA_BADGE[tarea.estado?.toLowerCase()] ?? 'text-bg-secondary'} rounded-pill px-3 py-2 fs-6 fw-normal`}>
            {tarea.estado}
          </span>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Información general de la tarea */}
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h6 className="text-muted mb-4 fw-bold">INFORMACIÓN DE LA TAREA</h6>
              
              <p className="text-dark mb-4">{tarea.descripcion || 'Sin descripción detallada.'}</p>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3">
                    <span className="d-block text-muted small mb-1"><i className="bi bi-calendar-event me-2"></i>Inicio</span>
                    <strong className="fs-6">{tarea.fechaInicio || '-'}</strong>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3">
                    <span className="d-block text-muted small mb-1"><i className="bi bi-calendar-check me-2"></i>Fin</span>
                    <strong className="fs-6">{tarea.fechaFin || '-'}</strong>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="small text-muted">Progreso de la Tarea</span>
                  <span className="small fw-bold">{tarea.porcentaje}%</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div className="progress-bar bg-dark" style={{ width: `${tarea.porcentaje}%` }}></div>
                </div>
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <span className="text-muted d-block small">Duración Estimada</span>
                  <span className="fw-medium">{tarea.duracionEstimada} días</span>
                </div>
                <div className="col-6">
                  <span className="text-muted d-block small">Duración Real</span>
                  <span className={`fw-bold ${tarea.duracionReal > tarea.duracionEstimada ? 'text-danger' : 'text-success'}`}>
                    {tarea.duracionReal} días
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
              <h6 className="text-muted mb-4 fw-bold">RESUMEN DE PAGOS</h6>
              
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <span className="text-muted">Costo Estimado</span>
                <span className="fs-5 fw-bold">{formatMoneda(tarea.costoEstimado)}</span>
              </div>
              
              <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                <span className="text-muted">Costo Real</span>
                <span className={`fs-5 fw-bold ${tarea.costoReal > tarea.costoEstimado ? 'text-danger' : ''}`}>
                  {formatMoneda(tarea.costoReal)}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center pb-3 mb-2 bg-light p-3 rounded-3 mt-auto">
                <span className="text-dark fw-medium">Total Abonado</span>
                <span className="fs-4 fw-bold text-primary">{formatMoneda(totalAbonado)}</span>
              </div>

              <div className={`fw-semibold text-center py-2 ${presupuestoColor} bg-opacity-10 rounded-3`} style={{backgroundColor: totalAbonado > tarea.costoEstimado ? '#f8d7da' : '#d1e7dd'}}>
                <i className={`bi bi-${totalAbonado > tarea.costoEstimado ? 'exclamation-circle' : 'check-circle'} me-2`}></i>
                {presupuestoStatus}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de pagos parciales */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <h6 className="text-muted mb-4 fw-bold">HISTORIAL DE PAGOS PARCIALES</h6>
          
          {pagos.length === 0 ? (
            <div className="alert alert-light text-center py-4 text-muted border">No hay pagos registrados para esta tarea.</div>
          ) : (
            <div className="list-group list-group-flush rounded-3 border">
              {pagos.map((pago, index) => (
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
        </div>
      </div>
    </div>
  )
}

export default ViewPagoPage
