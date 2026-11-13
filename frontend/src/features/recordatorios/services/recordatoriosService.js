import { api, jsonBody } from '../../../shared/services/api.js'
export async function obtenerDatosRecordatorios() {
  const [obrasApi, recordatoriosApi, clientesApi] = await Promise.all([
    api('/obras'), api('/recordatorios'), api('/clientes'),
  ])
  const obras = obrasApi.map((o) => ({
    ...o, id: o.id_obra, 'id-obra': o.id_obra, clienteId: o.id_cliente,
    'id-cliente': o.id_cliente, estado: o.estado, Estado: o.estado,
  }))
  const clientes = clientesApi.map((c) => ({
    ...c, id: c.id_cliente, nombre: c.nombre ?? c.Nombre ?? '', apellido: c.apellido ?? c.Apellido ?? '',
  }))
  const recordatorios = recordatoriosApi.map((r) => ({
    ...r, id: r.id_recordatorio, obraId: r.id_obra,
    fecha: typeof r.fecha === 'string' ? r.fecha.slice(0, 10) : '',
    descripcion: r.descripcion ?? '',
    'id-recordatorio': r.id_recordatorio, 'id-obra': r.id_obra,
  }))
  return { obras, recordatorios, clientes }
}

export async function crearRecordatorio(recordatorio) {
  return api('/recordatorios', { method: 'POST', body: jsonBody({
    id_obra: Number(recordatorio['id-obra']), fecha: recordatorio.fecha,
    descripcion: recordatorio.descripcion.trim(),
  }) })
}

export const actualizarRecordatorio = (id, recordatorio) => api(`/recordatorios/${id}`, {
  method: 'PUT', body: jsonBody({ id_obra: Number(recordatorio['id-obra']), fecha: recordatorio.fecha, descripcion: recordatorio.descripcion.trim() }),
})

export const eliminarRecordatorio = (id) => api(`/recordatorios/${id}`, { method: 'DELETE' })
