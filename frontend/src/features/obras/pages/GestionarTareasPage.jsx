import { useEffect, useRef, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { listarObras } from '../services/obrasService.js'
import { listarTareas, guardarTareasObra } from '../services/tareasService.js'
import { NOMENCLADOR_TAREAS } from '../data/nomencladorTareas.js'
import Volver from '../../../shared/components/Volver.jsx'
import '../../../styles/GestionarTareas.css'

const NUEVA = { nombre: '', descripcion: '', estado: 'sin comenzar', 'fecha-inicio-estimada': '', 'fecha-fin-estimada': '', 'fecha-inicio-real': '', 'fecha-fin-real': '', 'costo-estimado': '', 'costo-real': '' }
const codigo = (id) => String(id ?? '').replaceAll('_', '-')
const normalizarNombre = (nombre) => String(nombre ?? '').trim().toLocaleLowerCase('es')

function codigoNomenclador(tarea, tareas) {
	const id = String(tarea['id-tarea'] ?? '')
	if (!id.includes('_')) return NOMENCLADOR_TAREAS.find((item) => normalizarNombre(item.nombre) === normalizarNombre(tarea.nombre))?.codigo ?? codigo(id)

	const idPadre = id.split('_')[0]
	const padre = tareas.find((item) => String(item['id-tarea']) === idPadre)
	const categoria = NOMENCLADOR_TAREAS.find((item) => normalizarNombre(item.nombre) === normalizarNombre(padre?.nombre))
	const indiceSubtarea = categoria?.subtareas.findIndex((nombre) => normalizarNombre(nombre) === normalizarNombre(tarea.nombre)) ?? -1
	return indiceSubtarea >= 0 ? `${categoria.codigo}-${indiceSubtarea + 1}` : codigo(id)
}

function GestionarTareasPage() {
	const { esArquitecto } = useOutletContext()
	const { id } = useParams()
	const [tareasBase, setTareasBase] = useState([])
	const [obras, setObras] = useState([])
	const [error, setError] = useState('')
	const [cargando, setCargando] = useState(true)
	const [formulario, setFormulario] = useState(NUEVA)
	const [idPadreSubtarea, setIdPadreSubtarea] = useState('')
	const [editando, setEditando] = useState(null)
	const [aviso, setAviso] = useState('')
	const contadorIdsTemporales = useRef(0)

	useEffect(() => {
		Promise.all([listarTareas(), listarObras()]).then(([tareas, datos]) => {
			setTareasBase(tareas)
			setObras(datos.obras)
		}).catch((e) => setError(e.message)).finally(() => setCargando(false))
	}, [])

	const obra = obras.find((item) => String(item['id-obra']) === String(id))
	const tareas = tareasBase.filter((tarea) => String(tarea['id-obra']) === String(id))
	const etapas = tareas.filter((tarea) => !String(tarea['id-tarea']).includes('_')).sort((a, b) => Number(a['id-tarea']) - Number(b['id-tarea']))
	const etapaSeleccionada = etapas.find((etapa) => String(etapa['id-tarea']) === idPadreSubtarea)
	const esSubtareaEnFormulario = Boolean(idPadreSubtarea || String(editando ?? '').includes('_'))
	const nomencladorSeleccionado = NOMENCLADOR_TAREAS.find((item) => item.nombre === etapaSeleccionada?.nombre)
	const subtareasDisponibles = nomencladorSeleccionado?.subtareas ?? []
	const guardarLista = async (lista, mensaje) => {
		try {
			const guardadas = await guardarTareasObra(id, lista)
			setTareasBase((actuales) => [...actuales.filter((tarea) => String(tarea['id-obra']) !== String(id)), ...guardadas])
			setAviso(mensaje)
		} catch (motivo) { setError(motivo.message || 'No se pudieron guardar los cambios en la base de datos.') }
	}

	if (esArquitecto === null) return <p role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p role="status">Cargando tareas de la obra...</p>
	if (error && !obra) return <div className="alert alert-danger" role="alert">{error}</div>
	if (!obra) return <div className="alert alert-warning" role="alert">No se encontró la obra seleccionada. <Volver to="/principal/obras">Volver a obras</Volver></div>

	const iniciarEdicion = (tarea) => { setEditando(String(tarea['id-tarea'])); setIdPadreSubtarea(''); setFormulario({ ...NUEVA, ...tarea, 'costo-estimado': tarea['costo-estimado'] ?? '', 'costo-real': tarea['costo-real'] ?? '' }) }
	const cancelar = () => { setEditando(null); setIdPadreSubtarea(''); setFormulario(NUEVA) }
	const guardarFormulario = (event) => {
		event.preventDefault()
		const nombreTarea = formulario.nombre.trim()
		if (!nombreTarea) { setAviso('Ingresá el nombre de la tarea.'); return }
		const idTemporal = `nueva-${crypto.randomUUID()}-${++contadorIdsTemporales.current}`
		const tareaId = editando ?? (idPadreSubtarea ? `${idPadreSubtarea}_${idTemporal}` : idTemporal)
		if (!editando && tareas.some((tarea) => String(tarea['id-tarea']) === String(tareaId))) { setAviso('Esta tarea ya está incluida en la obra.'); return }
		const datos = { ...formulario, nombre: nombreTarea, 'id-obra': Number(id), 'id-tarea': tareaId }
		if (editando) {
			guardarLista(tareas.map((tarea) => String(tarea['id-tarea']) === editando ? datos : tarea), 'Tarea modificada.')
		} else {
			guardarLista([...tareas, datos], 'Tarea agregada. Completá sus datos y guardá los cambios.')
		}
		cancelar()
	}
	const seleccionarPadre = (valor) => { setIdPadreSubtarea(valor); setFormulario((actual) => ({ ...actual, nombre: '' })) }
	const eliminar = (tarea) => {
		const idTarea = String(tarea['id-tarea'])
		const eliminados = idTarea.includes('_') ? [idTarea] : tareas.filter((item) => String(item['id-tarea']).startsWith(`${idTarea}_`)).map((item) => String(item['id-tarea'])).concat(idTarea)
		guardarLista(tareas.filter((item) => !eliminados.includes(String(item['id-tarea']))), eliminados.length > 1 ? 'Etapa y subtareas eliminadas.' : 'Tarea eliminada.')
	}

	return <section className="gestionar-tareas">
		<header className="gestionar-tareas__header"><div><p className="gestionar-tareas__eyebrow">Gestión de obras / Obra #{id}</p><h1>Gestionar tareas</h1><p>Lote {obra.nrolote ?? '—'} · {obra.Estado}</p></div><Volver to="/principal/obras">Volver a gestión de obras</Volver></header>
		{error && <div className="alert alert-danger" role="alert">{error}</div>}{aviso && <div className="alert alert-success" role="status">{aviso}<button type="button" className="btn-close float-end" aria-label="Cerrar" onClick={() => setAviso('')} /></div>}
		<div className="gestionar-tareas__grid">
			<section className="gestionar-tareas__panel gestionar-tareas__panel--alta"><div className="gestionar-tareas__panel-titulo"><div><p className="gestionar-tareas__eyebrow">Nomenclador de obra</p><h2>{editando ? 'Modificar tarea' : 'Dar de alta una tarea'}</h2></div></div>
				<form className="gestionar-tareas__form" onSubmit={guardarFormulario}>
					{editando ? <label>Nombre<input className="form-control" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} maxLength="150" required /></label> : <>
						<label>Tarea<select className="form-select" value={idPadreSubtarea} onChange={(e) => seleccionarPadre(e.target.value)}><option value="">Crear tarea principal</option>{etapas.map((etapa) => <option key={etapa['id-tarea']} value={etapa['id-tarea']}>{codigoNomenclador(etapa, tareas)} · {etapa.nombre}</option>)}</select><small>Elegí una tarea ya agregada a esta obra para crear una subtarea.</small></label>
						<label>{idPadreSubtarea ? 'Subtarea' : 'Tarea'}<select className="form-select" value={formulario.nombre} onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })} required><option value="">Seleccioná {idPadreSubtarea ? 'una subtarea' : 'una tarea'}</option>{idPadreSubtarea ? subtareasDisponibles.map((nombre, indice) => <option key={nombre} value={nombre}>{nomencladorSeleccionado.codigo}-{indice + 1} · {nombre}</option>) : NOMENCLADOR_TAREAS.map((item) => <option key={item.codigo} value={item.nombre}>{item.codigo} · {item.nombre}</option>)}</select></label>
					</>}
					<label>Descripción<input className="form-control" value={formulario.descripcion ?? ''} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} maxLength="300" /></label>
					<p className="text-muted small mb-0">{esSubtareaEnFormulario ? 'El porcentaje de avance de la subtarea se actualiza desde Seguimiento de obra.' : 'El avance de la tarea se calcula a partir de sus subtareas; una tarea sin subtareas aporta 0% al avance de la obra.'}</p>
					<div className="gestionar-tareas__fechas"><label>Fecha de inicio estimada<input className="form-control" type="date" value={formulario['fecha-inicio-estimada']} onChange={(e) => setFormulario({ ...formulario, 'fecha-inicio-estimada': e.target.value })} /></label><label>Fecha de fin estimada<input className="form-control" type="date" min={formulario['fecha-inicio-estimada'] || undefined} value={formulario['fecha-fin-estimada']} onChange={(e) => setFormulario({ ...formulario, 'fecha-fin-estimada': e.target.value })} /></label></div>
					<p className="text-muted small mb-0">{esSubtareaEnFormulario ? 'La duración de la subtarea se calcula con sus fechas estimadas; su duración real se calcula con las fechas registradas al iniciar y completar.' : 'La duración estimada de la tarea es la suma de las duraciones estimadas de sus subtareas. La duración real se calcula entre el inicio de la primera y el fin de la última subtarea, al completar la tarea.'}</p>
					{esSubtareaEnFormulario ? <div className="gestionar-tareas__fechas"><label>Costo estimado<input className="form-control" type="number" min="0" step="0.01" value={formulario['costo-estimado']} onChange={(e) => setFormulario({ ...formulario, 'costo-estimado': e.target.value })} /></label></div> : <p className="text-muted small mb-0">El costo estimado de la tarea es la suma de los costos estimados de sus subtareas; no se carga en la tarea.</p>}
					<div className="gestionar-tareas__acciones">{editando && <button className="btn btn-outline-secondary" type="button" onClick={cancelar}>Cancelar</button>}<button className="btn gestionar-tareas__boton" type="submit">{editando ? 'Guardar modificación' : 'Guardar tarea'}</button></div>
				</form>
			</section>
		</div>
		<section className="gestionar-tareas__panel gestionar-tareas__listado"><div className="gestionar-tareas__panel-titulo"><div><p className="gestionar-tareas__eyebrow">Obra #{id}</p><h2>Tareas asignadas <span className="gestionar-tareas__contador">{tareas.length}</span></h2></div></div>
			{etapas.length ? <div className="gestionar-tareas__etapas">{etapas.map((etapa) => {
				const subtareas = tareas.filter((tarea) => String(tarea['id-tarea']).startsWith(`${etapa['id-tarea']}_`))
				const filaTarea = (tarea) => <div className="gestionar-tareas__tarea" key={tarea['id-tarea']}><div><span>{codigoNomenclador(tarea, tareas)}</span><strong>{tarea.nombre}</strong><small>Avance: {tarea.porcentaje}</small></div><div className="gestionar-tareas__acciones"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => iniciarEdicion(tarea)}>Modificar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(tarea)}>Eliminar</button></div></div>
				if (!subtareas.length) return <article className="gestionar-tareas__etapa" key={etapa['id-tarea']}>{filaTarea(etapa)}</article>
				return <details className="gestionar-tareas__etapa gestionar-tareas__desplegable" key={etapa['id-tarea']}>
					<summary className="gestionar-tareas__etapa-cabecera"><div><span>{codigoNomenclador(etapa, tareas)}</span><h3>{etapa.nombre}</h3><small>{subtareas.length} {subtareas.length === 1 ? 'subtarea' : 'subtareas'}</small></div><span className="gestionar-tareas__indicador">Ver subtareas⌄</span></summary>
					<div className="gestionar-tareas__subtareas">{subtareas.map(filaTarea)}</div>
					<div className="gestionar-tareas__acciones gestionar-tareas__acciones-etapa"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => iniciarEdicion(etapa)}>Modificar tarea</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(etapa)}>Eliminar tarea y subtareas</button></div>
				</details>
			})}</div> : <p className="gestionar-tareas__vacio">Esta obra todavía no tiene tareas.</p>}
		</section>
	</section>
}

export default GestionarTareasPage
