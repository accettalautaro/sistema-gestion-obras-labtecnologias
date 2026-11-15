import { useEffect, useState } from 'react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useOutletContext } from 'react-router-dom'
import { listarClientes, crearCliente, actualizarCliente, eliminarCliente, crearUsuarioCliente } from '../services/clientesService.js'
import ConfirmacionEliminar from '../../../shared/components/ConfirmacionEliminar.jsx'
import { soloLetras, soloNumeros } from '../../../shared/utils/filtrosEntrada.js'
import '../../../styles/Clientes.css'

const FORMULARIO_VACIO = { nombre: '', apellido: '', dni: '', telefono: '', email: '' }

function ClientesPage() {
	const { esArquitecto } = useOutletContext()
	const [busqueda, setBusqueda] = useState('')
	const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
	const [formularioAbierto, setFormularioAbierto] = useState(false)
	const [clienteEditando, setClienteEditando] = useState(null)
	const [clienteParaEliminar, setClienteParaEliminar] = useState(null)
	const [eliminando, setEliminando] = useState(false)
	const [aviso, setAviso] = useState(null)
	const [version, setVersion] = useState(0)
	const [guardando, setGuardando] = useState(false)
	const [clienteParaUsuario, setClienteParaUsuario] = useState(null)
	const [generandoUsuario, setGenerandoUsuario] = useState(false)
	const [errorUsuario, setErrorUsuario] = useState('')
	const [errorFormulario, setErrorFormulario] = useState('')
	const [errorMutacion, setErrorMutacion] = useState('')
	const { datos, cargando, error } = useFetch(listarClientes, version)

	useEffect(() => {
		if (!formularioAbierto) return
		const cerrarConEscape = (event) => {
			if (event.key === 'Escape' && !guardando) {
				setFormularioAbierto(false)
				setClienteEditando(null)
				setFormulario(FORMULARIO_VACIO)
				setErrorFormulario('')
			}
		}
		window.addEventListener('keydown', cerrarConEscape)
		return () => window.removeEventListener('keydown', cerrarConEscape)
	}, [formularioAbierto, guardando])

	if (esArquitecto === null) return <p className="clientes-page__estado" role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p className="clientes-page__estado" role="status">Cargando clientes...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const { listaClientes = [] } = datos || {}
	const clientesFiltrados = listaClientes.filter((cliente) =>
		[cliente.nombre, cliente.apellido, cliente.dni, cliente.telefono, cliente.email]
			.some((valor) => String(valor ?? '').toLowerCase().includes(busqueda.trim().toLowerCase())),
	)

	const abrirNuevoCliente = () => {
		setClienteEditando(null)
		setFormulario(FORMULARIO_VACIO)
		setErrorFormulario('')
		setErrorMutacion('')
		setFormularioAbierto(true)
	}
	const editar = (cliente) => {
		setClienteEditando(cliente['id-cliente'])
		setFormulario({ nombre: cliente.nombre ?? '', apellido: cliente.apellido ?? '', dni: cliente.dni ?? '', telefono: cliente.telefono ?? '', email: cliente.email ?? '' })
		setErrorFormulario('')
		setErrorMutacion('')
		setFormularioAbierto(true)
	}
	const cerrarFormulario = () => {
		setFormularioAbierto(false)
		setClienteEditando(null)
		setFormulario(FORMULARIO_VACIO)
		setErrorFormulario('')
	}
	const abrirGeneracionUsuario = (cliente) => {
		setClienteParaUsuario(cliente)
		setErrorUsuario('')
	}
	const cancelarGeneracionUsuario = () => {
		if (generandoUsuario) return
		setClienteParaUsuario(null)
		setErrorUsuario('')
	}
	const generarUsuario = async (event) => {
		event.preventDefault()
		if (!clienteParaUsuario) return
		const contrasenaInicial = String(clienteParaUsuario.dni ?? '').replace(/\D/g, '').slice(-4)
		if (contrasenaInicial.length !== 4) {
			setErrorUsuario('El DNI debe tener al menos cuatro dígitos para generar la contraseña.')
			return
		}
		setGenerandoUsuario(true)
		setErrorUsuario('')
		try {
			await crearUsuarioCliente(clienteParaUsuario['id-cliente'], contrasenaInicial)
			setClienteParaUsuario(null)
			setVersion((actual) => actual + 1)
			setAviso({
				titulo: 'Usuario generado',
				mensaje: 'La cuenta se creó y quedó vinculada al cliente. El DNI es su identificador de acceso.',
			})
		} catch (motivo) {
			setErrorUsuario(motivo.message || 'No se pudo generar el usuario.')
		} finally {
			setGenerandoUsuario(false)
		}
	}
	const guardar = async (event) => {
		event.preventDefault()
		setGuardando(true); setErrorFormulario('')
		setErrorMutacion('')
		try {
			const entrada = { ...formulario, email: formulario.email || null, telefono: formulario.telefono || null }
			if (clienteEditando === null) await crearCliente(entrada)
			else await actualizarCliente(clienteEditando, entrada)
			setVersion((actual) => actual + 1); cerrarFormulario()
		} catch (motivo) { setErrorFormulario(motivo.message || 'No se pudo guardar el cliente.') }
		finally { setGuardando(false) }
	}
	const eliminar = async () => {
		if (!clienteParaEliminar) return
		setEliminando(true)
		setErrorMutacion('')
		try { await eliminarCliente(clienteParaEliminar['id-cliente']); setVersion((actual) => actual + 1); setClienteParaEliminar(null) }
		catch (motivo) { setErrorMutacion(motivo.message || 'No se pudo eliminar el cliente.'); setClienteParaEliminar(null) }
		finally { setEliminando(false) }
	}

	return <section className="clientes-page">
		<header className="clientes-page__header">
			<div><p className="clientes-page__eyebrow">Área privada</p><h1>Gestión de clientes</h1><p>Perfiles de clientes y sus cuentas vinculadas.</p></div>
			<span className="clientes-page__count">{listaClientes.length} {listaClientes.length === 1 ? 'perfil' : 'perfiles'}</span>
		</header>

		{errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}

		<div className="clientes-page__workspace">
			<section className="clientes-page__listado" aria-labelledby="clientes-listado-titulo">
				<div className="clientes-page__toolbar"><h2 id="clientes-listado-titulo">Perfiles registrados</h2><label className="clientes-page__busqueda"><span className="visually-hidden">Buscar clientes</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, DNI o contacto" /></label></div>
				<div className="table-responsive"><table className="table table-hover align-middle clientes-page__tabla">
					<thead><tr><th>Cliente</th><th>DNI</th><th>Teléfono</th><th>Email</th><th>Cuenta</th><th><span className="visually-hidden">Acciones</span></th></tr></thead>
					<tbody>
						{clientesFiltrados.map((cliente) => {
							const tieneUsuario = cliente['id-usuario'] != null && cliente['id-usuario'] !== ''
							return <tr key={cliente['id-cliente']}>
								<td className="clientes-page__nombre">{cliente.nombre} {cliente.apellido}</td><td>{cliente.dni}</td><td>{cliente.telefono}</td><td>{cliente.email}</td>
								<td>{tieneUsuario ? <span className="clientes-page__cuenta">#{cliente['id-usuario']}</span> : <span className="text-secondary">Sin usuario</span>}</td>
								<td><div className="clientes-page__acciones">{tieneUsuario ? <span aria-hidden="true" /> : <button className="btn btn-sm btn-outline-success" type="button" onClick={() => abrirGeneracionUsuario(cliente)}>Generar usuario</button>}<button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(cliente)}>Editar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => setClienteParaEliminar(cliente)}>Eliminar</button></div></td>
							</tr>
						})}
						{!clientesFiltrados.length && <tr><td colSpan="6" className="clientes-page__vacio">{busqueda ? 'No hay coincidencias.' : 'Todavía no hay perfiles registrados.'}</td></tr>}
					</tbody>
				</table></div>
				<div className="clientes-page__listado-acciones"><button className="btn btn-dark" type="button" onClick={abrirNuevoCliente}>Crear cliente</button></div>
			</section>
		</div>
		{formularioAbierto && <div className="clientes-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget && !guardando) cerrarFormulario() }}>
			<section className="clientes-page__modal clientes-page__modal--formulario" role="dialog" aria-modal="true" aria-labelledby="cliente-form-titulo" aria-describedby="cliente-form-ayuda">
				<div className="clientes-page__modal-cabecera">
					<div><h2 id="cliente-form-titulo">{clienteEditando === null ? 'Nuevo cliente' : `Editar cliente #${clienteEditando}`}</h2><p id="cliente-form-ayuda">Los cambios se guardan en PostgreSQL.</p></div>
					<button className="clientes-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={cerrarFormulario} disabled={guardando}>×</button>
				</div>
				<form onSubmit={guardar} aria-busy={guardando}><div className="clientes-page__campos">
					<label>Nombre<input className="form-control" name="nombre" autoComplete="given-name" maxLength="100" value={formulario.nombre} onChange={(event) => setFormulario({ ...formulario, nombre: soloLetras(event.target.value) })} required autoFocus /></label>
					<label>Apellido<input className="form-control" name="apellido" autoComplete="family-name" maxLength="100" value={formulario.apellido} onChange={(event) => setFormulario({ ...formulario, apellido: soloLetras(event.target.value) })} required /></label>
					<label>DNI<input className="form-control" name="dni" type="text" inputMode="numeric" pattern="[0-9]{7,8}" minLength="7" maxLength="8" title="El DNI debe tener entre 7 y 8 números." value={formulario.dni} onChange={(event) => setFormulario({ ...formulario, dni: soloNumeros(event.target.value).slice(0, 8) })} required /></label>
					<label>Teléfono<input className="form-control" name="telefono" type="tel" inputMode="numeric" autoComplete="tel" pattern="[0-9]{10}" minLength="10" maxLength="10" title="El teléfono debe tener exactamente 10 números." value={formulario.telefono} onChange={(event) => setFormulario({ ...formulario, telefono: soloNumeros(event.target.value).slice(0, 10) })} required /></label>
					<label className="clientes-page__campo-completo">Email<input className="form-control" name="email" type="email" autoComplete="email" value={formulario.email} onChange={(event) => setFormulario({ ...formulario, email: event.target.value })} required /></label>
				</div>
				{errorFormulario && <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">{errorFormulario}</p>}
				<div className="clientes-page__form-actions"><button className="btn btn-outline-secondary" type="button" onClick={cerrarFormulario} disabled={guardando}>Cancelar</button><button className="btn btn-dark" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : clienteEditando === null ? 'Crear cliente' : 'Guardar cambios'}</button></div></form>
			</section>
		</div>}
		{clienteParaUsuario && <div className="clientes-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) cancelarGeneracionUsuario() }}>
			<section className="clientes-page__modal" role="dialog" aria-modal="true" aria-labelledby="generar-usuario-titulo" aria-describedby="generar-usuario-ayuda">
				<div className="clientes-page__modal-cabecera">
					<h2 id="generar-usuario-titulo">Generar usuario para {clienteParaUsuario.nombre} {clienteParaUsuario.apellido}</h2>
					<button className="clientes-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={cancelarGeneracionUsuario} disabled={generandoUsuario}>×</button>
				</div>
				<p id="generar-usuario-ayuda">El DNI del cliente será su identificador de acceso. La contraseña inicial se genera con sus últimos cuatro dígitos.</p>
				<form onSubmit={generarUsuario} aria-busy={generandoUsuario}>
					<label className="clientes-page__campo-usuario" htmlFor="cliente-dni-usuario">DNI del cliente
						<input className="form-control" id="cliente-dni-usuario" value={clienteParaUsuario.dni ?? ''} readOnly />
					</label>
					<label className="clientes-page__campo-usuario" htmlFor="cliente-contrasena-inicial">Contraseña inicial
						<input className="form-control" id="cliente-contrasena-inicial" value={String(clienteParaUsuario.dni ?? '').replace(/\D/g, '').slice(-4)} readOnly />
					</label>
					{errorUsuario && <p className="alert alert-danger py-2 mt-3 mb-0" role="alert">{errorUsuario}</p>}
					<p className="text-muted small mt-3 mb-0">La contraseña se almacena cifrada y no puede recuperarse desde la aplicación.</p>
					<div className="clientes-page__modal-acciones">
						<button className="btn btn-outline-secondary" type="button" onClick={cancelarGeneracionUsuario} disabled={generandoUsuario}>Cancelar</button>
						<button className="btn btn-dark" type="submit" disabled={generandoUsuario}>{generandoUsuario ? 'Generando...' : 'Generar usuario'}</button>
					</div>
				</form>
			</section>
		</div>}
		{aviso && <div className="clientes-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) setAviso(null) }}><section className="clientes-page__modal" role="dialog" aria-modal="true" aria-labelledby="cliente-modal-titulo"><div className="clientes-page__modal-cabecera"><h2 id="cliente-modal-titulo">{aviso.titulo}</h2><button className="clientes-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setAviso(null)}>×</button></div><p>{aviso.mensaje}</p><div className="clientes-page__modal-acciones"><button className="btn btn-dark" type="button" onClick={() => setAviso(null)}>Entendido</button></div></section></div>}
		{clienteParaEliminar && <ConfirmacionEliminar titulo="Eliminar cliente" mensaje={`¿Querés eliminar el perfil de ${clienteParaEliminar.nombre} ${clienteParaEliminar.apellido}?`} onCancelar={() => setClienteParaEliminar(null)} onConfirmar={eliminar} eliminando={eliminando} />}
	</section>
}

export default ClientesPage
