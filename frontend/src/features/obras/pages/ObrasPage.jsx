import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { actualizarObra, crearObra, eliminarObra as borrarObra, listarObras } from '../services/obrasService.js'
import '../../../styles/Obras.css'

const FORMULARIO_VACIO = { 'id-cliente': '', 'id-arquitecto': '', 'id-lote': '', 'fecha-inicio': '', 'fecha-fin': '', descripcion: '', Estado: 'En ejecución' }

function nombrePersona(persona) { return `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim() }
function porcentajeNumero(valor) { return Number.parseFloat(String(valor ?? '0').replace('%', '')) || 0 }

function ObrasPage() {
	const { esArquitecto } = useOutletContext()
	const [busqueda, setBusqueda] = useState('')
	const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
	const [obraEditando, setObraEditando] = useState(null)
	const [aviso, setAviso] = useState(null)
	const [datosActualizados, setDatosActualizados] = useState(null)
	const [guardando, setGuardando] = useState(false)
	const { datos: datosIniciales, cargando, error } = useFetch(listarObras)
	const datos = datosActualizados ?? datosIniciales

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
		setFormulario({
			'id-cliente': String(obra['id-cliente'] ?? ''),
			'id-arquitecto': String(obra['id-arquitecto'] ?? ''),
			'id-lote': String(obra['id-lote'] ?? ''),
			'fecha-inicio': obra['fecha-inicio'] ?? '',
			'fecha-fin': obra['fecha-fin'] ?? '',
			descripcion: obra.descripcion ?? '',
			Estado: obra.Estado ?? 'En ejecución',
		})
	}
	const nuevaObra = () => { setObraEditando(null); setFormulario(FORMULARIO_VACIO) }
	const cancelarEdicion = () => nuevaObra()
	const guardar = async (event) => {
		event.preventDefault()
		if (!formulario['id-lote']) {
			setAviso({ titulo: 'Falta seleccionar un lote', mensaje: 'Toda obra debe tener un lote asociado. Si todavía no existe, primero tenés que crear el lote.' })
			return
		}
		if (!formulario['fecha-inicio'] || !formulario['fecha-fin']) {
			setAviso({ titulo: 'Faltan fechas', mensaje: 'Tenés que completar la fecha de inicio y la fecha de finalización de la obra.' })
			return
		}
		if (formulario['fecha-fin'] < formulario['fecha-inicio']) {
			setAviso({ titulo: 'Revisá las fechas', mensaje: 'La fecha de finalización no puede ser anterior a la fecha de inicio.' })
			return
		}
		setGuardando(true)
		try {
			if (obraEditando === null) await crearObra(formulario)
			else await actualizarObra(obraEditando, formulario)
			setDatosActualizados(await listarObras())
			setAviso({ titulo: obraEditando === null ? 'Obra creada' : 'Obra actualizada', mensaje: 'Los cambios se guardaron en la base de datos.' })
			nuevaObra()
		} catch (e) {
			setAviso({ titulo: 'No se pudo guardar la obra', mensaje: e.message })
		} finally {
			setGuardando(false)
		}
	}
	const eliminar = async (obra) => {
		if (!window.confirm(`¿Eliminar la obra #${obra['id-obra']}?`)) return
		try {
			await borrarObra(obra['id-obra'])
			setDatosActualizados(await listarObras())
			setAviso({ titulo: 'Obra eliminada', mensaje: `La obra #${obra['id-obra']} se eliminó de la base de datos.` })
		} catch (e) {
			setAviso({ titulo: 'No se pudo eliminar la obra', mensaje: e.message })
		}
	}

	return <section className="obras-page">
		<header className="obras-page__header"><div><p className="obras-page__eyebrow">Área privada</p><h1>Gestión de obras</h1><p>Consultá la relación entre cliente, arquitecto y lote.</p></div><div className="obras-page__header-acciones"><span className="obras-page__count">{obras.length} {obras.length === 1 ? 'obra' : 'obras'}</span><Link className="btn btn-sm btn-outline-secondary" to="/principal/terrenos">Consultar terrenos</Link></div></header>
		<div className="obras-page__workspace">
			<section className="obras-page__listado" aria-labelledby="obras-listado-titulo"><div className="obras-page__toolbar"><h2 id="obras-listado-titulo">Obras registradas</h2><label className="obras-page__busqueda"><span className="visually-hidden">Buscar obras</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por cliente, arquitecto, lote o estado" /></label></div>
				<div className="table-responsive"><table className="table table-hover align-middle obras-page__tabla"><thead><tr><th>Obra</th><th>Cliente</th><th>Arquitecto</th><th>Lote</th><th>Estado</th><th>Avance</th><th><span className="visually-hidden">Acciones</span></th></tr></thead><tbody>
					{obrasFiltradas.map((obra) => {
						const cliente = buscarPorId(clientes, 'id-cliente', obra['id-cliente'])
						const arquitecto = buscarPorId(arquitectos, 'id-arquitecto', obra['id-arquitecto'])
						const avance = porcentajeNumero(obra.porcentaje)
						return <tr key={obra['id-obra']}><td><div className="obras-page__nombre">#{obra['id-obra']}</div><div className="d-flex flex-wrap gap-1 mt-1"><Link className="btn btn-sm obras-page__boton-seguimiento" to={`/principal/obras/${obra['id-obra']}/avance`}>Ver seguimiento</Link><Link className="btn btn-sm btn-outline-secondary" to={`/principal/obras/${obra['id-obra']}/tareas`}>Gestionar tareas</Link></div></td><td>{cliente ? nombrePersona(cliente) : `Cliente #${obra['id-cliente']}`}</td><td>{arquitecto ? nombrePersona(arquitecto) : `Arquitecto #${obra['id-arquitecto']}`}</td><td><Link to={`/principal/terrenos/${obra.nrolote}`}>{obra.nrolote ?? '—'}</Link></td><td><span className="obras-page__estado-badge">{obra.Estado}</span></td><td><div className="obras-page__avance"><span>{avance}%</span><div className="progress" role="progressbar" aria-label={`Avance de obra ${obra['id-obra']}`} aria-valuenow={avance} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar" style={{ width: `${avance}%` }} /></div></div></td><td><div className="obras-page__acciones"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(obra)}>Editar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(obra)}>Eliminar</button></div></td></tr>
					})}
					{!obrasFiltradas.length && <tr><td colSpan="7" className="obras-page__vacio">{busqueda ? 'No hay coincidencias.' : 'Todavía no hay obras registradas.'}</td></tr>}
				</tbody></table></div>
			</section>
			<section className="obras-page__formulario" aria-labelledby="obra-form-titulo"><div className="obras-page__form-header"><div><h2 id="obra-form-titulo">{obraEditando === null ? 'Nueva obra' : `Editar obra #${obraEditando}`}</h2><p>Los cambios se guardan en el sistema.</p></div>{obraEditando !== null && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={nuevaObra}>Nueva obra</button>}</div>
				<form onSubmit={guardar}><div className="obras-page__campos">
					<label>Cliente<select className="form-select" value={formulario['id-cliente']} onChange={(event) => setFormulario({ ...formulario, 'id-cliente': event.target.value })} required><option value="">Seleccioná un cliente</option>{clientes.map((cliente) => <option key={cliente['id-cliente']} value={cliente['id-cliente']}>{nombrePersona(cliente)}</option>)}</select></label>
					<label>Arquitecto<select className="form-select" value={formulario['id-arquitecto']} onChange={(event) => setFormulario({ ...formulario, 'id-arquitecto': event.target.value })} required><option value="">Seleccioná un arquitecto</option>{arquitectos.map((arquitecto) => <option key={arquitecto['id-arquitecto']} value={arquitecto['id-arquitecto']}>{nombrePersona(arquitecto) || `Arquitecto #${arquitecto['id-arquitecto']}`}</option>)}</select></label>
					<label>Lote<select className="form-select" value={formulario['id-lote']} onChange={(event) => setFormulario({ ...formulario, 'id-lote': event.target.value })} required><option value="" disabled>Seleccioná un lote</option>{lotes.filter((lote) => !lote.idObra || String(lote.idObra) === String(obraEditando)).map((lote) => <option key={lote['id-lote']} value={lote['id-lote']}>Lote {lote.nrolote}</option>)}</select></label>
					<label>Estado<select className="form-select" value={formulario.Estado} onChange={(event) => setFormulario({ ...formulario, Estado: event.target.value })} required><option>Planificada</option><option>En ejecución</option><option>Finalizada</option><option>Suspendida</option></select></label>
					<label>Fecha de inicio<input className="form-control" type="date" value={formulario['fecha-inicio']} onChange={(event) => setFormulario({ ...formulario, 'fecha-inicio': event.target.value })} required /></label>
					<label>Fecha de fin<input className="form-control" type="date" min={formulario['fecha-inicio'] || undefined} value={formulario['fecha-fin']} onChange={(event) => setFormulario({ ...formulario, 'fecha-fin': event.target.value })} required /></label>
					<label>Descripción<input className="form-control" value={formulario.descripcion} onChange={(event) => setFormulario({ ...formulario, descripcion: event.target.value })} maxLength={500} /></label>
				</div><div className="obras-page__form-actions">{obraEditando !== null && <button className="btn btn-outline-secondary" type="button" onClick={cancelarEdicion}>Cancelar</button>}<button className="btn btn-dark" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : obraEditando === null ? 'Crear obra' : 'Guardar cambios'}</button></div></form>
			</section>
		</div>
		{aviso && <div className="obras-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) setAviso(null) }}><section className="obras-page__modal" role="dialog" aria-modal="true" aria-labelledby="obra-modal-titulo"><div className="obras-page__modal-cabecera"><h2 id="obra-modal-titulo">{aviso.titulo}</h2><button className="obras-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setAviso(null)}>×</button></div><p>{aviso.mensaje}</p><div className="obras-page__modal-acciones"><button className="btn btn-dark" type="button" onClick={() => setAviso(null)}>Entendido</button></div></section></div>}
	</section>
}

export default ObrasPage
