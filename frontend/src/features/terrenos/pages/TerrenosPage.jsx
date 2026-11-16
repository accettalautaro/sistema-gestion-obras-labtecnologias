import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { listarTerrenos, crearTerreno, actualizarTerreno, eliminarTerreno } from '../services/terrenosService.js'
import { listarPersonasPropietarias } from '../services/propietariosService.js'
import { crearObra } from '../../obras/services/obrasService.js'
import Volver from '../../../shared/components/Volver.jsx'
import ConfirmacionEliminar from '../../../shared/components/ConfirmacionEliminar.jsx'
import { soloLetras, soloNumeros } from '../../../shared/utils/filtrosEntrada.js'
import '../../../styles/Terrenos.css'

function mostrar(valor, sufijo = '') {
	return valor !== undefined && valor !== null && String(valor).trim() !== '' ? `${valor}${sufijo}` : 'Sin información'
}

function TarjetaPendiente({ titulo, detalle, children, tituloAcento = false }) {
	return <section className="terrenos-page__panel">
		<div className={`terrenos-page__panel-titulo${tituloAcento ? ' terrenos-page__panel-titulo--acento' : ''}`}><div><h3>{titulo}</h3>{detalle && <p>{detalle}</p>}</div></div>
		{children}
	</section>
}

const PROPIETARIO_VACIO = { dniExistente: '', nombre: '', apellido: '', dni: '', estadoCivil: '', porcentaje: '' }
const FORMULARIO_TERRENO_VACIO = {
	nrolote: '', calle: '', altura: '', localidad: '', provincia: '', codpos: '', numeroEscritura: '',
	ancho: '', largo: '', propietarios: [{ ...PROPIETARIO_VACIO }],
}
const ESTADOS_CIVILES_PROPIETARIO = ['casado', 'soltero', 'viudo', 'divorciado']

function normalizarEstadoCivilPropietario(valor) {
	const estado = String(valor ?? '').trim().toLowerCase().replace(/\/a$/, '')
	return ESTADOS_CIVILES_PROPIETARIO.includes(estado) ? estado : ''
}

function sumarPorcentajesEnCentimos(propietarios) {
	return propietarios.reduce((total, propietario) => {
		const porcentaje = Number(propietario.porcentaje)
		return total + (Number.isFinite(porcentaje) ? Math.round(porcentaje * 100) : 0)
	}, 0)
}

const listarPropietariosSiSeCargaTerreno = (activo) => activo
	? listarPersonasPropietarias()
	: Promise.resolve([])

