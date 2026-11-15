import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { listarObras, crearObra, actualizarObra, eliminarObra } from '../services/obrasService.js'
import ConfirmacionEliminar from '../../../shared/components/ConfirmacionEliminar.jsx'
import '../../../styles/Obras.css'

const FORMULARIO_VACIO = { nombre: '', 'id-cliente': '', 'id-arquitecto': '', loteId: '', Descripcion: '', 'fecha-inicio-estimada': '', 'fecha-fin-estimada': '' }

function nombrePersona(persona) { return `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim() }
function porcentajeNumero(valor) { return Number.parseFloat(String(valor ?? '0').replace('%', '')) || 0 }
function claseEstadoObra(estado) {
	const normalizado = String(estado ?? '').toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
	if (normalizado.includes('cancel')) return 'obras-page__estado-badge--cancelada'
	if (normalizado.includes('paus') || normalizado.includes('suspend')) return 'obras-page__estado-badge--pausada'
	if (normalizado.includes('atras')) return 'obras-page__estado-badge--atrasada'
	if (normalizado.includes('ejecucion') || normalizado.includes('progreso')) return 'obras-page__estado-badge--activa'
	if (normalizado.includes('final') || normalizado.includes('complet')) return 'obras-page__estado-badge--finalizada'
	return 'obras-page__estado-badge--neutral'
}

function ObrasPage() {
	const { esArquitecto } = useOutletContext()
	const location = useLocation()
	const navigate = useNavigate()
	const [busqueda, setBusqueda] = useState('')
	const [formulario, setFormulario] = useState(() => location.state?.obraBorrador ?? FORMULARIO_VACIO)
	const [formularioAbierto, setFormularioAbierto] = useState(() => Boolean(location.state?.obraBorrador))
	const [obraEditando, setObraEditando] = useState(null)
	const [obraParaEliminar, setObraParaEliminar] = useState(null)
	const [eliminando, setEliminando] = useState(false)
	const [aviso, setAviso] = useState(null)
	const [version, setVersion] = useState(0)
	const [guardando, setGuardando] = useState(false)
	const [errorFormulario, setErrorFormulario] = useState('')
	const [errorMutacion, setErrorMutacion] = useState('')
	const { datos, cargando, error } = useFetch(listarObras, version)

	const abrirNuevaObra = () => {
		setObraEditando(null)
		setFormulario(FORMULARIO_VACIO)
		setErrorFormulario('')
		setErrorMutacion('')
		setFormularioAbierto(true)
	}
	const cerrarFormulario = () => {
		setFormularioAbierto(false)
		setObraEditando(null)
		setFormulario(FORMULARIO_VACIO)
		setErrorFormulario('')
		if (location.state?.obraBorrador) navigate(location.pathname, { replace: true, state: null })
	}

	useEffect(() => {
		if (!formularioAbierto) return
		const cerrarConEscape = (event) => {
			if (event.key === 'Escape' && !guardando) {
				setFormularioAbierto(false)
				setObraEditando(null)
				setFormulario(FORMULARIO_VACIO)
				setErrorFormulario('')
				if (location.state?.obraBorrador) navigate(location.pathname, { replace: true, state: null })
			}
		}
		window.addEventListener('keydown', cerrarConEscape)
		return () => window.removeEventListener('keydown', cerrarConEscape)
	}, [formularioAbierto, guardando, location.pathname, location.state, navigate])

	if (esArquitecto === null) return <p className="obras-page__estado" role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p className="obras-page__estado" role="status">Cargando obras...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const { obras = [], clientes = [], arquitectos = [], lotes = [] } = datos || {}
	const buscarPorId = (coleccion, campoId, id) => coleccion.find((item) => String(item[campoId]) === String(id))
	const obrasFiltradas = obras.filter((obra) => {
		const cliente = buscarPorId(clientes, 'id-cliente', obra['id-cliente'])
		const arquitecto = buscarPorId(arquitectos, 'id-arquitecto', obra['id-arquitecto'])
		return [obra['id-obra'], obra.Estado, obra.nrolote, nombrePersona(cliente), nombrePersona(arquitecto)]
			.some((valor) => String(valor ?? '').toLowerCase().includes(busqueda.trim().toLowerCase()))
	})

	const editar = (obra) => {
		setObraEditando(obra['id-obra'])
		setFormulario({ ...FORMULARIO_VACIO, nombre: obra.nombre ?? '', 'id-cliente': String(obra['id-cliente'] ?? ''), 'id-arquitecto': String(obra['id-arquitecto'] ?? ''), loteId: String(obra._loteId ?? ''), Descripcion: obra.Descripcion ?? '', 'fecha-inicio-estimada': obra['fecha-inicio-estimada'] ?? '', 'fecha-fin-estimada': obra['fecha-fin-estimada'] ?? '' })
		setErrorFormulario('')
		setErrorMutacion('')
		setFormularioAbierto(true)
	}
	const guardar = async (event) => {
		event.preventDefault()
		if (obraEditando === null && formulario.loteId === 'nuevo') {
			navigate('/principal/terrenos', { state: { obraPendiente: formulario } })
			return
		}
		setGuardando(true); setErrorFormulario(''); setErrorMutacion('')
		try {
			const entrada = { ...formulario, 'id-cliente': Number(formulario['id-cliente']), 'id-arquitecto': formulario['id-arquitecto'] ? Number(formulario['id-arquitecto']) : null, loteId: formulario.loteId ? Number(formulario.loteId) : null }
			if (obraEditando === null) await crearObra(entrada)
			else await actualizarObra(obraEditando, entrada)
			setVersion((actual) => actual + 1); cerrarFormulario()
		} catch (motivo) { setErrorFormulario(motivo.message || 'No se pudo guardar la obra.') }
		finally { setGuardando(false) }
	}
	const eliminar = async () => {
		if (!obraParaEliminar) return
		setEliminando(true)
		setErrorMutacion('')
		try { await eliminarObra(obraParaEliminar['id-obra']); setVersion((actual) => actual + 1); setObraParaEliminar(null) }
		catch (motivo) { setErrorMutacion(motivo.message || 'No se pudo eliminar la obra.'); setObraParaEliminar(null) }
		finally { setEliminando(false) }
	}

	return <section className="obras-page">
		<header className="obras-page__header"><div><p className="obras-page__eyebrow">Área privada</p><h1>Gestión de obras</h1><p>Consultá la relación entre cliente, arquitecto y lote.</p></div><div className="obras-page__header-acciones"><span className="obras-page__count">{obras.length} {obras.length === 1 ? 'obra' : 'obras'}</span><Link className="btn btn-sm btn-outline-secondary" to="/principal/terrenos">Consultar terrenos</Link></div></header>
		{errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}
		<div className="obras-page__workspace">
			<section className="obras-page__listado" aria-labelledby="obras-listado-titulo"><div className="obras-page__toolbar"><h2 id="obras-listado-titulo">Obras registradas</h2><label className="obras-page__busqueda"><span className="visually-hidden">Buscar obras</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por cliente, arquitecto, lote o estado" /></label></div>
				<div className="table-responsive"><table className="table table-hover align-middle obras-page__tabla"><thead><tr><th>Obra</th><th>Cliente</th><th>Arquitecto</th><th>Lote</th><th>Estado</th><th>Avance</th><th><span className="visually-hidden">Acciones</span></th></tr></thead><tbody>
					{obrasFiltradas.map((obra) => {
						const cliente = buscarPorId(clientes, 'id-cliente', obra['id-cliente'])
						const arquitecto = buscarPorId(arquitectos, 'id-arquitecto', obra['id-arquitecto'])
						const avance = porcentajeNumero(obra.porcentaje)
						const nombre = String(obra.nombre ?? '').trim()
						return <tr key={obra['id-obra']}><td><div className="obras-page__nombre">#{obra['id-obra']}{nombre && <span> · {nombre}</span>}</div><div className="obras-page__acciones-tarea"><Link className="btn btn-sm obras-page__boton-seguimiento" to={`/principal/obras/${obra['id-obra']}/avance`}>Ver seguimiento</Link><Link className="btn btn-sm btn-outline-secondary" to={`/principal/obras/${obra['id-obra']}/tareas`}>Gestionar tareas</Link></div></td><td>{cliente ? nombrePersona(cliente) : `Cliente #${obra['id-cliente']}`}</td><td>{arquitecto ? nombrePersona(arquitecto) : `Arquitecto #${obra['id-arquitecto']}`}</td><td><Link to={`/principal/terrenos/${obra.nrolote}`}>{obra.nrolote ?? '—'}</Link></td><td><span className={`obras-page__estado-badge ${claseEstadoObra(obra.Estado)}`}><span aria-hidden="true" />{obra.Estado}</span></td><td><div className="obras-page__avance"><span>{avance}%</span><div className="progress" role="progressbar" aria-label={`Avance de obra ${obra['id-obra']}`} aria-valuenow={avance} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar" style={{ width: `${avance}%` }} /></div></div></td><td><div className="obras-page__acciones"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(obra)}>Editar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setObraParaEliminar(obra)}>Eliminar</button></div></td></tr>
					})}
					{!obrasFiltradas.length && <tr><td colSpan="7" className="obras-page__vacio">{busqueda ? 'No hay coincidencias.' : 'Todavía no hay obras registradas.'}</td></tr>}
				</tbody></table></div>
				<div className="obras-page__listado-acciones"><button className="btn btn-dark" type="button" onClick={abrirNuevaObra}>Crear obra</button></div>
			</section>
		</div>
		{formularioAbierto && <div className="obras-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget && !guardando) cerrarFormulario() }}>
			<section className="obras-page__modal obras-page__modal--formulario" role="dialog" aria-modal="true" aria-labelledby="obra-form-titulo" aria-describedby="obra-form-ayuda">
				<div className="obras-page__modal-cabecera"><div><h2 id="obra-form-titulo">{obraEditando === null ? 'Nueva obra' : `Editar Obra #${obraEditando}`}</h2><p id="obra-form-ayuda">Los cambios se guardan en PostgreSQL.</p></div><button className="obras-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={cerrarFormulario} disabled={guardando}>×</button></div>
				<form onSubmit={guardar}><div className="obras-page__campos">
					<label>Nombre<input className="form-control" type="text" maxLength={150} value={formulario.nombre ?? ''} onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })} required /></label>
					<label>Cliente<select className="form-select" value={formulario['id-cliente']} onChange={(event) => setFormulario({ ...formulario, 'id-cliente': event.target.value })} required><option value="">Seleccioná un cliente</option>{clientes.map((cliente) => <option key={cliente['id-cliente']} value={cliente['id-cliente']}>{nombrePersona(cliente)}</option>)}</select></label>
					<label>Arquitecto<select className="form-select" value={formulario['id-arquitecto']} onChange={(event) => setFormulario({ ...formulario, 'id-arquitecto': event.target.value })} required><option value="">Seleccioná un arquitecto</option>{arquitectos.map((arquitecto) => <option key={arquitecto['id-arquitecto']} value={arquitecto['id-arquitecto']}>{nombrePersona(arquitecto)}</option>)}</select></label>
					<label>Lote<select className="form-select" value={formulario.loteId ?? ''} onChange={(event) => setFormulario({ ...formulario, loteId: event.target.value })} required><option value="">Seleccioná un lote</option>{lotes.map((lote) => <option key={lote.id} value={lote.id}>Lote {lote.nrolote}</option>)}{obraEditando === null && <option value="nuevo">Nuevo lote</option>}</select></label>
					<div className="form-text align-self-center">El estado se calcula desde el seguimiento de las tareas. Para pausar o reanudar, usá Seguimiento de obra.</div>
					<label>Fecha de inicio estimada<input className="form-control" type="date" value={formulario['fecha-inicio-estimada']} onChange={(event) => setFormulario({ ...formulario, 'fecha-inicio-estimada': event.target.value })} required /></label>
					<label>Fecha de fin estimada<input className="form-control" type="date" min={formulario['fecha-inicio-estimada'] || undefined} value={formulario['fecha-fin-estimada']} onChange={(event) => setFormulario({ ...formulario, 'fecha-fin-estimada': event.target.value })} required /></label>
					<label className="obras-page__campo-completo">Descripción<input className="form-control" value={formulario.Descripcion} onChange={(event) => setFormulario({ ...formulario, Descripcion: event.target.value })} /></label>
				</div>
				{errorFormulario && <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">{errorFormulario}</p>}
				<div className="obras-page__form-actions"><button className="btn btn-outline-secondary" type="button" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button><button className="btn btn-dark" type="submit" disabled={guardando || !formulario['id-cliente'] || !formulario['id-arquitecto'] || !formulario.loteId || !formulario['fecha-inicio-estimada'] || !formulario['fecha-fin-estimada']}>{guardando ? 'Guardando...' : obraEditando === null ? 'Crear obra' : 'Guardar cambios'}</button></div></form>
			</section>
		</div>}
		{aviso && <div className="obras-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) setAviso(null) }}><section className="obras-page__modal" role="dialog" aria-modal="true" aria-labelledby="obra-modal-titulo"><div className="obras-page__modal-cabecera"><h2 id="obra-modal-titulo">{aviso.titulo}</h2><button className="obras-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setAviso(null)}>×</button></div><p>{aviso.mensaje}</p><div className="obras-page__modal-acciones"><button className="btn btn-dark" type="button" onClick={() => setAviso(null)}>Entendido</button></div></section></div>}
		{obraParaEliminar && <ConfirmacionEliminar titulo="Eliminar obra" mensaje={`¿Querés eliminar la obra #${obraParaEliminar['id-obra']}?`} onCancelar={() => setObraParaEliminar(null)} onConfirmar={eliminar} eliminando={eliminando} />}
	</section>
}

export default ObrasPage
