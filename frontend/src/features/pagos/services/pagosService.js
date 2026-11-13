import { api, jsonBody } from '../../../shared/services/api.js'

const formatoPago = (p) => ({
  'id-pago': p.id_pago, 'id-tarea': p.id_subtarea, 'id-subtarea': p.id_subtarea,
  'id-obra': p.id_obra, 'id-tarea-padre': p.id_tarea,
  descripcion: p.descripcion ?? '', monto: Number(p.monto) || 0,
})

export async function listarPagosParciales() {
  return (await api('/pagos')).map(formatoPago)
}

export async function listarPagos() {
  const [pagos, obrasApi, tareasApi] = await Promise.all([
    listarPagosParciales(), api('/obras'), api('/tareas'),
  ])
  const obras = obrasApi.map((o) => ({
    'id-obra': o.id_obra, 'id-cliente': o.id_cliente, Estado: o.estado,
    nrolote: o.nro_lote, descripcion: o.descripcion,
  }))
  const detalles = await Promise.all(tareasApi.map((t) => api(`/tareas/${t.id_tarea}`)))
  const tareas = detalles.flatMap((t) => (t.subtareas ?? []).map((s) => ({
    'id-obra': t.id_obra, 'id-tarea': s.id_subtarea, nombre: `${t.nombre} · ${s.nombre}`,
  })))
  return { pagos, obras, tareas }
}

export async function crearPago(datos) {
  if (!datos['id-tarea'] || !Number.isFinite(Number(datos.monto)) || Number(datos.monto) <= 0) {
    throw new Error('Completá una subtarea y un monto válido.')
  }
  return formatoPago(await api('/pagos', {
    method: 'POST', body: jsonBody({ id_subtarea: Number(datos['id-tarea']), descripcion: datos.descripcion.trim(), monto: Number(datos.monto) }),
  }))
}

export async function actualizarPago(id, datos) {
  return formatoPago(await api(`/pagos/${id}`, {
    method: 'PUT', body: jsonBody({ id_subtarea: Number(datos['id-tarea']), descripcion: datos.descripcion, monto: Number(datos.monto) }),
  }))
}

export const eliminarPago = (id) => api(`/pagos/${id}`, { method: 'DELETE' })