function TerrenosPage() {
	const contexto = useOutletContext() || {}
	const esArquitecto = contexto.esArquitecto
	const esCliente = contexto.esCliente
	const modoConsulta = esCliente || !esArquitecto
	const location = useLocation()
	const navigate = useNavigate()
	const { nrolote } = useParams()
	const [busqueda, setBusqueda] = useState('')
	const [obraPendiente] = useState(() => location.state?.obraPendiente ?? null)
	const [loteCreadoId, setLoteCreadoId] = useState(null)
	const [mostrarFormulario, setMostrarFormulario] = useState(() => Boolean(location.state?.obraPendiente))
	const [loteEditando, setLoteEditando] = useState(null)
	const [loteParaEliminar, setLoteParaEliminar] = useState(null)
	const [version, setVersion] = useState(0)
	const [guardando, setGuardando] = useState(false)
	const [eliminando, setEliminando] = useState(false)
	const [errorMutacion, setErrorMutacion] = useState('')
	const [formulario, setFormulario] = useState(FORMULARIO_TERRENO_VACIO)
	const {
		datos: personasPropietarias, cargando: cargandoPersonas, error: errorPersonas,
	} = useFetch(listarPropietariosSiSeCargaTerreno, mostrarFormulario && loteEditando === null)
	const { datos: lotes = [], cargando, error } = useFetch(listarTerrenos, version)
	const porcentajeTotalCentimos = sumarPorcentajesEnCentimos(formulario.propietarios)

	if (esArquitecto === undefined && esCliente === undefined) return <p className="terrenos-page__estado" role="status">Verificando acceso...</p>
	if (!esArquitecto && !esCliente) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas autorizadas.</div>
	if (cargando) return <p className="terrenos-page__estado" role="status">Cargando terrenos...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const terreno = nrolote ? lotes.find((lote) => String(lote.nrolote) === String(nrolote)) : null
	const lotesFiltrados = lotes.filter((lote) => {
		const direccion = lote.direcciones[0]
		return [lote.nrolote, direccion?.calle, direccion?.altura, direccion?.localidad, direccion?.provincia]
			.some((valor) => String(valor ?? '').toLowerCase().includes(busqueda.trim().toLowerCase()))
	})
	const destinoTerrenos = esCliente ? '/cliente' : '/principal/terrenos'
	const destinoVolver = destinoTerrenos
	const ocultarVolverDesdeGestion = esArquitecto && location.state?.desdeGestionTerrenos === true
	if (nrolote && !terreno) return <section className="terrenos-page"><div className="alert alert-warning">No se encontró el lote {nrolote}.</div><Volver to={destinoTerrenos}>{esCliente ? 'Volver a mis obras' : 'Volver a terrenos'}</Volver></section>

	const cambiarCampo = (event) => setFormulario((actual) => ({ ...actual, [event.target.name]: event.target.value }))
	const cambiarPropietario = (indice, campo, valor) => setFormulario((actual) => ({
		...actual,
		propietarios: actual.propietarios.map((propietario, actualIndice) => (
			actualIndice === indice ? { ...propietario, [campo]: valor } : propietario
		)),
	}))
	const seleccionarPropietarioExistente = (indice, event) => {
		const dni = event.target.value
		const persona = (personasPropietarias ?? []).find((item) => String(item.dni) === dni)
		setFormulario((actual) => ({
			...actual,
			propietarios: actual.propietarios.map((propietario, actualIndice) => (
				actualIndice === indice ? {
					...propietario,
					dniExistente: dni,
					nombre: persona?.nombre ?? '',
					apellido: persona?.apellido ?? '',
					dni: persona?.dni ?? '',
					estadoCivil: normalizarEstadoCivilPropietario(persona?.estadocivil),
				} : propietario
			)),
		}))
	}
	const agregarPropietario = () => setFormulario((actual) => ({
		...actual, propietarios: [...actual.propietarios, { ...PROPIETARIO_VACIO }],
	}))
	const quitarPropietario = (indice) => setFormulario((actual) => ({
		...actual, propietarios: actual.propietarios.filter((_, actualIndice) => actualIndice !== indice),
	}))
	const iniciarEdicionLote = (lote) => {
		const direccion = lote.direcciones[0] || {}
		const mensura = lote.mensuras[0] || {}
		setLoteEditando(lote.id); setMostrarFormulario(true); setErrorMutacion('')
		setFormulario({ ...FORMULARIO_TERRENO_VACIO, nrolote: lote.nrolote, calle: direccion.calle || '', altura: direccion.altura || '', localidad: direccion.localidad || '', provincia: direccion.provincia || '', codpos: direccion.codpos || '', ancho: mensura.ancho ?? '', largo: mensura.largo ?? '', numeroEscritura: lote.escrituras[0]?.nroescritura || '' })
	}
	const cancelarFormulario = () => {
		if (obraPendiente) {
			navigate('/principal/obras', { state: { obraBorrador: obraPendiente } })
			return
		}
		setMostrarFormulario(false); setLoteEditando(null); setFormulario(FORMULARIO_TERRENO_VACIO); setErrorMutacion('')
	}
	const enviarFormulario = async (event) => {
		event.preventDefault()
		setGuardando(true); setErrorMutacion('')
		let loteYaCreado = loteCreadoId !== null
		try {
			if (obraPendiente && loteCreadoId !== null) {
				await crearObra({ ...obraPendiente, loteId: loteCreadoId })
				navigate('/principal/obras', { replace: true })
				return
			}
			if (!formulario.numeroEscritura.trim()) throw new Error('El número de escritura es obligatorio.')
			const propietariosIngresados = formulario.propietarios.filter((propietario) =>
				[propietario.nombre, propietario.apellido, propietario.dni, propietario.porcentaje]
					.some((valor) => String(valor || '').trim()),
			)
			if (propietariosIngresados.some((propietario) =>
				!propietario.nombre.trim() || !propietario.apellido.trim() || !propietario.dni.trim() || propietario.porcentaje === '',
			)) throw new Error('Para cada propietario completá nombre, apellido, DNI y porcentaje.')
			if (propietariosIngresados.some((propietario) => {
				const porcentaje = Number(propietario.porcentaje)
				return !Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100
			})) throw new Error('El porcentaje de cada propietario debe estar entre 0 y 100.')
			if (new Set(propietariosIngresados.map((propietario) => String(propietario.dni))).size !== propietariosIngresados.length) {
				throw new Error('No se puede cargar al mismo propietario más de una vez.')
			}
			if (sumarPorcentajesEnCentimos(propietariosIngresados) > 10000) {
				throw new Error('La suma de los porcentajes de los propietarios no puede superar el 100%.')
			}
			const entrada = { numero: formulario.nrolote.trim(), calle: formulario.calle.trim(), altura: formulario.altura || null, localidad: formulario.localidad || null, provincia: formulario.provincia || null, codigoPostal: formulario.codpos || null, ancho: Number(formulario.ancho), largo: Number(formulario.largo), numeroEscritura: formulario.numeroEscritura.trim(),
				propietarios: propietariosIngresados.map((propietario) => ({
					nombre: propietario.nombre.trim(), apellido: propietario.apellido.trim(), dni: propietario.dni.trim(),
					estadoCivil: propietario.estadoCivil || null, porcentaje: Number(propietario.porcentaje),
				})) }
			if (loteEditando === null) {
				const lote = await crearTerreno(entrada)
				if (obraPendiente) {
					const nuevoLoteId = lote?.idLote ?? lote?.id
					if (nuevoLoteId == null) throw new Error('El lote se creó, pero no se recibió su identificador para asociarlo a la obra.')
					setLoteCreadoId(nuevoLoteId)
					loteYaCreado = true
					await crearObra({ ...obraPendiente, loteId: nuevoLoteId })
					navigate('/principal/obras', { replace: true })
					return
				}
			}
			else await actualizarTerreno(loteEditando, entrada)
			setVersion((actual) => actual + 1); cancelarFormulario()
		} catch (motivo) {
			const mensaje = loteYaCreado
				? 'No se pudo crear la obra.'
				: obraPendiente ? 'No se pudo crear el lote para la obra.' : 'No se pudo guardar el lote.'
			setErrorMutacion(motivo.message || mensaje)
		}
		finally { setGuardando(false) }
	}
	const eliminar = async () => {
		if (!loteParaEliminar) return
		setEliminando(true)
		setErrorMutacion('')
		try { await eliminarTerreno(loteParaEliminar.id); setVersion((actual) => actual + 1); setLoteParaEliminar(null) }
		catch (motivo) { setErrorMutacion(motivo.message || 'No se pudo eliminar el lote.'); setLoteParaEliminar(null) }
		finally { setEliminando(false) }
	}

	return <section className="terrenos-page">
		<header className="terrenos-page__header">
			<div><p className="terrenos-page__eyebrow">Área privada</p><h1>{terreno ? `Terreno · Lote ${terreno.nrolote}` : mostrarFormulario ? 'Cargar terreno' : 'Gestión de terrenos'}</h1><p>{terreno ? 'Consulta los datos y las relaciones registradas para este lote.' : mostrarFormulario ? 'Completá los datos del terreno y sus relaciones.' : 'Consultá los lotes y la información asociada.'}</p></div>
			{!terreno && !mostrarFormulario && <span className="terrenos-page__count">{lotes.length} {lotes.length === 1 ? 'lote' : 'lotes'}</span>}
		</header>
		{terreno ? <>
			{!ocultarVolverDesdeGestion && <Volver to={destinoVolver}>Volver</Volver>}
			<div className="terrenos-page__detalle">
				<section className="terrenos-page__panel"><div className="terrenos-page__panel-titulo terrenos-page__panel-titulo--acento"><div><h2>Ubicación</h2><p>Dirección asociada al lote</p></div></div>
					{terreno.direcciones.length ? terreno.direcciones.map((direccion) => <dl className="terrenos-page__datos" key={direccion['id-direc'] ?? `${direccion.calle}-${direccion.altura}`}>
						<div><dt>Calle y altura</dt><dd>{[direccion.calle, direccion.altura].filter(Boolean).join(' ') || 'Sin información'}</dd></div>
						<div><dt>Localidad</dt><dd>{mostrar(direccion.localidad)}</dd></div><div><dt>Provincia</dt><dd>{mostrar(direccion.provincia)}</dd></div><div><dt>Código postal</dt><dd>{mostrar(direccion.codpos)}</dd></div>
					</dl>) : <p className="terrenos-page__vacio">Este lote no tiene una dirección registrada.</p>}
				</section>
				<section className="terrenos-page__panel"><div className="terrenos-page__panel-titulo terrenos-page__panel-titulo--acento"><div><h2>Mensura</h2><p>Medidas registradas del terreno</p></div></div>
					{terreno.mensuras.length ? terreno.mensuras.map((mensura) => <dl className="terrenos-page__datos" key={mensura.id ?? `${mensura.ancho}-${mensura.largo}`}><div><dt>Ancho</dt><dd>{mostrar(mensura.ancho, ' m')}</dd></div><div><dt>Largo</dt><dd>{mostrar(mensura.largo, ' m')}</dd></div><div><dt>Superficie</dt><dd>{mensura.ancho && mensura.largo ? `${Number(mensura.ancho) * Number(mensura.largo)} m²` : 'Sin información'}</dd></div></dl>) : <p className="terrenos-page__vacio">Este lote no tiene una mensura registrada.</p>}
				</section>
				<TarjetaPendiente titulo="Propietarios" detalle="Personas asociadas a la escritura del lote" tituloAcento>
					{terreno.escrituras.some((escritura) => escritura.propietarios.length) ? terreno.escrituras.flatMap((escritura) => escritura.propietarios.map((propietario) => <dl className="terrenos-page__datos terrenos-page__propietario" key={`${escritura.id_documento}-${propietario['id-propietario']}`}><div><dt>Nombre</dt><dd>{[propietario.nombre, propietario.apellido].filter(Boolean).join(' ') || 'Sin información'}</dd></div><div><dt>DNI</dt><dd>{mostrar(propietario.dni)}</dd></div><div><dt>Estado civil</dt><dd>{mostrar(propietario.estadocivil)}</dd></div><div><dt>Porcentaje</dt><dd>{mostrar(propietario.porcentaje)}</dd></div></dl>)) : <p className="terrenos-page__vacio">No hay propietarios asociados en los datos disponibles.</p>}
					{!modoConsulta && <Link className="btn btn-outline-secondary" to={`/principal/terrenos/${terreno.nrolote}/propietarios`}>Gestionar propietarios</Link>}
				</TarjetaPendiente>
				<TarjetaPendiente titulo="Documentos" detalle="Escrituras registradas para el lote; los archivos adjuntos no forman parte de la carga actual">
					{terreno.escrituras.length ? <ul className="terrenos-page__documentos">{terreno.escrituras.map((escritura) => <li key={escritura.nroescritura}>Escritura N.º {mostrar(escritura.nroescritura)}</li>)}</ul> : <p className="terrenos-page__vacio">No hay escrituras registradas.</p>}
				</TarjetaPendiente>
				{terreno.obras.length > 0 && <section className="terrenos-page__panel"><div className="terrenos-page__panel-titulo"><div><h2>Obras asociadas</h2><p>Obras vinculadas a este lote</p></div></div><ul className="terrenos-page__documentos">{terreno.obras.map((obra) => <li key={obra['id-obra']}><Link to={esCliente ? `/cliente/obras/${obra['id-obra']}` : `/principal/obras/${obra['id-obra']}/avance`}>Obra #{obra['id-obra']} · {obra.Estado ?? 'Estado sin información'}</Link></li>)}</ul></section>}
			</div>
		</> : mostrarFormulario ? <>
			<Volver onClick={cancelarFormulario}>Volver al listado</Volver>
			<section className="terrenos-page__formulario" aria-labelledby="terreno-form-titulo">
				<div className="terrenos-page__panel-titulo"><div><h2 id="terreno-form-titulo">{obraPendiente ? 'Nuevo lote para la obra' : 'Datos del terreno'}</h2><p>{obraPendiente ? 'Al guardar el lote, se creará la obra con los datos que ya ingresaste.' : 'Completá la información para guardar en PostgreSQL.'}</p></div></div>
				{errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}
				{loteCreadoId !== null && <div className="alert alert-info" role="status">El lote se creó correctamente. Reintentá la creación de la obra; no se volverá a crear el lote.</div>}
				<form onSubmit={enviarFormulario}>
					<fieldset className="terrenos-page__grupo-campos" disabled={guardando || loteCreadoId !== null}><legend>Datos del terreno</legend><div className="terrenos-page__campos">
						<label>Número de lote<input className="form-control" name="nrolote" maxLength="30" value={formulario.nrolote} onChange={cambiarCampo} required /></label>
						<label>Calle<input className="form-control" name="calle" maxLength="150" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+" title="Ingresá solo letras." value={formulario.calle} onChange={(event) => setFormulario({ ...formulario, calle: soloLetras(event.target.value) })} required /></label>
						<label>Altura<input className="form-control" name="altura" type="text" inputMode="numeric" pattern="[0-9]*" title="Ingresá solo números." maxLength="20" value={formulario.altura} onChange={(event) => setFormulario({ ...formulario, altura: soloNumeros(event.target.value) })} /></label>
						<label>Localidad<input className="form-control" name="localidad" maxLength="100" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+" title="Ingresá solo letras." value={formulario.localidad} onChange={(event) => setFormulario({ ...formulario, localidad: soloLetras(event.target.value) })} required /></label>
						<label>Provincia<input className="form-control" name="provincia" maxLength="100" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]+" title="Ingresá solo letras." value={formulario.provincia} onChange={(event) => setFormulario({ ...formulario, provincia: soloLetras(event.target.value) })} required /></label>
						<label>Código postal<input className="form-control" name="codpos" maxLength="20" value={formulario.codpos} onChange={cambiarCampo} /></label>
					</div></fieldset>
					<fieldset className="terrenos-page__grupo-campos" disabled={guardando || loteCreadoId !== null}><legend>Mensura</legend><div className="terrenos-page__campos terrenos-page__campos-dos">
						<label>Ancho (m)<input className="form-control" name="ancho" type="number" inputMode="decimal" min="0" max="99999999.99" step="0.01" value={formulario.ancho} onChange={cambiarCampo} required /></label>
						<label>Largo (m)<input className="form-control" name="largo" type="number" inputMode="decimal" min="0" max="99999999.99" step="0.01" value={formulario.largo} onChange={cambiarCampo} required /></label>
					</div></fieldset>
					{loteEditando === null && <>
						<fieldset className="terrenos-page__grupo-campos" disabled={guardando || loteCreadoId !== null}><legend>Escritura</legend><div className="terrenos-page__campos">
							<label>Número de escritura<input className="form-control" name="numeroEscritura" maxLength="50" pattern=".*\S.*" title="Ingresá el número de escritura." value={formulario.numeroEscritura} onChange={cambiarCampo} required /></label>
						</div></fieldset>
						<fieldset className="terrenos-page__grupo-campos" disabled={guardando || loteCreadoId !== null}>
							<legend>Propietarios</legend>
							{formulario.propietarios.map((propietario, indice) => (
								<div className="border rounded p-3 mb-3" key={indice}>
									<div className="d-flex justify-content-between align-items-center mb-3">
										<h3 className="h6 mb-0">Propietario {indice + 1}</h3>
										{formulario.propietarios.length > 1 && <button className="btn btn-sm btn-outline-danger" type="button" onClick={() => quitarPropietario(indice)}>Quitar</button>}
									</div>
									<div className="terrenos-page__campos">
										<label>Persona existente<select className="form-select" value={propietario.dniExistente} onChange={(event) => seleccionarPropietarioExistente(indice, event)} disabled={cargandoPersonas}>
											<option value="">Registrar una persona nueva</option>
											{(personasPropietarias ?? []).map((persona) => <option key={persona.dni} value={persona.dni} disabled={formulario.propietarios.some((otro, otroIndice) => otroIndice !== indice && String(otro.dniExistente) === String(persona.dni))}>{persona.nombre} {persona.apellido} (DNI: {persona.dni})</option>)}
										</select></label>
										<label>Nombre<input className="form-control" maxLength="100" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]*" title="Ingresá solo letras." value={propietario.nombre} onChange={(event) => cambiarPropietario(indice, 'nombre', soloLetras(event.target.value))} readOnly={Boolean(propietario.dniExistente)} /></label>
										<label>Apellido<input className="form-control" maxLength="100" pattern="[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s'-]*" title="Ingresá solo letras." value={propietario.apellido} onChange={(event) => cambiarPropietario(indice, 'apellido', soloLetras(event.target.value))} readOnly={Boolean(propietario.dniExistente)} /></label>
										<label>DNI<input className="form-control" type="text" inputMode="numeric" pattern="[0-9]{7,8}" minLength="7" maxLength="8" title="El DNI debe tener entre 7 y 8 números." value={propietario.dni} onChange={(event) => cambiarPropietario(indice, 'dni', soloNumeros(event.target.value).slice(0, 8))} readOnly={Boolean(propietario.dniExistente)} /></label>
										<label>Estado civil<select className="form-select" value={propietario.estadoCivil} onChange={(event) => cambiarPropietario(indice, 'estadoCivil', event.target.value)} disabled={Boolean(propietario.dniExistente)}><option value="">Seleccioná estado civil</option><option value="casado">Casado/a</option><option value="soltero">Soltero/a</option><option value="viudo">Viudo/a</option><option value="divorciado">Divorciado/a</option></select></label>
										<label>Porcentaje de titularidad<input className="form-control" name="porcentajePropietario" type="number" min="0" max="100" step="0.01" value={propietario.porcentaje} onChange={(event) => cambiarPropietario(indice, 'porcentaje', event.target.value)} /></label>
									</div>
								</div>
							))}
							<p className={porcentajeTotalCentimos > 10000 ? 'alert alert-danger py-2 mt-2' : 'text-muted mt-2'} role={porcentajeTotalCentimos > 10000 ? 'alert' : 'status'}>
								Porcentaje total: {(porcentajeTotalCentimos / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 })}% de 100%.
							</p>
							{errorPersonas && <p className="alert alert-danger py-2 mt-2" role="alert">{errorPersonas.message} Podés completar los datos manualmente.</p>}
							<button className="btn btn-outline-secondary" type="button" onClick={agregarPropietario}>Agregar otro propietario</button>
						</fieldset>
					</>}
					{loteEditando !== null && <div className="alert alert-info">La edición actualiza ubicación y mensura; la escritura y sus propietarios se administran en su pantalla.</div>}
					<div className="terrenos-page__form-acciones"><button type="button" className="btn btn-outline-secondary" onClick={cancelarFormulario} disabled={guardando || loteCreadoId !== null}>{obraPendiente ? 'Volver a la obra' : 'Cancelar'}</button><button type="submit" className="btn btn-dark" disabled={guardando}>{guardando ? 'Guardando...' : loteCreadoId !== null ? 'Reintentar creación de obra' : obraPendiente ? 'Crear lote y obra' : loteEditando === null ? 'Guardar terreno' : 'Guardar cambios'}</button></div>
				</form>
			</section>
		</> : <>
			<label className="terrenos-page__busqueda"><span className="visually-hidden">Buscar terrenos</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por número de lote o ubicación" /></label>
			<div className="terrenos-page__listado">
				{lotesFiltrados.map((lote) => {
					const direccion = lote.direcciones[0]
					const ubicacion = direccion ? [direccion.calle, direccion.altura, direccion.localidad, direccion.provincia].filter(Boolean).join(', ') : 'Ubicación sin información'
					return <article className="terrenos-page__tarjeta" key={lote.nrolote}><div><span className="terrenos-page__etiqueta">Lote</span><h2>{lote.nrolote}</h2><p>{ubicacion}</p><small>{lote.mensuras.length ? `${lote.mensuras[0].ancho ?? '—'} × ${lote.mensuras[0].largo ?? '—'} m` : 'Sin mensura registrada'}</small></div><div className="d-flex gap-2"><Link className="btn btn-dark" state={esArquitecto ? { desdeGestionTerrenos: true } : undefined} to={`${esCliente ? '/cliente/lotes/' : '/principal/terrenos/'}${lote.nrolote}`}>Consultar terreno</Link>{!modoConsulta && <><button className="btn btn-outline-secondary" type="button" onClick={() => iniciarEdicionLote(lote)}>Editar</button><button className="btn btn-outline-danger" type="button" onClick={() => setLoteParaEliminar(lote)}>Eliminar</button></>}</div></article>
				})}
				{!lotesFiltrados.length && <p className="terrenos-page__vacio">{busqueda ? 'No hay terrenos que coincidan con la búsqueda.' : 'Todavía no hay lotes registrados.'}</p>}
			</div>
			{!modoConsulta && <div className="terrenos-page__carga"><div><h2>¿Necesitás registrar otro terreno?</h2><p>Podés registrar un lote con su dirección y mensura.</p></div><button className="btn btn-outline-secondary" type="button" onClick={() => { setLoteEditando(null); setFormulario(FORMULARIO_TERRENO_VACIO); setMostrarFormulario(true) }}>Cargar terreno</button></div>}
		</>}
		{errorMutacion && !mostrarFormulario && <div className="alert alert-danger mt-3" role="alert">{errorMutacion}</div>}
		{loteParaEliminar && <ConfirmacionEliminar titulo={`Eliminar lote ${loteParaEliminar.nrolote}`} mensaje="Se quitarán también la dirección y los documentos asociados a este terreno. ¿Querés continuar?" onCancelar={() => setLoteParaEliminar(null)} onConfirmar={eliminar} eliminando={eliminando} />}
	</section>
}

export default TerrenosPage
