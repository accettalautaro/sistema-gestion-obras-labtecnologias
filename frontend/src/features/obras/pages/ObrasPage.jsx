import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { listarObras } from '../services/obrasService.js'
import '../../../styles/Obras.css'

const FORMULARIO_VACIO = { 'id-cliente': '', 'id-arquitecto': '', nrolote: '', Estado: 'En ejecución' }

function nombrePersona(persona) { return `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim() }
function porcentajeNumero(valor) { return Number.parseFloat(String(valor ?? '0').replace('%', '')) || 0 }

function ObrasPage() {
	const { esArquitecto } = useOutletContext()
	const [busqueda, setBusqueda] = useState('')
	const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
	const [obraEditando, setObraEditando] = useState(null)
	const [aviso, setAviso] = useState(null)
	const { datos, cargando, error } = useFetch(listarObras)

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
		setFormulario({ 'id-cliente': String(obra['id-cliente'] ?? ''), 'id-arquitecto': String(obra['id-arquitecto'] ?? ''), nrolote: String(obra.nrolote ?? ''), Estado: obra.Estado ?? 'En ejecución' })
	}
	const nuevaObra = () => { setObraEditando(null); setFormulario(FORMULARIO_VACIO) }
	const cancelarEdicion = () => nuevaObra()
	const guardar = (event) => {
		event.preventDefault()
		setAviso({ titulo: obraEditando === null ? 'Obra no creada' : 'Cambios no guardados', mensaje: 'El formulario es una vista previa. En esta entrega las obras se leen desde los JSON y no se guardan cambios.' })
	}
	const eliminar = (obra) => setAviso({ titulo: 'Obra no eliminada', mensaje: `La obra #${obra['id-obra']} sigue en el archivo JSON. La eliminación estará disponible cuando se implemente el backend.` })

	return <section className="obras-page">
		<header className="obras-page__header"><div><p className="obras-page__eyebrow">Área privada</p><h1>Gestión de obras</h1><p>Consultá la relación entre cliente, arquitecto y lote.</p></div><div className="obras-page__header-acciones"><span className="obras-page__count">{obras.length} {obras.length === 1 ? 'obra' : 'obras'}</span><Link className="btn btn-sm btn-outline-secondary" to="/principal/terrenos">Consultar terrenos</Link></div></header>
		<div className="alert alert-info" role="note"><strong>Modo consulta:</strong> la información se lee desde los archivos JSON. Crear, editar o eliminar estará disponible cuando se conecte el backend.</div>
		<div className="obras-page__workspace">
			<section className="obras-page__listado" aria-labelledby="obras-listado-titulo"><div className="obras-page__toolbar"><h2 id="obras-listado-titulo">Obras registradas</h2><label className="obras-page__busqueda"><span className="visually-hidden">Buscar obras</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por cliente, arquitecto, lote o estado" /></label></div>
				<div className="table-responsive"><table className="table table-hover align-middle obras-page__tabla"><thead><tr><th>Obra</th><th>Cliente</th><th>Arquitecto</th><th>Lote</th><th>Estado</th><th>Avance</th><th><span className="visually-hidden">Acciones</span></th></tr></thead><tbody>
					{obrasFiltradas.map((obra) => {
						const cliente = buscarPorId(clientes, 'id-cliente', obra['id-cliente'])
						const arquitecto = buscarPorId(arquitectos, 'id-arquitecto', obra['id-arquitecto'])
						const avance = porcentajeNumero(obra.porcentaje)
						return <tr key={obra['id-obra']}><td><div className="obras-page__nombre">#{obra['id-obra']}</div><Link className="btn btn-sm obras-page__boton-seguimiento" to={`/principal/obras/${obra['id-obra']}/avance`}>Ver seguimiento</Link></td><td>{cliente ? nombrePersona(cliente) : `Cliente #${obra['id-cliente']}`}</td><td>{arquitecto ? nombrePersona(arquitecto) : `Arquitecto #${obra['id-arquitecto']}`}</td><td><Link to={`/principal/terrenos/${obra.nrolote}`}>{obra.nrolote ?? '—'}</Link></td><td><span className="obras-page__estado-badge">{obra.Estado}</span></td><td><div className="obras-page__avance"><span>{avance}%</span><div className="progress" role="progressbar" aria-label={`Avance de obra ${obra['id-obra']}`} aria-valuenow={avance} aria-valuemin="0" aria-valuemax="100"><div className="progress-bar" style={{ width: `${avance}%` }} /></div></div></td><td><div className="obras-page__acciones"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(obra)}>Editar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(obra)}>Eliminar</button></div></td></tr>
					})}
					{!obrasFiltradas.length && <tr><td colSpan="7" className="obras-page__vacio">{busqueda ? 'No hay coincidencias.' : 'Todavía no hay obras registradas.'}</td></tr>}
				</tbody></table></div>
			</section>
			<section className="obras-page__formulario" aria-labelledby="obra-form-titulo"><div className="obras-page__form-header"><div><h2 id="obra-form-titulo">{obraEditando === null ? 'Nueva obra' : `Editar obra #${obraEditando}`}</h2><p>Vista previa del formulario; los datos no se guardan.</p></div>{obraEditando !== null && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={nuevaObra}>Nueva obra</button>}</div>
				<form onSubmit={guardar}><div className="obras-page__campos">
					<label>Cliente<select className="form-select" value={formulario['id-cliente']} onChange={(event) => setFormulario({ ...formulario, 'id-cliente': event.target.value })} required><option value="">Seleccioná un cliente</option>{clientes.map((cliente) => <option key={cliente['id-cliente']} value={cliente['id-cliente']}>{nombrePersona(cliente)}</option>)}</select></label>
					<label>Arquitecto<select className="form-select" value={formulario['id-arquitecto']} onChange={(event) => setFormulario({ ...formulario, 'id-arquitecto': event.target.value })} required><option value="">Seleccioná un arquitecto</option>{arquitectos.map((arquitecto) => <option key={arquitecto['id-arquitecto']} value={arquitecto['id-arquitecto']}>{nombrePersona(arquitecto)}</option>)}</select></label>
					<label>Lote<select className="form-select" value={formulario.nrolote} onChange={(event) => setFormulario({ ...formulario, nrolote: event.target.value })} required><option value="">Seleccioná un lote</option>{lotes.map((lote) => <option key={lote.nrolote} value={lote.nrolote}>Lote {lote.nrolote}</option>)}</select></label>
					<label>Estado<select className="form-select" value={formulario.Estado} onChange={(event) => setFormulario({ ...formulario, Estado: event.target.value })} required><option>Planificada</option><option>En ejecución</option><option>Finalizada</option><option>Suspendida</option></select></label>
				</div><div className="obras-page__form-actions">{obraEditando !== null && <button className="btn btn-outline-secondary" type="button" onClick={cancelarEdicion}>Cancelar</button>}<button className="btn btn-dark" type="submit">{obraEditando === null ? 'Crear obra' : 'Guardar cambios'}</button></div></form>
			</section>
		</div>
		{aviso && <div className="obras-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) setAviso(null) }}><section className="obras-page__modal" role="dialog" aria-modal="true" aria-labelledby="obra-modal-titulo"><div className="obras-page__modal-cabecera"><h2 id="obra-modal-titulo">{aviso.titulo}</h2><button className="obras-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setAviso(null)}>×</button></div><p>{aviso.mensaje}</p><div className="obras-page__modal-acciones"><button className="btn btn-dark" type="button" onClick={() => setAviso(null)}>Entendido</button></div></section></div>}
	</section>
}

export default ObrasPage
