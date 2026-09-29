import { useState } from 'react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useOutletContext } from 'react-router-dom'
import { actualizarCliente, crearCliente, eliminarCliente, listarClientes } from '../services/clientesService.js'
import '../../../styles/Clientes.css'

const FORMULARIO_VACIO = { nombre: '', apellido: '', dni: '', telefono: '', email: '', password: '' }

function ClientesPage() {
	const { esArquitecto } = useOutletContext()
	const [busqueda, setBusqueda] = useState('')
	const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
	const [clienteEditando, setClienteEditando] = useState(null)
	const [guardando, setGuardando] = useState(false)
	const [errorMutacion, setErrorMutacion] = useState('')
	const [exito, setExito] = useState('')
	const [version, setVersion] = useState(0)

	const { datos, cargando, error } = useFetch(listarClientes, version)

	if (esArquitecto === null) {
		return <p className="clientes-page__estado" role="status">Verificando acceso de arquitecto...</p>
	}
	if (!esArquitecto) {
		return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	}
	if (cargando) {
		return <p className="clientes-page__estado" role="status">Cargando clientes...</p>
	}
	if (error) {
		return <div className="alert alert-danger" role="alert">{error.message}</div>
	}

	const { listaClientes = [] } = datos || {}

	const clientesFiltrados = listaClientes.filter((cliente) =>
		[cliente.nombre, cliente.apellido, cliente.dni, cliente.telefono, cliente.email]
			.some((valor) => String(valor).toLowerCase().includes(busqueda.trim().toLowerCase())),
	)

	const editar = (cliente) => {
		setClienteEditando(cliente['id-cliente'])
		setFormulario({ ...cliente, password: '' })
		setErrorMutacion('')
		setExito('')
	}

	const cancelarEdicion = () => {
		setClienteEditando(null)
		setFormulario(FORMULARIO_VACIO)
	}

	const guardar = async (event) => {
		event.preventDefault()
		setGuardando(true)
		setErrorMutacion('')
		setExito('')
		try {
			if (clienteEditando === null) {
				await crearCliente(formulario)
			} else {
				await actualizarCliente(clienteEditando, formulario)
			}
			setExito(clienteEditando === null
				? 'Perfil y cuenta simulada creados solo en este navegador. El login actual no reconocerá esta cuenta.'
				: 'Perfil y datos compartidos de la cuenta local actualizados en este navegador.')
			cancelarEdicion()
			setVersion(v => v + 1) // Forzar refetch
		} catch (motivo) {
			setErrorMutacion(motivo.message || 'No se pudieron guardar los cambios.')
		} finally {
			setGuardando(false)
		}
	}

	const eliminar = async (cliente) => {
		const nombre = `${cliente.nombre} ${cliente.apellido}`
		if (!window.confirm(`¿Eliminar el perfil local de ${nombre}? Esta acción no modifica archivos JSON.`)) return

		setErrorMutacion('')
		setExito('')
		try {
			await eliminarCliente(cliente['id-cliente'])
			if (String(clienteEditando) === String(cliente['id-cliente'])) cancelarEdicion()
			setExito(`Se eliminó el perfil local de ${nombre}.`)
			setVersion(v => v + 1) // Forzar refetch
		} catch (motivo) {
			setErrorMutacion(motivo.message || 'No se pudo eliminar el perfil.')
		}
	}

	return (
		<section className="clientes-page">
			<header className="clientes-page__header">
				<div>
					<p className="clientes-page__eyebrow">Área privada</p>
					<h1>Gestión de clientes</h1>
					<p>Perfiles de clientes y sus cuentas vinculadas.</p>
				</div>
				<span className="clientes-page__count">{listaClientes.length} {listaClientes.length === 1 ? 'perfil' : 'perfiles'}</span>
			</header>

			<div className="alert alert-warning clientes-page__persistencia" role="note">
				<strong>Persistencia temporal:</strong> perfiles y cuentas vinculadas se guardan solo en el almacenamiento local de este navegador; no modifican los JSON. El login sigue leyendo <code>usuarios.json</code> estático, así que no reconocerá las cuentas creadas desde esta pantalla.
			</div>

			{errorMutacion && <div className="alert alert-danger" role="alert">{errorMutacion}</div>}
			{exito && <div className="alert alert-success" role="status">{exito}</div>}

			<div className="clientes-page__workspace">
				<section className="clientes-page__listado" aria-labelledby="clientes-listado-titulo">
					<div className="clientes-page__toolbar">
						<h2 id="clientes-listado-titulo">Perfiles registrados</h2>
						<label className="clientes-page__busqueda">
							<span className="visually-hidden">Buscar clientes</span>
							<input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, DNI o contacto" />
						</label>
					</div>

					{cargando ? <p className="clientes-page__estado" role="status">Cargando clientes...</p> : (
						<div className="table-responsive">
							<table className="table table-hover align-middle clientes-page__tabla">
								<thead><tr><th>Cliente</th><th>DNI</th><th>Teléfono</th><th>Email</th><th>Cuenta</th><th><span className="visually-hidden">Acciones</span></th></tr></thead>
								<tbody>
									{clientesFiltrados.map((cliente) => (
										<tr key={cliente['id-cliente']}>
											<td className="clientes-page__nombre">{cliente.nombre} {cliente.apellido}</td>
											<td>{cliente.dni}</td><td>{cliente.telefono}</td><td>{cliente.email}</td>
											<td><span className="clientes-page__cuenta">#{cliente['id-usuario']}</span></td>
											<td><div className="clientes-page__acciones">
												<button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(cliente)}>Editar</button>
												<button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(cliente)}>Eliminar</button>
											</div></td>
										</tr>
									))}
									{!clientesFiltrados.length && <tr><td colSpan="6" className="clientes-page__vacio">{busqueda ? 'No hay coincidencias.' : 'Todavía no hay perfiles registrados.'}</td></tr>}
								</tbody>
							</table>
						</div>
					)}
				</section>

				<section className="clientes-page__formulario" aria-labelledby="cliente-form-titulo">
					<h2 id="cliente-form-titulo">{clienteEditando === null ? 'Nuevo cliente' : 'Editar cliente'}</h2>
					<form onSubmit={guardar}>
						<div className="clientes-page__campos">
							<label>Nombre<input className="form-control" name="nombre" autoComplete="given-name" value={formulario.nombre} onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })} required /></label>
							<label>Apellido<input className="form-control" name="apellido" autoComplete="family-name" value={formulario.apellido} onChange={(event) => setFormulario({ ...formulario, apellido: event.target.value })} required /></label>
							<label>DNI<input className="form-control" name="dni" inputMode="numeric" value={formulario.dni} onChange={(event) => setFormulario({ ...formulario, dni: event.target.value })} required /></label>
							<label>Teléfono<input className="form-control" name="telefono" autoComplete="tel" value={formulario.telefono} onChange={(event) => setFormulario({ ...formulario, telefono: event.target.value })} required /></label>
							<label className="clientes-page__campo-completo">Email<input className="form-control" name="email" type="email" autoComplete="email" value={formulario.email} onChange={(event) => setFormulario({ ...formulario, email: event.target.value })} required /></label>
							{clienteEditando === null && <label className="clientes-page__campo-completo">Contraseña inicial de la cuenta<input className="form-control" name="password" type="password" autoComplete="new-password" minLength="8" value={formulario.password} onChange={(event) => setFormulario({ ...formulario, password: event.target.value })} required /><small>Se conserva solo como dato local de prueba; nunca aparece en el listado.</small></label>}
						</div>
						<div className="clientes-page__form-actions">
							{clienteEditando !== null && <button className="btn btn-outline-secondary" type="button" onClick={cancelarEdicion}>Cancelar</button>}
							<button className="btn btn-dark" type="submit" disabled={guardando}>{guardando ? 'Guardando...' : clienteEditando === null ? 'Crear cliente' : 'Guardar cambios'}</button>
						</div>
					</form>
				</section>
			</div>
		</section>
	)
}

export default ClientesPage