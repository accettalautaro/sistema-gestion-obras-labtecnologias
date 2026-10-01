import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import { listarTerrenos } from '../services/terrenosService.js'
import '../../../styles/Terrenos.css'

function mostrar(valor, sufijo = '') {
	return valor !== undefined && valor !== null && String(valor).trim() !== '' ? `${valor}${sufijo}` : 'Sin información'
}

function TarjetaPendiente({ titulo, detalle, children }) {
	return <section className="terrenos-page__panel">
		<div className="terrenos-page__panel-titulo"><div><h3>{titulo}</h3>{detalle && <p>{detalle}</p>}</div><span className="terrenos-page__proximo">Próximamente</span></div>
		{children}
	</section>
}

const FORMULARIO_TERRENO_VACIO = {
	nrolote: '', calle: '', altura: '', localidad: '', provincia: '', codpos: '',
	ancho: '', largo: '', nombrePropietario: '', apellidoPropietario: '', dniPropietario: '', porcentajePropietario: '',
}

function TerrenosPage() {
	const { esArquitecto } = useOutletContext()
	const { nrolote } = useParams()
	const [busqueda, setBusqueda] = useState('')
	const [mostrarFormulario, setMostrarFormulario] = useState(false)
	const [mostrarAvisoCarga, setMostrarAvisoCarga] = useState(false)
	const [formulario, setFormulario] = useState(FORMULARIO_TERRENO_VACIO)
	const { datos: lotes = [], cargando, error } = useFetch(listarTerrenos)

	if (esArquitecto === null) return <p className="terrenos-page__estado" role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p className="terrenos-page__estado" role="status">Cargando terrenos...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const terreno = nrolote ? lotes.find((lote) => String(lote.nrolote) === String(nrolote)) : null
	const lotesFiltrados = lotes.filter((lote) => {
		const direccion = lote.direcciones[0]
		return [lote.nrolote, direccion?.calle, direccion?.altura, direccion?.localidad, direccion?.provincia]
			.some((valor) => String(valor ?? '').toLowerCase().includes(busqueda.trim().toLowerCase()))
	})
	if (nrolote && !terreno) return <section className="terrenos-page"><div className="alert alert-warning">No se encontró el lote {nrolote}.</div><Link className="btn btn-outline-secondary" to="/principal/terrenos">Volver a terrenos</Link></section>

	const cambiarCampo = (event) => setFormulario((actual) => ({ ...actual, [event.target.name]: event.target.value }))
	const enviarFormulario = (event) => {
		event.preventDefault()
		setMostrarAvisoCarga(true)
	}

	return <section className="terrenos-page">
		<header className="terrenos-page__header">
			<div><p className="terrenos-page__eyebrow">Área privada</p><h1>{terreno ? `Terreno · Lote ${terreno.nrolote}` : mostrarFormulario ? 'Cargar terreno' : 'Gestión de terrenos'}</h1><p>{terreno ? 'Consulta los datos y las relaciones registradas para este lote.' : mostrarFormulario ? 'Completá los datos del terreno y sus relaciones.' : 'Consultá los lotes y la información asociada.'}</p></div>
			{!terreno && !mostrarFormulario && <span className="terrenos-page__count">{lotes.length} {lotes.length === 1 ? 'lote' : 'lotes'}</span>}
		</header>
		{terreno ? <>
			<Link className="terrenos-page__volver" to="/principal/terrenos">← Volver al listado</Link>
			<div className="terrenos-page__detalle">
				<section className="terrenos-page__panel"><div className="terrenos-page__panel-titulo"><div><h2>Ubicación</h2><p>Dirección asociada al lote</p></div></div>
					{terreno.direcciones.length ? terreno.direcciones.map((direccion) => <dl className="terrenos-page__datos" key={direccion['id-direc'] ?? `${direccion.calle}-${direccion.altura}`}>
						<div><dt>Calle y altura</dt><dd>{[direccion.calle, direccion.altura].filter(Boolean).join(' ') || 'Sin información'}</dd></div>
						<div><dt>Localidad</dt><dd>{mostrar(direccion.localidad)}</dd></div><div><dt>Provincia</dt><dd>{mostrar(direccion.provincia)}</dd></div><div><dt>Código postal</dt><dd>{mostrar(direccion.codpos)}</dd></div>
					</dl>) : <p className="terrenos-page__vacio">Este lote no tiene una dirección registrada.</p>}
				</section>
				<section className="terrenos-page__panel"><div className="terrenos-page__panel-titulo"><div><h2>Mensura</h2><p>Medidas registradas del terreno</p></div></div>
					{terreno.mensuras.length ? terreno.mensuras.map((mensura) => <dl className="terrenos-page__datos" key={mensura.id ?? `${mensura.ancho}-${mensura.largo}`}><div><dt>Ancho</dt><dd>{mostrar(mensura.ancho, ' m')}</dd></div><div><dt>Largo</dt><dd>{mostrar(mensura.largo, ' m')}</dd></div><div><dt>Superficie</dt><dd>{mensura.ancho && mensura.largo ? `${Number(mensura.ancho) * Number(mensura.largo)} m²` : 'Sin información'}</dd></div></dl>) : <p className="terrenos-page__vacio">Este lote no tiene una mensura registrada.</p>}
				</section>
				<TarjetaPendiente titulo="Propietarios" detalle="Personas asociadas a la escritura del lote">
					{terreno.escrituras.some((escritura) => escritura.propietarios.length) ? terreno.escrituras.flatMap((escritura) => escritura.propietarios.map((propietario) => <dl className="terrenos-page__datos terrenos-page__propietario" key={propietario['id-propietario']}><div><dt>Nombre</dt><dd>{[propietario.nombre, propietario.apellido].filter(Boolean).join(' ') || 'Sin información'}</dd></div><div><dt>DNI</dt><dd>{mostrar(propietario.dni)}</dd></div><div><dt>Estado civil</dt><dd>{mostrar(propietario.estadocivil)}</dd></div><div><dt>Porcentaje</dt><dd>{mostrar(propietario.porcentaje)}</dd></div></dl>)) : <p className="terrenos-page__vacio">No hay propietarios asociados en los datos disponibles.</p>}
					<button className="btn btn-outline-secondary" type="button" disabled title="Disponible cuando se implemente el backend">Gestionar propietarios</button>
				</TarjetaPendiente>
				<TarjetaPendiente titulo="Documentos" detalle="Escrituras registradas para el lote">
					{terreno.escrituras.length ? <ul className="terrenos-page__documentos">{terreno.escrituras.map((escritura) => <li key={escritura.nroescritura}>Escritura N.º {mostrar(escritura.nroescritura)}</li>)}</ul> : <p className="terrenos-page__vacio">No hay escrituras registradas.</p>}
					<div className="terrenos-page__acciones"><button className="btn btn-outline-secondary" type="button" disabled title="Disponible cuando se implemente el backend">Cargar documento</button><button className="btn btn-outline-danger" type="button" disabled title="Disponible cuando se implemente el backend">Eliminar documento</button></div>
				</TarjetaPendiente>
				{terreno.obras.length > 0 && <section className="terrenos-page__panel"><div className="terrenos-page__panel-titulo"><div><h2>Obras asociadas</h2><p>Obras vinculadas a este lote</p></div></div><ul className="terrenos-page__documentos">{terreno.obras.map((obra) => <li key={obra['id-obra']}>Obra #{obra['id-obra']} · {obra.Estado ?? 'Estado sin información'}</li>)}</ul></section>}
			</div>
		</> : mostrarFormulario ? <>
			<button className="terrenos-page__volver" type="button" onClick={() => setMostrarFormulario(false)}>← Volver al listado</button>
			<section className="terrenos-page__formulario" aria-labelledby="terreno-form-titulo">
				<div className="terrenos-page__panel-titulo"><div><h2 id="terreno-form-titulo">Datos del terreno</h2><p>Completá la información para preparar la carga.</p></div><span className="terrenos-page__proximo">Vista previa</span></div>
				<form onSubmit={enviarFormulario}>
					<fieldset className="terrenos-page__grupo-campos"><legend>Identificación y ubicación</legend><div className="terrenos-page__campos">
						<label>Número de lote<input className="form-control" name="nrolote" value={formulario.nrolote} onChange={cambiarCampo} required /></label>
						<label>Calle<input className="form-control" name="calle" value={formulario.calle} onChange={cambiarCampo} required /></label>
						<label>Altura<input className="form-control" name="altura" value={formulario.altura} onChange={cambiarCampo} /></label>
						<label>Localidad<input className="form-control" name="localidad" value={formulario.localidad} onChange={cambiarCampo} required /></label>
						<label>Provincia<input className="form-control" name="provincia" value={formulario.provincia} onChange={cambiarCampo} required /></label>
						<label>Código postal<input className="form-control" name="codpos" value={formulario.codpos} onChange={cambiarCampo} /></label>
					</div></fieldset>
					<fieldset className="terrenos-page__grupo-campos"><legend>Mensura</legend><div className="terrenos-page__campos terrenos-page__campos-dos">
						<label>Ancho (m)<input className="form-control" name="ancho" type="number" min="0" step="any" value={formulario.ancho} onChange={cambiarCampo} required /></label>
						<label>Largo (m)<input className="form-control" name="largo" type="number" min="0" step="any" value={formulario.largo} onChange={cambiarCampo} required /></label>
					</div></fieldset>
					<fieldset className="terrenos-page__grupo-campos"><legend>Propietario</legend><div className="terrenos-page__campos">
						<label>Nombre<input className="form-control" name="nombrePropietario" value={formulario.nombrePropietario} onChange={cambiarCampo} /></label>
						<label>Apellido<input className="form-control" name="apellidoPropietario" value={formulario.apellidoPropietario} onChange={cambiarCampo} /></label>
						<label>DNI<input className="form-control" name="dniPropietario" inputMode="numeric" value={formulario.dniPropietario} onChange={cambiarCampo} /></label>
						<label>Porcentaje de titularidad<input className="form-control" name="porcentajePropietario" type="number" min="0" max="100" step="any" value={formulario.porcentajePropietario} onChange={cambiarCampo} /></label>
					</div></fieldset>
					<div className="terrenos-page__documento-pendiente"><strong>Documentación:</strong> adjuntar escritura estará disponible cuando se implemente el backend.</div>
					<div className="terrenos-page__form-acciones"><button type="button" className="btn btn-outline-secondary" onClick={() => setMostrarFormulario(false)}>Cancelar</button><button type="submit" className="btn btn-dark">Guardar terreno</button></div>
				</form>
			</section>
		</> : <>
			<label className="terrenos-page__busqueda"><span className="visually-hidden">Buscar terrenos</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por número de lote o ubicación" /></label>
			<div className="terrenos-page__listado">
				{lotesFiltrados.map((lote) => {
					const direccion = lote.direcciones[0]
					const ubicacion = direccion ? [direccion.calle, direccion.altura, direccion.localidad, direccion.provincia].filter(Boolean).join(', ') : 'Ubicación sin información'
					return <article className="terrenos-page__tarjeta" key={lote.nrolote}><div><span className="terrenos-page__etiqueta">Lote</span><h2>{lote.nrolote}</h2><p>{ubicacion}</p><small>{lote.mensuras.length ? `${lote.mensuras[0].ancho ?? '—'} × ${lote.mensuras[0].largo ?? '—'} m` : 'Sin mensura registrada'}</small></div><Link className="btn btn-dark" to={`/principal/terrenos/${lote.nrolote}`}>Consultar terreno</Link></article>
				})}
				{!lotesFiltrados.length && <p className="terrenos-page__vacio">{busqueda ? 'No hay terrenos que coincidan con la búsqueda.' : 'Todavía no hay lotes en los archivos JSON.'}</p>}
			</div>
			<div className="terrenos-page__carga"><div><h2>¿Necesitás registrar otro terreno?</h2><p>Podés completar los datos; el guardado se habilitará en una próxima etapa.</p></div><button className="btn btn-outline-secondary" type="button" onClick={() => setMostrarFormulario(true)}>Cargar terreno</button></div>
		</>}
		{mostrarAvisoCarga && <div className="terrenos-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) setMostrarAvisoCarga(false) }}>
			<section className="terrenos-page__modal" role="dialog" aria-modal="true" aria-labelledby="terreno-modal-titulo" aria-describedby="terreno-modal-descripcion">
				<div className="terrenos-page__modal-cabecera"><h2 id="terreno-modal-titulo">Cargar terreno</h2><button type="button" className="terrenos-page__modal-cerrar" onClick={() => setMostrarAvisoCarga(false)} aria-label="Cerrar">×</button></div>
				<p id="terreno-modal-descripcion">Los datos se completaron en el formulario, pero no se guardaron. En esta entrega la pantalla solo permite consultar; el guardado estará disponible cuando se implemente el backend.</p>
				<div className="alert alert-info mb-0" role="status">El formulario conserva lo que escribiste mientras permanezcas en esta pantalla. No se modificó ningún archivo JSON ni se guardaron datos en el navegador.</div>
				<div className="terrenos-page__modal-acciones"><button type="button" className="btn btn-dark" onClick={() => setMostrarAvisoCarga(false)}>Volver al formulario</button></div>
			</section>
		</div>}
	</section>
}

export default TerrenosPage
