import { api, jsonBody } from '../../../shared/services/api.js'
import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'

export async function obtenerDatosRecordatorios() {
  const [obrasApi, recordatoriosApi, clientesApi, tareasApi] = await Promise.all([
    api('/obras'), api('/recordatorios'), api('/clientes'), api('/tareas'),
  ])
  const obras = obrasApi.map((o) => ({
    ...o, id: o.id_obra, 'id-obra': o.id_obra, clienteId: o.id_cliente,
    'id-cliente': o.id_cliente, estado: o.estado, Estado: o.estado,
  }))
  const tareas = tareasApi.map((t) => ({
    ...t, 'id-tarea': t.id_tarea, 'id-obra': t.id_obra,
    'fecha-inicio': t.fecha_inicio, 'fecha-fin': t.fecha_fin,
  }))
  const clientes = clientesApi.map((c) => ({ ...c, id: c.id_cliente }))
  const recordatorios = recordatoriosApi.map((r) => ({
    ...r, 'id-recordatorio': r.id_recordatorio, 'id-obra': r.id_obra,
  }))
  const tareasDerivadas = obras.flatMap((obra) => resumirAvanceTareas(
    tareas.filter((t) => String(t['id-obra']) === String(obra.id)),
  ).etapas.flatMap((etapa) => [etapa, ...etapa.subtareas]))
  return { obras, tareas: tareasDerivadas, recordatorios, clientes }
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
