import { useOutletContext, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function PrincipalPage() {
	const { usuario } = useOutletContext()
	const [obras, setObras] = useState([])
	const [usuarios, setUsuarios] = useState([])
	const [loading, setLoading] = useState(true)
	const [errorApi, setErrorApi] = useState(false)

	useEffect(() => {
		const fetchData = async () => {
			try {
				const [obrasRes, usuariosRes] = await Promise.all([
					fetch('/backend/data/obras.json'),
					fetch('/backend/data/usuarios.json')
				])
				
				if (obrasRes.ok && usuariosRes.ok) {
					const obrasData = await obrasRes.json()
					const usuariosData = await usuariosRes.json()
					
					// obras.json is wrapped in { obras: [...] }
					setObras(obrasData.obras || [])
					setUsuarios(usuariosData)
				} else {
					setErrorApi(true)
				}
			} catch (error) {
				console.error("Error al cargar datos del dashboard", error)
				setErrorApi(true)
			} finally {
				setLoading(false)
			}
		}

		fetchData()
	}, [])

	if (!usuario) return <Navigate to="/login" replace />

	if (loading) {
		return <div className="p-4 text-center">Cargando estadísticas...</div>
	}

	if (errorApi) {
		return (
			<div className="container-fluid p-4">
				<div className="alert alert-danger" role="alert">
					<h4 className="alert-heading">¡No se pudieron cargar las obras!</h4>
					<p>El frontend intentó conectarse con <code>/api/obras</code> pero el servidor devolvió un error (404).</p>
					<hr />
					<p className="mb-0"><strong>Solución:</strong> Necesitás reiniciar el servidor backend que tenés corriendo en tu terminal. Detenelo (Ctrl + C) y volvé a ejecutar <code>node server.js</code> para que reconozca las nuevas rutas que agregamos recién.</p>
				</div>
			</div>
		)
	}

	// Cálculos de Obras
	const activas = obras.filter(o => o.Estado?.toLowerCase().includes('ejecución') || o.Estado?.toLowerCase().includes('activa')).length
	const terminadas = obras.filter(o => o.Estado?.toLowerCase().includes('terminada') || o.Estado?.toLowerCase().includes('finalizada') || o.Estado?.toLowerCase().includes('completada')).length
	const pausadas = obras.filter(o => o.Estado?.toLowerCase().includes('pausa')).length

	// Costo real total (sumando las tareas de cada obra)
	let costoRealTotal = 0
	obras.forEach(obra => {
		if (obra.tareas) {
			obra.tareas.forEach(tarea => {
				costoRealTotal += Number(tarea.CostReal || 0)
			})
		}
	})

	// Porcentaje total completado (Promedio simple del Porcentaje de cada obra)
	let sumaPorcentajes = 0
	obras.forEach(obra => {
		let num = parseInt((obra.Porcentaje || "0").replace('%', ''))
		if (!isNaN(num)) sumaPorcentajes += num
	})
	const porcentajePromedio = obras.length > 0 ? (sumaPorcentajes / obras.length).toFixed(1) : 0

	// Helper para obtener cliente
	const getClienteNombre = (clienteId) => {
		const cliente = usuarios.find(u => String(u.id) === String(clienteId) || String(u.dni) === String(clienteId))
		return cliente ? cliente.nombre : `Cliente ID ${clienteId}`
	}

	// Helper para calcular tareas completadas
	const getPorcentajeTareas = (obra) => {
		if (!obra.tareas || obra.tareas.length === 0) return 0
		
		let totalSubtareas = 0
		let completadas = 0

		obra.tareas.forEach(t => {
			if (t.subtareas && t.subtareas.length > 0) {
				t.subtareas.forEach(sub => {
					totalSubtareas++
					// Con el nuevo JSON, se considera completada si tiene "100%"
					if (sub.Porcentaje === "100%") {
						completadas++
					}
				})
			} else {
				totalSubtareas++
				if (t.Porcentaje === "100%") {
					completadas++
				}
			}
		})

		if (totalSubtareas === 0) return 0
		return Math.round((completadas / totalSubtareas) * 100)
	}

	return (
		<div className="container-fluid">
			<div className="row mb-4">
				<div className="col-12">
					<h1 className="h3 mb-2 text-gray-800">Hola, {usuario.nombre}</h1>
					<p className="text-muted">Estas son las estadísticas generales de los proyectos.</p>
				</div>
			</div>

			{/* Tarjetas de estadísticas */}
			<div className="row mb-4">
				<div className="col-xl-3 col-md-6 mb-4">
					<div className="card border-left-primary shadow h-100 py-2">
						<div className="card-body">
							<div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Obras Activas</div>
							<div className="h5 mb-0 font-weight-bold text-gray-800">{activas}</div>
						</div>
					</div>
				</div>

				<div className="col-xl-3 col-md-6 mb-4">
					<div className="card border-left-success shadow h-100 py-2">
						<div className="card-body">
							<div className="text-xs font-weight-bold text-success text-uppercase mb-1">Obras Terminadas</div>
							<div className="h5 mb-0 font-weight-bold text-gray-800">{terminadas}</div>
						</div>
					</div>
				</div>

				<div className="col-xl-3 col-md-6 mb-4">
					<div className="card border-left-warning shadow h-100 py-2">
						<div className="card-body">
							<div className="text-xs font-weight-bold text-warning text-uppercase mb-1">Obras en Pausa</div>
							<div className="h5 mb-0 font-weight-bold text-gray-800">{pausadas}</div>
						</div>
					</div>
				</div>

				<div className="col-xl-3 col-md-6 mb-4">
					<div className="card border-left-info shadow h-100 py-2">
						<div className="card-body">
							<div className="text-xs font-weight-bold text-info text-uppercase mb-1">Avance Global</div>
							<div className="h5 mb-0 font-weight-bold text-gray-800">{porcentajePromedio}%</div>
						</div>
					</div>
				</div>
				
				<div className="col-xl-12 col-md-12 mb-4">
					<div className="card border-left-danger shadow h-100 py-2">
						<div className="card-body d-flex justify-content-between align-items-center">
							<div className="text-xs font-weight-bold text-danger text-uppercase mb-1">Costo Real Total Acumulado</div>
							<div className="h4 mb-0 font-weight-bold text-gray-800">${costoRealTotal.toLocaleString('es-AR')}</div>
						</div>
					</div>
				</div>
			</div>

			{/* Tabla de Obras */}
			<div className="card shadow mb-4">
				<div className="card-header py-3">
					<h6 className="m-0 font-weight-bold text-primary">Listado de Obras</h6>
				</div>
				<div className="card-body">
					<div className="table-responsive">
						<table className="table table-bordered" width="100%" cellSpacing="0">
							<thead className="table-light">
								<tr>
									<th>N° de Obra</th>
									<th>Cliente</th>
									<th>Estado</th>
									<th>% Completado (por tareas)</th>
								</tr>
							</thead>
							<tbody>
								{obras.length === 0 && (
									<tr>
										<td colSpan="4" className="text-center">No hay obras registradas.</td>
									</tr>
								)}
								{obras.map((obra) => {
									const porcentaje = getPorcentajeTareas(obra)
									return (
										<tr key={obra.id}>
											<td>#{obra.id}</td>
											<td>{getClienteNombre(obra.clienteId)}</td>
											<td>
												<span className={`badge ${obra.Estado?.toLowerCase().includes('ejecución') ? 'bg-primary' : 'bg-secondary'}`}>
													{obra.Estado}
												</span>
											</td>
											<td>
												<div className="d-flex align-items-center">
													<span className="me-2">{porcentaje}%</span>
													<div className="progress w-100" style={{ height: "10px" }}>
														<div className="progress-bar bg-success" role="progressbar" style={{ width: `${porcentaje}%` }} aria-valuenow={porcentaje} aria-valuemin="0" aria-valuemax="100"></div>
													</div>
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	)
}

export default PrincipalPage
