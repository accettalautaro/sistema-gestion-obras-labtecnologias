import { useEffect, useMemo, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { listarObras } from '../services/obrasService.js'
import { listarNomenclador, listarTareas, guardarTareasObra } from '../services/tareasService.js'
import Volver from '../../../shared/components/Volver.jsx'
import '../../../styles/GestionarTareas.css'

const NUEVA = { nombre: '', descripcion: '', estado: '', porcentaje: '0', 'fecha-inicio': '', 'fecha-fin': '', 'duracion-estimada': '', 'duracion-real': '', 'costo-estimado': '', 'costo-real': '' }
const codigo = (id) => String(id ?? '').replaceAll('_', '-')

function GestionarTareasPage() {
	const { esArquitecto } = useOutletContext()
	const { id } = useParams()
	const [tareasBase, setTareasBase] = useState([])
	const [nomenclador, setNomenclador] = useState([])
	const [obras, setObras] = useState([])
	const [error, setError] = useState('')
	const [cargando, setCargando] = useState(true)
	const [formulario, setFormulario] = useState(NUEVA)
	const [idCatalogo, setIdCatalogo] = useState('')
	const [editando, setEditando] = useState(null)
	const [aviso, setAviso] = useState('')

	useEffect(() => {
		Promise.all([listarTareas(), listarNomenclador(), listarObras()]).then(([tareas, plantillas, datos]) => {
			setTareasBase(tareas)
			setNomenclador(plantillas)
			setObras(datos.obras)
		}).catch((e) => setError(e.message)).finally(() => setCargando(false))
	}, [])

	const obra = obras.find((item) => String(item['id-obra']) === String(id))
	const tareas = tareasBase.filter((tarea) => String(tarea['id-obra']) === String(id))
	const catalogo = useMemo(() => {
		const tareasCatalogo = nomenclador.filter((tarea) => String(tarea['id-obra']) === '1')
		return [...tareasCatalogo, { 'id-tarea': 'GENERAL', nombre: 'GENERAL' }]
	}, [nomenclador])
	const etapas = tareas.filter((tarea) => !String(tarea['id-tarea']).includes('_')).sort((a, b) => Number(a['id-tarea']) - Number(b['id-tarea']))
	const guardarLista = (lista, mensaje) => {
		try {
			guardarTareasObra(id, lista)
			setTareasBase((actuales) => [...actuales.filter((tarea) => String(tarea['id-obra']) !== String(id)), ...lista])
			setAviso(mensaje)
		} catch { setError('No se pudieron guardar los cambios en este navegador.') }
	}

	if (esArquitecto === null) return <p role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p role="status">Cargando tareas de la obra...</p>
	if (error && !obra) return <div className="alert alert-danger" role="alert">{error}</div>
	if (!obra) return <div className="alert alert-warning" role="alert">No se encontró la obra seleccionada. <Volver to="/principal/obras">Volver a obras</Volver></div>

	const iniciarEdicion = (tarea) => { setEditando(String(tarea['id-tarea'])); setIdCatalogo(''); setFormulario({ ...NUEVA, ...tarea, 'fecha-inicio': tarea['fecha-inicio'] || '', 'fecha-fin': tarea['fecha-fin'] || '', 'duracion-estimada': tarea['duracion-estimada'] ?? '', 'duracion-real': tarea['duracion-real'] ?? '', 'costo-estimado': tarea['costo-estimado'] ?? '', 'costo-real': tarea['costo-real'] ?? '', porcentaje: String(tarea.porcentaje ?? '').replace('%', '') }) }
	const cancelar = () => { setEditando(null); setIdCatalogo(''); setFormulario(NUEVA) }
	const guardarFormulario = (event) => {
		event.preventDefault()
		const tareaId = editando ?? idCatalogo
		if (!tareaId) { setAviso('Seleccioná un nombre del nomenclador.'); return }
		if (!editando && tareas.some((tarea) => String(tarea['id-tarea']) === String(tareaId))) { setAviso('Esta tarea ya está incluida en la obra.'); return }
		const nombreTarea = editando ? tareas.find((tarea) => String(tarea['id-tarea']) === editando)?.nombre : catalogo.find((tarea) => String(tarea['id-tarea']) === String(idCatalogo))?.nombre
		const datos = { ...formulario, nombre: nombreTarea, 'id-obra': Number(id), porcentaje: formulario.porcentaje === '' ? '' : `${formulario.porcentaje}%`, 'id-tarea': tareaId }
		if (editando) {
			guardarLista(tareas.map((tarea) => String(tarea['id-tarea']) === editando ? datos : tarea), 'Tarea modificada.')
		} else {
			const esSubtarea = String(tareaId).includes('_')
			const etapaExiste = !esSubtarea || tareas.some((tarea) => String(tarea['id-tarea']) === String(tareaId).split('_')[0])
			if (!etapaExiste) { setAviso('Agregá primero la etapa nomenclada para poder incorporar esta subtarea.'); return }
			guardarLista([...tareas, datos], 'Tarea agregada. Completá sus datos y guardá los cambios.')
		}
		cancelar()
	}
	const seleccionarNomenclada = (valor) => {
		setIdCatalogo(valor)
		const plantilla = catalogo.find((tarea) => String(tarea['id-tarea']) === valor)
		setFormulario({ ...NUEVA, nombre: plantilla?.nombre ?? '' })
	}
	const eliminar = (tarea) => {
		const idTarea = String(tarea['id-tarea'])
		const eliminados = idTarea.includes('_') ? [idTarea] : tareas.filter((item) => String(item['id-tarea']).startsWith(`${idTarea}_`)).map((item) => String(item['id-tarea'])).concat(idTarea)
		guardarLista(tareas.filter((item) => !eliminados.includes(String(item['id-tarea']))), eliminados.length > 1 ? 'Etapa y subtareas eliminadas.' : 'Tarea eliminada.')
	}

	return <section className="gestionar-tareas">
		<header className="gestionar-tareas__header"><div><p className="gestionar-tareas__eyebrow">Gestión de obras / Obra #{id}</p><h1>Gestionar tareas</h1><p>Lote {obra.nrolote ?? '—'} · {obra.Estado}</p></div><Volver to="/principal/obras">Volver a gestión de obras</Volver></header>
		<div className="alert alert-info">Los cambios se guardan en este navegador y quedan disponibles al volver a entrar desde este dispositivo.</div>
		{error && <div className="alert alert-danger" role="alert">{error}</div>}{aviso && <div className="alert alert-success" role="status">{aviso}<button type="button" className="btn-close float-end" aria-label="Cerrar" onClick={() => setAviso('')} /></div>}
		<div className="gestionar-tareas__grid">
			<section className="gestionar-tareas__panel gestionar-tareas__panel--alta"><div className="gestionar-tareas__panel-titulo"><div><p className="gestionar-tareas__eyebrow">Nomenclador de obra</p><h2>{editando ? 'Modificar tarea' : 'Dar de alta una tarea'}</h2></div></div>
				<form className="gestionar-tareas__form" onSubmit={guardarFormulario}>
					<label>Nombre<select className="form-select" value={editando ? editando : idCatalogo} onChange={(e) => seleccionarNomenclada(e.target.value)} required disabled={Boolean(editando)}><option value="">Seleccionar nombre</option>{editando && <option value={editando}>{tareas.find((tarea) => String(tarea['id-tarea']) === editando)?.nombre}</option>}{catalogo.map((tarea) => { const esSubtarea = String(tarea['id-tarea']).includes('_'); const padre = esSubtarea ? String(tarea['id-tarea']).split('_')[0] : null; const etapaYaAgregada = !esSubtarea || tareas.some((item) => String(item['id-tarea']) === padre); const texto = tarea['id-tarea'] === 'GENERAL' ? 'GENERAL' : `${codigo(tarea['id-tarea'])} · ${tarea.nombre}`; return <option key={tarea['id-tarea']} value={tarea['id-tarea']} disabled={!etapaYaAgregada}>{texto}{!etapaYaAgregada ? ' · agregá primero la etapa' : ''}</option> })}</select>{!editando && <small>El nomenclador aporta el nombre. Completá los demás datos en este formulario.</small>}</label>
					<label>Descripción<input className="form-control" value={formulario.descripcion ?? ''} onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })} maxLength="300" /></label>
					<div className="gestionar-tareas__fechas"><label>Estado<select className="form-select" value={formulario.estado} onChange={(e) => setFormulario({ ...formulario, estado: e.target.value, ...(editando && e.target.value === 'finalizada' && Number.parseFloat(formulario.porcentaje || '0') < 100 ? { porcentaje: '100' } : {}) })} required><option value="">Seleccionar estado</option><option value="sin comenzar">Sin comenzar</option><option value="en ejecucion">En ejecución</option><option value="finalizada" disabled={!editando}>Finalizada</option><option value="suspendida">Suspendida</option></select></label>{editando && formulario.estado === 'finalizada' && <label>Avance (%)<input className="form-control" type="number" min="0" max="100" value={formulario.porcentaje} onChange={(e) => setFormulario({ ...formulario, porcentaje: e.target.value })} /></label>}</div>
					<div className="gestionar-tareas__fechas"><label>Fecha de inicio<input className="form-control" type="date" value={formulario['fecha-inicio']} onChange={(e) => setFormulario({ ...formulario, 'fecha-inicio': e.target.value })} /></label><label>Fecha de fin<input className="form-control" type="date" min={formulario['fecha-inicio'] || undefined} value={formulario['fecha-fin']} onChange={(e) => setFormulario({ ...formulario, 'fecha-fin': e.target.value })} /></label></div>
					{(!editando || !tareas.some((tarea) => String(tarea['id-tarea']).startsWith(`${editando}_`))) ? <div className="gestionar-tareas__fechas"><label>Duración estimada (días)<input className="form-control" type="number" min="0" value={formulario['duracion-estimada']} onChange={(e) => setFormulario({ ...formulario, 'duracion-estimada': e.target.value })} /></label>{editando && formulario.estado === 'finalizada' && <label>Duración real (días)<input className="form-control" type="number" min="0" value={formulario['duracion-real']} onChange={(e) => setFormulario({ ...formulario, 'duracion-real': e.target.value })} /></label>}</div> : <p>La duración de esta tarea se calcula sumando las duraciones de sus subtareas.</p>}
					<div className="gestionar-tareas__fechas"><label>Costo estimado<input className="form-control" type="number" min="0" step="0.01" value={formulario['costo-estimado']} onChange={(e) => setFormulario({ ...formulario, 'costo-estimado': e.target.value })} /></label></div>
					<div className="gestionar-tareas__acciones">{editando && <button className="btn btn-outline-secondary" type="button" onClick={cancelar}>Cancelar</button>}<button className="btn gestionar-tareas__boton" type="submit">{editando ? 'Guardar modificación' : 'Guardar tarea'}</button></div>
				</form>
			</section>
		</div>
		<section className="gestionar-tareas__panel gestionar-tareas__listado"><div className="gestionar-tareas__panel-titulo"><div><p className="gestionar-tareas__eyebrow">Obra #{id}</p><h2>Tareas asignadas <span className="gestionar-tareas__contador">{tareas.length}</span></h2></div></div>
			{etapas.length ? <div className="gestionar-tareas__etapas">{etapas.map((etapa) => {
				const subtareas = tareas.filter((tarea) => String(tarea['id-tarea']).startsWith(`${etapa['id-tarea']}_`))
				const filaTarea = (tarea) => <div className="gestionar-tareas__tarea" key={tarea['id-tarea']}><div><span>{codigo(tarea['id-tarea'])}</span><strong>{tarea.nombre}</strong>{tarea['fecha-inicio'] && <small>{tarea['fecha-inicio']}{tarea['fecha-fin'] ? ` → ${tarea['fecha-fin']}` : ''}</small>}</div><div className="gestionar-tareas__acciones"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => iniciarEdicion(tarea)}>Modificar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(tarea)}>Eliminar</button></div></div>
				if (!subtareas.length) return <article className="gestionar-tareas__etapa" key={etapa['id-tarea']}>{filaTarea(etapa)}</article>
				return <details className="gestionar-tareas__etapa gestionar-tareas__desplegable" key={etapa['id-tarea']}>
					<summary className="gestionar-tareas__etapa-cabecera"><div><span>{codigo(etapa['id-tarea'])}</span><h3>{etapa.nombre}</h3><small>{subtareas.length} {subtareas.length === 1 ? 'subtarea' : 'subtareas'}</small></div><span className="gestionar-tareas__indicador">Ver subtareas⌄</span></summary>
					<div className="gestionar-tareas__subtareas">{subtareas.map(filaTarea)}</div>
					<div className="gestionar-tareas__acciones gestionar-tareas__acciones-etapa"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => iniciarEdicion(etapa)}>Modificar tarea</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(etapa)}>Eliminar tarea y subtareas</button></div>
				</details>
			})}</div> : <p className="gestionar-tareas__vacio">Esta obra todavía no tiene tareas. Agregá una desde el nomenclador.</p>}
		</section>
	</section>
}

export default GestionarTareasPage
