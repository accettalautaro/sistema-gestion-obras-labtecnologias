import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { obtenerDetalleLote } from '../services/loteService'

function ModalPropietario({ propietario, onCerrar }) {
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclear)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.classList.remove('modal-open')
    }
  }, [onCerrar])

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={onCerrar}
      >
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content rounded-3 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <h5 className="modal-title fw-bold">
                Datos del Propietario
              </h5>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} autoFocus></button>
            </div>
            <div className="modal-body p-4">
              <div className="d-flex align-items-center mb-4">
                <div className="bg-light text-dark rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '60px', height: '60px'}}>
                  <i className="bi bi-person fs-1"></i>
                </div>
                <div>
                  <h4 className="mb-0 fw-bold">{propietario.nombre} {propietario.apellido}</h4>
                  <span className="text-muted small">DNI: {propietario.dni}</span>
                </div>
              </div>

              <ul className="list-group list-group-flush">
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted">Estado Civil</span>
                  <span className="fw-medium">{propietario.estadoCivil}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center px-0">
                  <span className="text-muted">Porcentaje de Dominio</span>
                  <span className="badge text-bg-dark rounded-pill fs-6">{propietario.porcentaje}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}

function ViewLotePage() {
  const { nrolote } = useParams()
  const navigate = useNavigate()
  const [lote, setLote] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [propietarioSeleccionado, setPropietarioSeleccionado] = useState(null)

  useEffect(() => {
    let activo = true
    setLoading(true)
    obtenerDetalleLote(nrolote)
      .then((data) => {
        if (activo) {
          setLote(data)
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
  }, [nrolote])

  if (loading) return <div className="p-4 text-muted">Cargando detalles del lote...</div>
  if (error) return <div className="p-4 alert alert-danger">Error: {error}</div>
  if (!lote) return <div className="p-4 alert alert-warning">Lote no encontrado.</div>

  return (
    <div className="container-fluid px-0 pb-5">
      <div className="mb-4 d-flex align-items-center gap-3">
        <button onClick={() => navigate(-1)} className="btn btn-sm btn-outline-secondary rounded-circle" style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="bi bi-arrow-left"></i>
        </button>
        <div>
          <h4 className="fw-bold mb-1">Lote N.º {lote.nroLote}</h4>
          <p className="text-muted mb-0 small">{lote.direccionCompleta}</p>
        </div>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4">
              <h6 className="text-muted mb-4 fw-bold">DATOS DE UBICACIÓN Y MENSURA</h6>
              
              <div className="mb-4">
                <label className="text-muted small d-block mb-1">Dirección Completa</label>
                <div className="d-flex align-items-center">
                  <i className="bi bi-geo-alt fs-4 me-3 text-secondary"></i>
                  <span className="fs-6 fw-medium">{lote.direccionCompleta}</span>
                </div>
              </div>

              {lote.mensura ? (
                <div className="row g-3">
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <span className="d-block text-muted small mb-1">Largo</span>
                      <strong className="fs-5">{lote.mensura.largo}m</strong>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-light rounded-3 text-center border">
                      <span className="d-block text-muted small mb-1">Ancho</span>
                      <strong className="fs-5">{lote.mensura.ancho}m</strong>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="p-3 bg-dark text-white rounded-3 text-center">
                      <span className="d-block small mb-1 opacity-75">Área Total</span>
                      <strong className="fs-5">{lote.mensura.area}m²</strong>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-light border text-muted mt-3">
                  <i className="bi bi-info-circle me-2"></i> No hay datos de mensura registrados.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card border-0 shadow-sm rounded-3 h-100">
            <div className="card-body p-4 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="text-muted mb-0 fw-bold">DATOS DE ESCRITURA Y PROPIETARIOS</h6>
                {lote.escritura && (
                  <span className="badge bg-light text-dark border">
                    Escritura N.º {lote.escritura.nroEscritura}
                  </span>
                )}
              </div>

              {!lote.escritura ? (
                <div className="alert alert-light border text-muted flex-grow-1 d-flex flex-column justify-content-center align-items-center">
                  <i className="bi bi-file-earmark-x fs-1 mb-2 text-secondary"></i>
                  <span>No hay escritura registrada para este lote.</span>
                </div>
              ) : (
                <>
                  <p className="text-muted small mb-2">Propietarios vinculados a la escritura ({lote.propietarios.length}):</p>
                  <div className="list-group flex-grow-1" style={{ overflowY: 'auto', maxHeight: '350px' }}>
                    {lote.propietarios.map(prop => (
                      <button 
                        key={prop.idPropietario}
                        type="button"
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center p-3"
                        onClick={() => setPropietarioSeleccionado(prop)}
                      >
                        <div className="d-flex align-items-center">
                          <div className="bg-secondary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3" style={{width: '40px', height: '40px'}}>
                            <i className="bi bi-person text-dark"></i>
                          </div>
                          <div>
                            <div className="fw-semibold text-dark">{prop.nombre} {prop.apellido}</div>
                            <div className="small text-muted">DNI: {prop.dni}</div>
                          </div>
                        </div>
                        <i className="bi bi-chevron-right text-muted"></i>
                      </button>
                    ))}
                    {lote.propietarios.length === 0 && (
                      <div className="text-center text-muted py-4">No hay propietarios vinculados.</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {propietarioSeleccionado && (
        <ModalPropietario 
          propietario={propietarioSeleccionado} 
          onCerrar={() => setPropietarioSeleccionado(null)} 
        />
      )}
    </div>
  )
}

export default ViewLotePage
