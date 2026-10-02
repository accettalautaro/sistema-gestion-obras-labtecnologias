import { useState, useEffect } from 'react'
import { Link, useParams, useOutletContext } from 'react-router-dom'
import { listarDatosPropietarios } from '../services/propietariosService.js'

const FORMULARIO_VACIO = { dniUnico: '', nombre: '', apellido: '', dni: '', estadocivil: '', porcentaje: '', nroescritura: '' }

function PropietariosPage() {
	const { esArquitecto } = useOutletContext() || {}
	const { nrolote } = useParams()
	
	const [datos, setDatos] = useState(null)
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState(null)
	
	const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
	const [editando, setEditando] = useState(null)
	const [aviso, setAviso] = useState(null)

	useEffect(() => {
		let activo = true
		setCargando(true)
		listarDatosPropietarios(nrolote)
			.then(res => {
				if (activo) {
					setDatos(res)
					// Si hay escrituras, pre-seleccionar la primera
					if (res.escriturasLote.length > 0) {
						setFormulario(prev => ({ ...prev, nroescritura: String(res.escriturasLote[0].nroescritura) }))
					}
					setCargando(false)
				}
			})
			.catch(err => {
				if (activo) {
					setError(err)
					setCargando(false)
				}
			})
		return () => { activo = false }
	}, [nrolote])

	if (esArquitecto === null || esArquitecto === undefined) return <p className="obras-page__estado" role="status">Verificando acceso...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para arquitectos.</div>
	if (cargando) return <p className="obras-page__estado" role="status">Cargando datos...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const { lote, escriturasLote, propietariosLote, personasUnicas } = datos

	const manejarSeleccionExistente = (e) => {
		const dniSel = e.target.value
		if (!dniSel) {
			setFormulario(prev => ({ ...prev, dniUnico: '', nombre: '', apellido: '', dni: '', estadocivil: '' }))
			return
		}
		const persona = personasUnicas.find(p => String(p.dni) === String(dniSel))
		if (persona) {
			setFormulario(prev => ({
				...prev,
				dniUnico: persona.dni,
				nombre: persona.nombre,
				apellido: persona.apellido,
				dni: persona.dni,
				estadocivil: persona.estadocivil
			}))
		}
	}

	const editar = (prop) => {
		setEditando(prop['id-propietario'])
		setFormulario({
			dniUnico: '', // Al editar no usamos el selector
			nombre: prop.nombre ?? '',
			apellido: prop.apellido ?? '',
			dni: prop.dni ?? '',
			estadocivil: prop.estadocivil ?? '',
			porcentaje: String(prop.porcentaje ?? '').replace('%', ''),
			nroescritura: String(prop.nroescritura ?? '')
		})
	}

	const nuevo = () => {
		setEditando(null)
		setFormulario({
			...FORMULARIO_VACIO,
			nroescritura: escriturasLote.length > 0 ? String(escriturasLote[0].nroescritura) : ''
		})
	}

	const guardar = (e) => {
		e.preventDefault()
		setAviso({
			titulo: editando === null ? 'Propietario no agregado' : 'Cambios no guardados',
			mensaje: 'El formulario es una vista previa. En esta entrega los datos se leen desde los JSON y no se guardan cambios.'
		})
	}

	const eliminar = (prop) => {
		setAviso({
			titulo: 'Propietario no eliminado',
			mensaje: `El propietario ${prop.nombre} sigue registrado en el archivo JSON. La eliminación estará disponible cuando se implemente el backend.`
		})
	}

	return (
		<section className="obras-page">
			<header className="obras-page__header">
				<div>
					<p className="obras-page__eyebrow">Terreno · Lote {lote.nrolote}</p>
					<h1>Gestión de propietarios</h1>
					<p>Administrá las personas asociadas a las escrituras de este lote.</p>
				</div>
				<div className="obras-page__header-acciones">
					<Link className="btn btn-sm btn-outline-secondary" to={`/principal/terrenos/${lote.nrolote}`}>Volver al terreno</Link>
				</div>
			</header>
			
			<div className="alert alert-info" role="note">
				<strong>Modo consulta:</strong> la información se lee desde los archivos JSON. Crear, editar o eliminar estará disponible cuando se conecte el backend.
			</div>

			<div className="obras-page__workspace">
				<section className="obras-page__listado" aria-labelledby="props-listado-titulo">
					<div className="obras-page__toolbar">
						<h2 id="props-listado-titulo">Propietarios registrados</h2>
					</div>
					<div className="table-responsive">
						<table className="table table-hover align-middle obras-page__tabla">
							<thead>
								<tr>
									<th>Escritura</th>
									<th>Nombre</th>
									<th>DNI</th>
									<th>Estado civil</th>
									<th>Porcentaje</th>
									<th><span className="visually-hidden">Acciones</span></th>
								</tr>
							</thead>
							<tbody>
								{propietariosLote.map((prop) => (
									<tr key={prop['id-propietario']}>
										<td>N.º {prop.nroescritura}</td>
										<td className="obras-page__nombre fw-semibold">{prop.nombre} {prop.apellido}</td>
										<td>{prop.dni}</td>
										<td>{prop.estadocivil}</td>
										<td><span className="badge text-bg-dark">{prop.porcentaje}</span></td>
										<td>
											<div className="obras-page__acciones">
												<button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(prop)}>Editar</button>
												<button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(prop)}>Eliminar</button>
											</div>
										</td>
									</tr>
								))}
								{propietariosLote.length === 0 && (
									<tr><td colSpan="6" className="text-center py-4 text-muted">No hay propietarios registrados para este lote.</td></tr>
								)}
							</tbody>
						</table>
					</div>
				</section>

				<section className="obras-page__formulario" aria-labelledby="prop-form-titulo">
					<div className="obras-page__form-header">
						<div>
							<h2 id="prop-form-titulo">{editando === null ? 'Agregar propietario' : `Editar propietario`}</h2>
							<p>Vista previa del formulario.</p>
						</div>
						{editando !== null && (
							<button className="btn btn-sm btn-outline-secondary" type="button" onClick={nuevo}>Nuevo</button>
						)}
					</div>
					<form onSubmit={guardar}>
						<div className="obras-page__campos">
							<label>
								Escritura asociada
								<input 
									className="form-control"
									value={formulario.nroescritura ? `Escritura N.º ${formulario.nroescritura}` : 'Sin escrituras'} 
									disabled
									readOnly
								/>
							</label>

							{editando === null && (
								<label className="mb-2 p-2 bg-light rounded border">
									<strong>¿Persona existente?</strong>
									<select className="form-select mt-1" value={formulario.dniUnico} onChange={manejarSeleccionExistente}>
										<option value="">-- Cargar una persona nueva --</option>
										{personasUnicas.map(per => (
											<option key={per.dni} value={per.dni}>{per.nombre} {per.apellido} (DNI: {per.dni})</option>
										))}
									</select>
									<small className="text-muted d-block mt-1">Seleccioná a alguien que ya sea propietario de otro lote, o dejalo en blanco para registrar a alguien nuevo.</small>
								</label>
							)}

							<label>
								Nombre
								<input className="form-control" value={formulario.nombre} onChange={(e) => setFormulario({...formulario, nombre: e.target.value})} required />
							</label>
							<label>
								Apellido
								<input className="form-control" value={formulario.apellido} onChange={(e) => setFormulario({...formulario, apellido: e.target.value})} required />
							</label>
							<label>
								DNI
								<input className="form-control" type="text" inputMode="numeric" value={formulario.dni} onChange={(e) => setFormulario({...formulario, dni: e.target.value})} required />
							</label>
							<label>
								Estado Civil
								<input className="form-control" value={formulario.estadocivil} onChange={(e) => setFormulario({...formulario, estadocivil: e.target.value})} />
							</label>
							<label>
								Porcentaje (%)
								<input className="form-control" type="number" min="0" max="100" step="any" value={formulario.porcentaje} onChange={(e) => setFormulario({...formulario, porcentaje: e.target.value})} required />
							</label>
						</div>
						<div className="obras-page__form-actions mt-3">
							{editando !== null && <button className="btn btn-outline-secondary" type="button" onClick={nuevo}>Cancelar</button>}
							<button className="btn btn-dark" type="submit" disabled={escriturasLote.length === 0}>{editando === null ? 'Agregar propietario' : 'Guardar cambios'}</button>
						</div>
					</form>
				</section>
			</div>

			{aviso && (
				<div className="obras-page__modal-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget) setAviso(null) }}>
					<section className="obras-page__modal" role="dialog" aria-modal="true" aria-labelledby="prop-modal-titulo">
						<div className="obras-page__modal-cabecera">
							<h2 id="prop-modal-titulo">{aviso.titulo}</h2>
							<button className="obras-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setAviso(null)}>×</button>
						</div>
						<p>{aviso.mensaje}</p>
						<div className="obras-page__modal-acciones">
							<button className="btn btn-dark" type="button" onClick={() => setAviso(null)}>Entendido</button>
						</div>
					</section>
				</div>
			)}
		</section>
	)
}

export default PropietariosPage
