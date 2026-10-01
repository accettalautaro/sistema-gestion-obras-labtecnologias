import { useState } from 'react'
import { useFetch } from '../../../shared/hooks/useFetch'
import { useOutletContext } from 'react-router-dom'
import { listarClientes } from '../services/clientesService.js'
import '../../../styles/Clientes.css'

const FORMULARIO_VACIO = { nombre: '', apellido: '', dni: '', telefono: '', email: '' }

function ClientesPage() {
	const { esArquitecto } = useOutletContext()
	const [busqueda, setBusqueda] = useState('')
	const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
	const [clienteEditando, setClienteEditando] = useState(null)
	const [aviso, setAviso] = useState(null)
	const { datos, cargando, error } = useFetch(listarClientes)

	if (esArquitecto === null) return <p className="clientes-page__estado" role="status">Verificando acceso de arquitecto...</p>
	if (!esArquitecto) return <div className="alert alert-danger" role="alert">Esta pantalla está disponible únicamente para cuentas vinculadas a un arquitecto.</div>
	if (cargando) return <p className="clientes-page__estado" role="status">Cargando clientes...</p>
	if (error) return <div className="alert alert-danger" role="alert">{error.message}</div>

	const { listaClientes = [] } = datos || {}
	const clientesFiltrados = listaClientes.filter((cliente) =>
		[cliente.nombre, cliente.apellido, cliente.dni, cliente.telefono, cliente.email]
			.some((valor) => String(valor ?? '').toLowerCase().includes(busqueda.trim().toLowerCase())),
	)

	const editar = (cliente) => {
		setClienteEditando(cliente['id-cliente'])
		setFormulario({ nombre: cliente.nombre ?? '', apellido: cliente.apellido ?? '', dni: cliente.dni ?? '', telefono: cliente.telefono ?? '', email: cliente.email ?? '' })
	}
	const cancelarEdicion = () => {
		setClienteEditando(null)
		setFormulario(FORMULARIO_VACIO)
	}
	const guardar = (event) => {
		event.preventDefault()
		setAviso({ titulo: clienteEditando === null ? 'Cliente no creado' : 'Cambios no guardados', mensaje: 'El formulario es una vista previa. En esta entrega los datos se leen desde el JSON y no se guardan cambios.' })
	}
	const eliminar = (cliente) => setAviso({ titulo: 'Cliente no eliminado', mensaje: `El perfil de ${cliente.nombre} ${cliente.apellido} sigue en el JSON. La eliminación estará disponible cuando se implemente el backend.` })

	return <section className="clientes-page">
		<header className="clientes-page__header">
			<div><p className="clientes-page__eyebrow">Área privada</p><h1>Gestión de clientes</h1><p>Perfiles de clientes y sus cuentas vinculadas.</p></div>
			<span className="clientes-page__count">{listaClientes.length} {listaClientes.length === 1 ? 'perfil' : 'perfiles'}</span>
		</header>

		<div className="alert alert-info clientes-page__persistencia" role="note"><strong>Modo consulta:</strong> la información se lee desde los archivos JSON. Crear, editar o eliminar estará disponible cuando se conecte el backend.</div>

		<div className="clientes-page__workspace">
			<section className="clientes-page__listado" aria-labelledby="clientes-listado-titulo">
				<div className="clientes-page__toolbar"><h2 id="clientes-listado-titulo">Perfiles registrados</h2><label className="clientes-page__busqueda"><span className="visually-hidden">Buscar clientes</span><input className="form-control" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} placeholder="Buscar por nombre, DNI o contacto" /></label></div>
				<div className="table-responsive"><table className="table table-hover align-middle clientes-page__tabla">
					<thead><tr><th>Cliente</th><th>DNI</th><th>Teléfono</th><th>Email</th><th>Cuenta</th><th><span className="visually-hidden">Acciones</span></th></tr></thead>
					<tbody>
						{clientesFiltrados.map((cliente) => <tr key={cliente['id-cliente']}>
							<td className="clientes-page__nombre">{cliente.nombre} {cliente.apellido}</td><td>{cliente.dni}</td><td>{cliente.telefono}</td><td>{cliente.email}</td>
							<td><span className="clientes-page__cuenta">#{cliente['id-usuario']}</span></td>
							<td><div className="clientes-page__acciones"><button className="btn btn-sm btn-outline-secondary" type="button" onClick={() => editar(cliente)}>Editar</button><button className="btn btn-sm btn-outline-danger" type="button" onClick={() => eliminar(cliente)}>Eliminar</button></div></td>
						</tr>)}
						{!clientesFiltrados.length && <tr><td colSpan="6" className="clientes-page__vacio">{busqueda ? 'No hay coincidencias.' : 'Todavía no hay perfiles registrados.'}</td></tr>}
					</tbody>
				</table></div>
			</section>

			<section className="clientes-page__formulario" aria-labelledby="cliente-form-titulo">
				<div className="clientes-page__formulario-header"><div><h2 id="cliente-form-titulo">{clienteEditando === null ? 'Nuevo cliente' : `Editar cliente #${clienteEditando}`}</h2><p>Vista previa del formulario; los datos no se guardan.</p></div>{clienteEditando !== null && <button className="btn btn-sm btn-outline-secondary" type="button" onClick={cancelarEdicion}>Nuevo cliente</button>}</div>
				<form onSubmit={guardar}><div className="clientes-page__campos">
					<label>Nombre<input className="form-control" name="nombre" autoComplete="given-name" value={formulario.nombre} onChange={(event) => setFormulario({ ...formulario, nombre: event.target.value })} required /></label>
					<label>Apellido<input className="form-control" name="apellido" autoComplete="family-name" value={formulario.apellido} onChange={(event) => setFormulario({ ...formulario, apellido: event.target.value })} required /></label>
					<label>DNI<input className="form-control" name="dni" inputMode="numeric" value={formulario.dni} onChange={(event) => setFormulario({ ...formulario, dni: event.target.value })} required /></label>
					<label>Teléfono<input className="form-control" name="telefono" autoComplete="tel" value={formulario.telefono} onChange={(event) => setFormulario({ ...formulario, telefono: event.target.value })} required /></label>
					<label className="clientes-page__campo-completo">Email<input className="form-control" name="email" type="email" autoComplete="email" value={formulario.email} onChange={(event) => setFormulario({ ...formulario, email: event.target.value })} required /></label>
				</div><div className="clientes-page__form-actions">{clienteEditando !== null && <button className="btn btn-outline-secondary" type="button" onClick={cancelarEdicion}>Cancelar</button>}<button className="btn btn-dark" type="submit">{clienteEditando === null ? 'Crear cliente' : 'Guardar cambios'}</button></div></form>
			</section>
		</div>
		{aviso && <div className="clientes-page__modal-fondo" onMouseDown={(event) => { if (event.target === event.currentTarget) setAviso(null) }}><section className="clientes-page__modal" role="dialog" aria-modal="true" aria-labelledby="cliente-modal-titulo"><div className="clientes-page__modal-cabecera"><h2 id="cliente-modal-titulo">{aviso.titulo}</h2><button className="clientes-page__modal-cerrar" type="button" aria-label="Cerrar" onClick={() => setAviso(null)}>×</button></div><p>{aviso.mensaje}</p><div className="clientes-page__modal-acciones"><button className="btn btn-dark" type="button" onClick={() => setAviso(null)}>Entendido</button></div></section></div>}
	</section>
}

export default ClientesPage
