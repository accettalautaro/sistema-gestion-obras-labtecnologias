import { useEffect, useState, useMemo } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { obtenerDetalleObra } from '../services/obraService'

const ESTADO_OBRA_BADGE = {
  'En ejecución': 'text-bg-success',
  Atrasada: 'text-bg-danger',
  Pausa: 'text-bg-warning',
  Finalizada: 'text-bg-secondary',
}

const ESTADO_TAREA_BADGE = {
  'finalizada': 'text-bg-secondary',
  'en ejecucion': 'text-bg-primary',
  'sin comenzar': 'text-bg-light text-dark border',
}

const formatMoneda = (valor) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor || 0)
}

function ViewObraPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [obra, setObra] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let activo = true
    setLoading(true)
    obtenerDetalleObra(id)
      .then((data) => {
        if (activo) {
          setObra(data)
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
  }, [id])

  // Gantt logic...
  const ganttDatos = useMemo(() => {
    if (!obra || !obra.tareas || obra.tareas.length === 0) return null;
    
    // Find min date and max date across all tasks
    const parseFecha = (iso) => {
      if (!iso) return null;
      const [y, m, d] = iso.split('-').map(Number)
      return new Date(y, m - 1, d)
    }
    
    let minDate = new Date(8640000000000000);
    let maxDate = new Date(-8640000000000000);
    
    const validTareas = obra.tareas.filter(t => t.fechaInicio && t.fechaFin);
    
    if (validTareas.length === 0) return null;
    
    validTareas.forEach(t => {
      const start = parseFecha(t.fechaInicio);
      const end = parseFecha(t.fechaFin);
      if (start && start < minDate) minDate = start;
      if (end && end > maxDate) maxDate = end;
    });
    
    const totalDays = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    const tasks = validTareas.map(t => {
      const start = parseFecha(t.fechaInicio);
      const end = parseFecha(t.fechaFin);
      const startOffset = (start - minDate) / (1000 * 60 * 60 * 24);
      const duration = (end - start) / (1000 * 60 * 60 * 24);
      
      return {
        ...t,
        leftPercent: (startOffset / totalDays) * 100,
        widthPercent: Math.max(0.5, (duration / totalDays) * 100), // Min 0.5% width
      }
    })
    
    return { minDate, maxDate, totalDays, tasks }
  }, [obra])

  if (loading) return <div className="p-4 text-muted">Cargando detalles de la obra...</div>
  if (error) return <div className="p-4 alert alert-danger">Error: {error}</div>
  if (!obra) return <div className="p-4 alert alert-warning">Obra no encontrada.</div>

  const diffPresupuesto = obra.costoEstimadoTotal - obra.montoAbonado;
  let presupuestoStatus = '';
  let presupuestoColor = '';
  
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
    <div className="container-fluid px-0 pb-5">
      <div className="mb-4 d-flex align-items-center gap-3">
        <Link to="/cliente" className="btn btn-sm btn-outline-secondary rounded-circle" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-arrow-left"></i>
        </Link>
        <div>
          <h4 className="fw-bold mb-1">Obra N.º {obra.idObra}</h4>
          <p className="text-muted mb-0 small">{obra.direccionCompleta}</p>
        </div>
        <div className="ms-auto">
          <span className={`badge ${ESTADO_OBRA_BADGE[obra.estado] ?? 'text-bg-secondary'} rounded-pill px-3 py-2 fs-6 fw-normal`}>
            {obra.estado}
          </span>
        </div>
      </div>

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
                  <Link to={`/cliente/lotes/${obra.nroLote}`} className="btn btn-sm btn-outline-dark rounded-pill" style={{fontSize: '0.75rem'}}>
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
                  <strong>Fecha de Inicio:</strong> {obra.fechaInicio}
                </li>
                {obra.fechaFin && (
                  <li className="mb-2">
                    <i className="bi bi-calendar-check me-2 text-muted"></i>
                    <strong>Fecha de Fin:</strong> {obra.fechaFin}
                  </li>
                )}
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

      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-body p-4">
          <h6 className="text-muted mb-4 fw-bold">CRONOGRAMA DE TAREAS (GANTT)</h6>
          
          {!ganttDatos ? (
            <div className="alert alert-light text-center py-4 text-muted border">No hay tareas con fechas asignadas para mostrar en el cronograma.</div>
          ) : (
            <div className="gantt-container" style={{ overflowX: 'auto' }}>
              <div style={{ minWidth: '800px' }}>
                <div className="d-flex border-bottom pb-2 mb-3 text-muted small fw-bold">
                  <div style={{ width: '25%' }}>Tarea</div>
                  <div style={{ width: '75%', position: 'relative' }}>
                    <span>{ganttDatos.minDate.toLocaleDateString('es-AR')}</span>
                    <span style={{ position: 'absolute', right: 0 }}>{ganttDatos.maxDate.toLocaleDateString('es-AR')}</span>
                  </div>
                </div>
                
                {ganttDatos.tasks.map((tarea) => (
                  <div key={tarea.idTarea} className="d-flex align-items-center mb-3 position-relative">
                    <div style={{ width: '25%' }} className="pe-3 text-truncate" title={tarea.nombre}>
                      <span className="fw-semibold d-block text-truncate mb-1">{tarea.nombre}</span>
                      <span className={`badge ${ESTADO_TAREA_BADGE[tarea.estado?.toLowerCase()] ?? 'text-bg-secondary'} fw-normal`} style={{fontSize: '0.65rem'}}>
                        {tarea.estado}
                      </span>
                      <span className="ms-2 small text-muted fw-bold">{tarea.porcentaje}%</span>
                    </div>
                    
                    <div style={{ width: '75%', position: 'relative', height: '28px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                      <div 
                        title={`${tarea.nombre}: ${tarea.fechaInicio} a ${tarea.fechaFin}`}
                        style={{
                          position: 'absolute',
                          left: `${tarea.leftPercent}%`,
                          width: `${tarea.widthPercent}%`,
                          height: '100%',
                          backgroundColor: tarea.estado?.toLowerCase() === 'finalizada' ? '#6c757d' : 
                                           tarea.estado?.toLowerCase() === 'en ejecucion' ? '#0d6efd' : '#dee2e6',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                          transition: 'transform 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scaleY(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scaleY(1)'}
                        onClick={() => navigate(`/cliente/obras/${obra.idObra}/tareas/${tarea.idTarea}`)}
                      >
                         <div style={{
                           width: `${tarea.porcentaje}%`,
                           height: '100%',
                           backgroundColor: 'rgba(255,255,255,0.25)',
                           position: 'absolute',
                           left: 0,
                           top: 0
                         }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="card border-0 shadow-sm rounded-3">
        <div className="card-body p-4">
          <h6 className="text-muted mb-4 fw-bold">LISTADO DETALLADO DE TAREAS</h6>
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Nombre</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Fechas</th>
                  <th>Duración (Est/Real)</th>
                  <th>Costo (Est/Real)</th>
                </tr>
              </thead>
              <tbody>
                {obra.tareas.map(tarea => (
                  <tr 
                    key={tarea.idTarea} 
                    onClick={() => navigate(`/cliente/obras/${obra.idObra}/tareas/${tarea.idTarea}`)} 
                    style={{cursor: 'pointer'}}
                  >
                    <td>
                      <span className="fw-semibold text-dark">{tarea.nombre}</span>
                      {tarea.descripcion && (
                        <>
                          <br/>
                          <small className="text-muted" style={{display:'block', maxWidth:'250px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}} title={tarea.descripcion}>
                            {tarea.descripcion}
                          </small>
                        </>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${ESTADO_TAREA_BADGE[tarea.estado?.toLowerCase()] ?? 'text-bg-secondary'} fw-normal`}>
                        {tarea.estado}
                      </span>
                    </td>
                    <td style={{minWidth: '150px'}}>
                      <div className="d-flex align-items-center gap-2">
                        <div className="progress flex-grow-1" style={{ height: '6px' }}>
                          <div className="progress-bar bg-dark" style={{ width: `${tarea.porcentaje}%` }}></div>
                        </div>
                        <span className="small fw-bold">{tarea.porcentaje}%</span>
                      </div>
                    </td>
                    <td className="small text-muted">
                      <div><i className="bi bi-calendar-event me-1"></i> {tarea.fechaInicio || '-'}</div>
                      <div><i className="bi bi-calendar-check me-1"></i> {tarea.fechaFin || '-'}</div>
                    </td>
                    <td className="small">
                      <div className={tarea.duracionReal > tarea.duracionEstimada ? 'text-danger fw-bold' : ''}>
                        <span title="Estimada">{tarea.duracionEstimada}d</span> / <span title="Real">{tarea.duracionReal}d</span>
                        {tarea.duracionReal > tarea.duracionEstimada && (
                          <i className="bi bi-exclamation-triangle ms-1" title="Atrasada"></i>
                        )}
                      </div>
                    </td>
                    <td className="small">
                      <div className="text-muted"><span title="Estimado">E:</span> {formatMoneda(tarea.costoEstimado)}</div>
                      <div className={tarea.costoReal > tarea.costoEstimado ? 'text-danger fw-bold' : ''}>
                        <span title="Real">R:</span> {formatMoneda(tarea.costoReal)}
                      </div>
                    </td>
                  </tr>
                ))}
                {obra.tareas.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">No hay tareas registradas para esta obra.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViewObraPage
