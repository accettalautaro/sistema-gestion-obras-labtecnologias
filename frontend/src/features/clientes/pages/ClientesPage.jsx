import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useFetch } from '../../../shared/hooks/useFetch'
import {
	actualizarCliente,
	crearCliente,
	crearUsuarioCliente,
	eliminarCliente,
	listarClientes,
} from '../services/clientesService.js'
import '../../../styles/Clientes.css'

const FORMULARIO_VACIO = { nombre: '', apellido: '', dni: '', telefono: '', email: '' }

function ClientesPage() {
	const { esArquitecto } = useOutletContext()
	const [busqueda, setBusqueda] = useState('')
	const [clientesActualizados, setClientesActualizados] = useState(null)
	const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
	const [clienteEditando, setClienteEditando] = useState(null)
	const [clienteAEliminar, setClienteAEliminar] = useState(null)
	const [clienteParaUsuario, setClienteParaUsuario] = useState(null)
	const [usuarioNuevo, setUsuarioNuevo] = useState('')
	const [aviso, setAviso] = useState(null)
	const [errorUsuario, setErrorUsuario] = useState('')
	const [guardando, setGuardando] = useState(false)
	const [eliminando, setEliminando] = useState(false)
	const [guardandoUsuario, setGuardandoUsuario] = useState(false)
	const { datos, cargando, error } = useFetch(listarClientes)

	if (esArquitecto === null) return <p className="clientes-page__estado" role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p className="clientes-page__estado" role="status">Cargando clientes...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const clientes = clientesActualizados ?? datos?.listaClientes ?? []
	const clientesFiltrados = clientes.filter((cliente) =>
		[cliente.nombre, cliente.apellido, cliente.dni, cliente.telefono, cliente.email]
			.some((valor) => String(valor ?? '').toLowerCase().includes(busqueda.trim().toLowerCase())),
	)

	const editar = (cliente) => {
		setClienteEditando(cliente['id-cliente'])
		setFormulario({
			nombre: cliente.nombre ?? '',
			apellido: cliente.apellido ?? '',
			dni: cliente.dni ?? '',
			telefono: cliente.telefono ?? '',
			email: cliente.email ?? '',
		})
	}

	const cancelarEdicion = () => {
		setClienteEditando(null)
		setFormulario(FORMULARIO_VACIO)
	}

	const guardar = async (event) => {
		event.preventDefault()
		setGuardando(true)
		try {
			if (clienteEditando === null) {
				const creado = await crearCliente(formulario)
				setClientesActualizados((lista) => [...(lista ?? datos.listaClientes), creado])
				setAviso({ titulo: 'Cliente creado', mensaje: 'El cliente se guardó correctamente.' })
			} else {
				const actualizado = await actualizarCliente(clienteEditando, formulario)
				setClientesActualizados((lista) => (lista ?? datos.listaClientes).map((cliente) =>
					String(cliente['id-cliente']) === String(clienteEditando) ? actualizado : cliente,
				))
				setAviso({ titulo: 'Cliente actualizado', mensaje: 'Los cambios se guardaron correctamente.' })
			}
			cancelarEdicion()
		} catch (errorOperacion) {
			setAviso({
				titulo: clienteEditando === null ? 'No se pudo crear el cliente' : 'No se pudieron guardar los cambios',
				mensaje: errorOperacion.message,
			})
		} finally {
			setGuardando(false)
		}
	}

	const solicitarEliminacion = (cliente) => setClienteAEliminar(cliente)

	const confirmarEliminacion = async (event) => {
		event.preventDefault()
		if (!clienteAEliminar) return
		setEliminando(true)
		try {
			await eliminarCliente(clienteAEliminar['id-cliente'])
			setClientesActualizados((lista) => (lista ?? datos.listaClientes).filter((cliente) =>
				String(cliente['id-cliente']) !== String(clienteAEliminar['id-cliente']),
			))
			if (String(clienteEditando) === String(clienteAEliminar['id-cliente'])) cancelarEdicion()
			setAviso({ titulo: 'Cliente eliminado', mensaje: 'El cliente se eliminó correctamente.' })
			setClienteAEliminar(null)
		} catch (errorOperacion) {
			setClienteAEliminar(null)
			setAviso({ titulo: 'No se pudo eliminar el cliente', mensaje: errorOperacion.message })
		} finally {
			setEliminando(false)
		}
	}

	const abrirGeneracionUsuario = (cliente) => {
		setClienteParaUsuario(cliente)
		setUsuarioNuevo('')
		setErrorUsuario('')
	}

	const cancelarGeneracionUsuario = () => {
		setClienteParaUsuario(null)
		setUsuarioNuevo('')
		setErrorUsuario('')
	}

	const generarUsuario = async (event) => {
		event.preventDefault()
		if (!clienteParaUsuario) return
		setGuardandoUsuario(true)
		setErrorUsuario('')
		try {
			const actualizado = await crearUsuarioCliente(clienteParaUsuario['id-cliente'], usuarioNuevo)
			setClientesActualizados((lista) => (lista ?? datos.listaClientes).map((cliente) =>
				String(cliente['id-cliente']) === String(actualizado['id-cliente']) ? actualizado : cliente,
			))
			cancelarGeneracionUsuario()
			setAviso({
				titulo: 'Usuario generado',
				mensaje: 'La cuenta se creó y quedó vinculada al cliente. El DNI es su identificador de acceso.',
			})
		} catch (errorOperacion) {
			setErrorUsuario(errorOperacion.message)
		} finally {
			setGuardandoUsuario(false)
		}
	}

	return <section className="clientes-page">
		<header className="clientes-page__header">
			<div><p className="clientes-page__eyebrow">Área privada</p><h1>Gestión de clientes</h1><p>Perfiles de clientes y sus cuentas vinculadas.</p></div>
			<span className="clientes-page__count">{clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}</span>
		</header>

		<div className="clientes-page__workspace">
			<section className="clientes-page__listado" aria-labelledby="clientes-listado-titulo">
				<div className="clientes-page__toolbar"><h2 id="clientes-listado-titulo">Clientes registrados</h2><label className="clientes-page__busqueda"><span className="visually-hidden">Buscar clientes</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, DNI o contacto" /></label></div>
				<div className="table-responsive"><table className="table table-hover align-middle clientes-page__tabla">
					<thead><tr><th>Cliente</th><th>DNI</th><th>Teléfono</th><th>Email</th><th>Cuenta</th><th><span className="visually-hidden">Acciones</span></th></tr></thead>
					<tbody>
						{clientesFiltrados.map((cliente) => {
							const tieneUsuario = cliente['id-usuario'] != null && cliente['id-usuario'] !== ''
							return <tr key={cliente['id-cliente']}>
								<td className="clientes-page__nombre">{cliente.nombre} {cliente.apellido}</td><td>{cliente.dni}</td><td>{cliente.telefono}</td><td>{cliente.email}</td>
								<td>{tieneUsuario
									? <span className="clientes-page__cuenta">#{cliente['id-usuario']}</span>
									: <span className="text-secondary">Sin usuario</span>}</td>
								<td><div className="clientes-page__acciones">
									{!tieneUsuario && <button className="btn btn-sm btn-outline-success" type="button" onClick={() => abrirGeneracionUsuario(cliente)}>Generar usuario</button>}
									<button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(cliente)}>Editar</button>
									<button className="btn btn-sm btn-outline-danger" type="button" onClick={() => solicitarEliminacion(cliente)}>Eliminar</button>
								</div></td>
							</tr>
						})}
						{!clientesFiltrados.length && <tr><td colSpan="6" className="clientes-page__vacio">{busqueda ? 'No hay coincidencias.' : 'Todavía no hay clientes registrados.'}</td></tr>}
					</tbody>
				</table></div>
			</section>

			<section className="clientes-page__formulario" aria-labelledby="cliente-form-titulo">
				<div className="clientes-page__formulario-header"><div><h2 id="cliente-form-titulo">{clienteEditando === null ? 'Nuevo cliente' : `Editar cliente #${clienteEditando}`}</h2><p>{clienteEditando === null ? 'Completa los datos para registrar un cliente.' : 'Modifica los datos del cliente.'}</p></div>{clienteEditando !== null && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={cancelarEdicion}>Nuevo cliente</button>}</div>
				<form onSubmit={guardar} aria-busy={guardando}><div className="clientes-page__campos">
					<label>Nombre<input className="form-control" name="nombre" autoComplete="given-name" value={formulario.nombre} onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })} required /></label>
					<label>Apellido<input className="form-control" name="apellido" autoComplete="family-name" value={formulario.apellido} onChange={(event) => setFormulario({ ...formulario, apellido: event.target.value })} required /></label>
					<label>DNI<input className="form-control" name="dni" inputMode="numeric" value={formulario.dni} onChange={(event) => setFormulario({ ...formulario, dni: event.target.value })} required /></label>
					<label>Teléfono<input className="form-control" name="telefono" autoComplete="tel" value={formulario.telefono} onChange={(event) => setFormulario({ ...formulario, telefono: event.target.value })} required /></label>
					<label className="clientes-page__campo-completo">Email<input className="form-control" name="email" type="email" autoComplete="email" value={formulario.email} onChange={(event) => setFormulario({ ...formulario, email: event.target.value })} required /></label>
				</div><div className="clientes-page__form-actions">{clienteEditando !== null && <button className="btn btn-outline-secondary" type="button" onClick={cancelarEdicion} disabled={guardando}>Cancelar</button>}<button className="btn btn-dark" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : clienteEditando === null ? 'Crear cliente' : 'Guardar cambios'}</button></div></form>
			</section>
		</div>

		{clienteParaUsuario && <div className="clientes-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget && !guardandoUsuario) cancelarGeneracionUsuario() }}>
			<section className="clientes-page__modal" role="dialog" aria-modal="true" aria-labelledby="generar-usuario-titulo" aria-describedby="generar-usuario-ayuda">
				<div className="clientes-page__modal-cabecera">
					<h2 id="generar-usuario-titulo">Generar usuario para {clienteParaUsuario.nombre} {clienteParaUsuario.apellido}</h2>
					<button className="clientes-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={cancelarGeneracionUsuario} disabled={guardandoUsuario}>×</button>
				</div>
				<p id="generar-usuario-ayuda">El DNI del cliente será su identificador de acceso. Ingresá el usuario, que en este sistema cumple la función de contraseña.</p>
				<form onSubmit={generarUsuario} aria-busy={guardandoUsuario}>
					<label className="clientes-page__campo-usuario" htmlFor="cliente-dni-usuario">DNI del cliente
						<input className="form-control" id="cliente-dni-usuario" value={clienteParaUsuario.dni ?? ''} readOnly />
					</label>
					<label className="clientes-page__campo-usuario" htmlFor="cliente-nuevo-usuario">Usuario (contraseña)
						<input className="form-control" id="cliente-nuevo-usuario" name="usuario" type="password" autoComplete="new-password" value={usuarioNuevo} onChange={(event) => setUsuarioNuevo(event.target.value)} required autoFocus disabled={guardandoUsuario} />
					</label>
					{errorUsuario && <p className="clientes-page__error-usuario" role="alert">{errorUsuario}</p>}
					<p className="clientes-page__nota-usuario">La contraseña se guarda cifrada; no se puede recuperar desde la aplicación.</p>
					<div className="clientes-page__modal-acciones">
						<button className="btn btn-outline-secondary" type="button" onClick={cancelarGeneracionUsuario} disabled={guardandoUsuario}>Cancelar</button>
						<button className="btn btn-dark" type="submit" disabled={guardandoUsuario}>{guardandoUsuario ? 'Generando...' : 'Generar usuario'}</button>
					</div>
				</form>
			</section>
		</div>}

		{clienteAEliminar && <div className="clientes-page__modal-fondo">
			<section className="clientes-page__modal" role="dialog" aria-modal="true" aria-labelledby="eliminar-cliente-titulo">
				<div className="clientes-page__modal-cabecera"><h2 id="eliminar-cliente-titulo">Eliminar cliente</h2></div>
				<p>¿Seguro que querés eliminar a {clienteAEliminar.nombre} {clienteAEliminar.apellido}? Esta acción no se puede deshacer.</p>
				<form onSubmit={confirmarEliminacion} className="clientes-page__modal-acciones">
					<button className="btn btn-outline-secondary" type="button" onClick={() => setClienteAEliminar(null)} disabled={eliminando}>Cancelar</button>
					<button className="btn btn-danger" type="submit" disabled={eliminando}>{eliminando ? 'Eliminando...' : 'Eliminar cliente'}</button>
				</form>
			</section>
		</div>}

		{aviso && <div className="clientes-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) setAviso(null) }}><section className="clientes-page__modal" role="dialog" aria-modal="true" aria-labelledby="cliente-modal-titulo"><div className="clientes-page__modal-cabecera"><h2 id="cliente-modal-titulo">{aviso.titulo}</h2><button className="clientes-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setAviso(null)}>×</button></div><p>{aviso.mensaje}</p><div className="clientes-page__modal-acciones"><button className="btn btn-dark" type="button" onClick={() => setAviso(null)}>Entendido</button></div></section></div>}
	</section>
}

export default ClientesPage
