import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { obtenerResumenCliente } from '../services/clienteservice'

// ---------- Constantes ----------
// Color del badge según el estado devuelto por la API (cualquier otro valor usa el gris)
const ESTADO_OBRA_BADGE = {
  'En ejecución': 'badge-obra-en-ejecucion',
  Atrasada: 'text-bg-danger',
  Pausa: 'text-bg-warning',
  Finalizada: 'text-bg-secondary',
}

const FILTROS_OBRAS_VACIOS = { texto: '', estado: '', mesAnio: '' }
const FILTROS_REC_VACIOS = { texto: '', estado: '', mesAnio: '' }

// ---------- Helpers ----------
const normalizar = (texto) => texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
const capitalizar = (t) => t.charAt(0).toUpperCase() + t.slice(1)
// "2026-10-02" -> Date local (new Date('2026-10-02') corre un día atrás en Argentina por UTC)
const parseFecha = (iso) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

const fechaCorta = (iso) => parseFecha(iso).toLocaleDateString('es-AR')
const fechaLarga = (iso) =>
  parseFecha(iso).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const diasRestantes = (iso) => {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((parseFecha(iso) - hoy) / 86400000)
}

const etiquetaPlazo = (dias) => {
  if (dias < 0) return `Vencido hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  return `En ${dias} días`
}

const estadoRecBadge = (estado) => {
  if (estado === 'pendiente') return 'badge-recordatorio-pendiente'
  if (estado === 'atrasado') return 'badge-recordatorio-atrasado'
  if (estado === 'completado') return 'text-bg-success'
  return 'text-bg-secondary'
}

// La fecha de fin solo corresponde a una obra terminada: en ejecución todavía no tiene
const mostrarFechaFin = (obra) => obra.estado === 'Finalizada' && Boolean(obra.fechaFinReal)

// ---------- Tarjeta de obra ----------
function TarjetaObra({ obra }) {
  return (
    <Link 
      to={`/cliente/obras/${obra.idObra}`}
      className="card cliente-obra-card h-100 text-decoration-none text-body"
    >
      <div className="card-body p-4 d-flex flex-column">
        <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
          <span className="text-muted small">Obra N.º {obra.idObra}</span>
          <div className="text-end">
            <span className={`badge ${ESTADO_OBRA_BADGE[obra.estado] ?? 'text-bg-secondary'} rounded-pill px-3 py-2 fw-normal`}>
              {obra.estado}
            </span>
            <div className={`${obra.estadoTiempo === 'Atrasada' ? 'text-danger' : 'text-muted'} mt-1`} style={{ fontSize: '0.75rem', fontWeight: '600' }}>
              {obra.estadoTiempo === 'Atrasada'
                ? `Atrasada por ${obra.diasAtraso} día${obra.diasAtraso === 1 ? '' : 's'}`
                : obra.estadoTiempo}
            </div>
          </div>
        </div>

        <h5 className="card-title fw-bold mb-1">{obra.nombre || `Obra N.º ${obra.idObra}`}</h5>
        <p className="text-muted small mb-3">{obra.direccion}</p>

        <ul className="list-unstyled small text-muted mb-4">
          <li className="mb-1">
            <i className="bi bi-map me-2"></i>
            Lote {obra.nroLote}
          </li>
          <li className="mb-1">
            <i className="bi bi-person-workspace me-2"></i>
            Arquitecto: {obra.arquitecto}
          </li>
          {obra.fechaInicioEstimada && (
            <li className="mb-1">
              <i className="bi bi-calendar-event me-2"></i>
              Inicio estimado: {fechaCorta(obra.fechaInicioEstimada)}
            </li>
          )}
          {obra.fechaInicioReal && <li className="mb-1"><i className="bi bi-play-circle me-2"></i>Inicio real: {fechaCorta(obra.fechaInicioReal)}</li>}
          {mostrarFechaFin(obra) && (
            <li>
              <i className="bi bi-calendar-check me-2"></i>
              Finalización real: {fechaCorta(obra.fechaFinReal)}
            </li>
          )}
        </ul>

        <div className="mt-auto">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="small text-muted">Avance general</span>
            <span className="small fw-bold">{obra.porcentaje}%</span>
          </div>
          <div className="progress" style={{ height: '8px' }}>
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
      </div>
    </Link>
  )
}

// ---------- Ventana emergente del recordatorio ----------
function ModalRecordatorio({ recordatorio, onCerrar }) {
  // Cerrar con Escape y bloquear el scroll de la página mientras está abierto
  useEffect(() => {
    const alTeclear = (e) => e.key === 'Escape' && onCerrar()
    document.addEventListener('keydown', alTeclear)
    document.body.classList.add('modal-open')
    return () => {
      document.removeEventListener('keydown', alTeclear)
      document.body.classList.remove('modal-open')
    }
  }, [onCerrar])

  const dias = diasRestantes(recordatorio.fecha)
  const mostrarPlazo = ['pendiente', 'atrasado'].includes(recordatorio.estado)

  return (
    <>
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-recordatorio"
        onClick={onCerrar}
      >
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content rounded-3 border-0 shadow">
            <div className="modal-header border-0 pb-0">
              <div>
                <span className={`badge ${estadoRecBadge(recordatorio.estado)} rounded-pill fw-normal mb-2`}>
                  {capitalizar(recordatorio.estado)}
                </span>
                <h5 className="modal-title" id="titulo-recordatorio">
                  Recordatorio
                </h5>
              </div>
              <button type="button" className="btn-close" aria-label="Cerrar" onClick={onCerrar} autoFocus></button>
            </div>

            <div className="modal-body">
              <p className="fs-6">{recordatorio.descripcion}</p>

              <dl className="row small mb-0">
                <dt className="col-4 text-muted fw-normal">Fecha</dt>
                <dd className="col-8">
                  {capitalizar(fechaLarga(recordatorio.fecha))}
                  {mostrarPlazo && (
                    <span className={dias <= 3 ? 'text-danger fw-semibold' : 'text-muted'}> · {etiquetaPlazo(dias)}</span>
                  )}
                </dd>

                <dt className="col-4 text-muted fw-normal">Obra</dt>
                <dd className="col-8">
                  N.º {recordatorio.idObra} · {recordatorio.direccionCompleta || recordatorio.direccion}
                  {recordatorio.nroLote != null && <div className="text-muted">Lote {recordatorio.nroLote}</div>}
                </dd>


                <dt className="col-4 text-muted fw-normal">N.º de recordatorio</dt>
                <dd className="col-8 mb-0">{recordatorio.idRecordatorio}</dd>
              </dl>
            </div>

            <div className="modal-footer border-0 pt-0">
              <Link to={`/cliente/obras/${recordatorio.idObra}`} className="btn btn-sm btn-outline-dark rounded-pill px-4">
                Ver obra
              </Link>

            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>
  )
}

// ---------- Página ----------
function ClientePage() {
  const { usuario } = useOutletContext()
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState(null)
  const [filtrosObras, setFiltrosObras] = useState(FILTROS_OBRAS_VACIOS)
  const [filtrosRec, setFiltrosRec] = useState(FILTROS_REC_VACIOS)
  const [seleccionado, setSeleccionado] = useState(null)

  const cerrarModal = useCallback(() => setSeleccionado(null), [])

  useEffect(() => {
    let activo = true
    obtenerResumenCliente()
      .then((resumen) => activo && setDatos(resumen))
      .catch((e) => activo && setError(e.message))
    return () => {
      activo = false
    }
  }, [usuario?.id])

  // Las opciones fijas de estado
  const estadosObra = ['No Inicio', 'En ejecución', 'Atrasada', 'Pausa', 'Finalizada']
  const estadosRec = ['pendiente', 'atrasado', 'completado']

  // CU Buscar obra: texto libre (nombre, dirección, lote, arquitecto), estado y año de inicio
  const obras = useMemo(() => {
    const texto = normalizar(filtrosObras.texto.trim())
    return (datos?.obras ?? [])
      .filter((o) =>
        normalizar(`${o.nombre} ${o.direccion} ${o.nroLote} ${o.arquitecto} ${o.idObra}`).includes(texto)
      )
      .filter((o) => !filtrosObras.estado || o.estado === filtrosObras.estado)
      .filter((o) => !filtrosObras.mesAnio || o.fechaInicioEstimada?.startsWith(filtrosObras.mesAnio))
  }, [datos, filtrosObras])

  // CU Visualizar recordatorios: texto libre, estado y fecha. Por fecha, más próximo primero.
  const recordatorios = useMemo(() => {
    const texto = normalizar(filtrosRec.texto.trim())
    return (datos?.recordatorios ?? [])
      .filter((r) =>
        normalizar(`${r.descripcion} ${r.direccion} lote ${r.nroLote} obra ${r.idObra} ${r.arquitecto} ${r.fecha} ${fechaCorta(r.fecha)}`).includes(texto)
      )
      .filter((r) => !filtrosRec.estado || r.estado === filtrosRec.estado)
      .filter((r) => !filtrosRec.mesAnio || r.fecha?.startsWith(filtrosRec.mesAnio))
      .sort((a, b) => {
        if (a.estado !== b.estado) return a.estado === 'pendiente' ? -1 : 1
        return parseFecha(a.fecha) - parseFecha(b.fecha)
      })
  }, [datos, filtrosRec])

  if (error) {
    return <div className="alert alert-danger">No pudimos cargar tus obras: {error}</div>
  }
  if (!datos) {
    return <p className="text-muted">Cargando tus obras...</p>
  }

  const { cliente } = datos
  const hayFiltrosObras = JSON.stringify(filtrosObras) !== JSON.stringify(FILTROS_OBRAS_VACIOS)
  const hayFiltrosRec = JSON.stringify(filtrosRec) !== JSON.stringify(FILTROS_REC_VACIOS)
  const cambiarObras = (campo) => (e) => setFiltrosObras((f) => ({ ...f, [campo]: e.target.value }))
  const cambiarRec = (campo) => (e) => setFiltrosRec((f) => ({ ...f, [campo]: e.target.value }))

  return (
    <div className="container-fluid px-0 cliente-dashboard">
      <header className="cliente-dashboard__bienvenida">
        <p className="cliente-dashboard__eyebrow">Área de cliente</p>
        <h1>Bienvenido, {cliente.nombre}</h1>
        <p className="text-muted mb-0 small">Este es el estado actual de tus obras.</p>
      </header>

      <div className="row g-4">
        {/* ================= Buscar obra ================= */}
        <div className="col-12 col-xl-8">
          <h2 className="cliente-dashboard__titulo-seccion">Tus obras</h2>

          <div className="card rounded-3 shadow-sm border-0 mb-3">
            <div className="card-body p-3">
              <div className="row g-2">
                <div className="col-12 col-md-6">
                  <input
                    type="search"
                    className="form-control form-control-sm"
                    placeholder="Buscar por dirección, lote o arquitecto"
                    aria-label="Buscar obra por dirección, lote o arquitecto"
                    value={filtrosObras.texto}
                    onChange={cambiarObras('texto')}
                  />
                </div>
                <div className="col-6 col-md-3">
                  <select
                    className="form-select form-select-sm"
                    aria-label="Filtrar por estado"
                    value={filtrosObras.estado}
                    onChange={cambiarObras('estado')}
                  >
                    <option value="">Todos los estados</option>
                    {estadosObra.map((e) => (
                      <option key={e} value={e}>
                        {e}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6 col-md-3">
                  <input
                    type="month"
                    className="form-control form-control-sm text-muted"
                    aria-label="Filtrar por mes y año"
                    value={filtrosObras.mesAnio}
                    onChange={cambiarObras('mesAnio')}
                  />
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-2 small text-muted" aria-live="polite">
                <span>
                  {obras.length} de {datos.obras.length} {datos.obras.length === 1 ? 'obra' : 'obras'}
                </span>
                {hayFiltrosObras && (
                  <button type="button" className="btn btn-sm btn-link text-dark p-0" onClick={() => setFiltrosObras(FILTROS_OBRAS_VACIOS)}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          {obras.length === 0 ? (
            <div className="card rounded-3 border-0 shadow-sm">
              <div className="card-body p-4 text-center text-muted">
                {datos.obras.length === 0
                  ? 'Todavía no tenés obras asociadas. Tu arquitecto las va a vincular a tu cuenta.'
                  : 'Ninguna obra coincide con la búsqueda.'}
              </div>
            </div>
          ) : (
            <div className="row row-cols-1 row-cols-md-2 g-3 pe-2" style={{ maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', overflowX: 'hidden' }}>
              {obras.map((obra) => (
                <div key={obra.idObra} className="col">
                  <TarjetaObra obra={obra} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= Visualizar recordatorios ================= */}
        <div className="col-12 col-xl-4">
          <h2 className="cliente-dashboard__titulo-seccion">Recordatorios</h2>

          <div className="card rounded-3 shadow-sm border-0 mb-3">
            <div className="card-body p-3">
              <input
                type="search"
                className="form-control form-control-sm mb-2"
                placeholder="Buscar por descripción, obra o fecha"
                aria-label="Buscar recordatorio"
                value={filtrosRec.texto}
                onChange={cambiarRec('texto')}
              />
              <div className="row g-2">
                <div className="col-6">
                  <select className="form-select form-select-sm" aria-label="Filtrar por estado" value={filtrosRec.estado} onChange={cambiarRec('estado')}>
                    <option value="">Todos los estados</option>
                    {estadosRec.map((e) => (
                      <option key={e} value={e}>
                        {capitalizar(e)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-6">
                  <input
                    type="month"
                    className="form-control form-control-sm text-muted"
                    aria-label="Filtrar por mes y año"
                    value={filtrosRec.mesAnio}
                    onChange={cambiarRec('mesAnio')}
                  />
                </div>

              </div>
              <div className="d-flex justify-content-between align-items-center mt-2 small text-muted" aria-live="polite">
                <span>
                  {recordatorios.length} de {datos.recordatorios.length}
                </span>
                {hayFiltrosRec && (
                  <button type="button" className="btn btn-sm btn-link text-dark p-0" onClick={() => setFiltrosRec(FILTROS_REC_VACIOS)}>
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="card rounded-3 shadow-sm border-0">
            <div className="list-group list-group-flush rounded-3" style={{ maxHeight: 'calc(100vh - 360px)', overflowY: 'auto' }}>
              {recordatorios.length > 0 ? (
                recordatorios.map((rec) => {
                  const dias = diasRestantes(rec.fecha)
                  const urgente = ['pendiente', 'atrasado'].includes(rec.estado) && dias <= 3
                  return (
                    <button
                      key={rec.idRecordatorio}
                      type="button"
                      className="list-group-item list-group-item-action p-3 text-start"
                      onClick={() => setSeleccionado(rec)}
                      aria-haspopup="dialog"
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                        <strong className="text-dark text-truncate">{rec.descripcion}</strong>
                        <span className={`badge ${estadoRecBadge(rec.estado)} rounded-pill fw-normal`}>
                          {capitalizar(rec.estado)}
                        </span>
                      </div>
                      <div className="text-muted small text-truncate">
                        <i className="bi bi-geo-alt me-2"></i>
                        {rec.direccion}
                      </div>
                      <div className={`small ${urgente ? 'text-danger fw-semibold' : 'text-muted'}`}>
                        <i className="bi bi-calendar-event me-2"></i>
                        {fechaCorta(rec.fecha)}
                        {['pendiente', 'atrasado'].includes(rec.estado) && ` · ${etiquetaPlazo(dias)}`}
                      </div>
                    </button>
                  )
                })
              ) : (
                <div className="list-group-item p-4 text-center text-muted">
                  {datos.recordatorios.length === 0
                    ? 'No tenés recordatorios.'
                    : 'Ningún recordatorio coincide con la búsqueda.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {seleccionado && <ModalRecordatorio recordatorio={seleccionado} onCerrar={cerrarModal} />}
    </div>
  )
}

export default ClientePage
