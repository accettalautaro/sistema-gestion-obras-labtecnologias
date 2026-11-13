import { api, jsonBody } from '../../../shared/services/api.js'
import { listarTareas } from '../../obras/services/tareasService.js'

const formatoPago = (p) => ({
  'id-pago': p.id_pago, 'id-tarea': `${p.id_tarea}_${p.id_subtarea}`, 'id-subtarea': p.id_subtarea,
  'id-obra': p.id_obra, 'id-tarea-padre': p.id_tarea,
  descripcion: p.descripcion ?? '', monto: Number(p.monto) || 0,
})

export async function listarPagosParciales() {
  return (await api('/pagos')).map(formatoPago)
}

export async function listarPagos() {
  const [pagos, obrasApi, todasLasTareas] = await Promise.all([listarPagosParciales(), api('/obras'), listarTareas()])
  const tareas = todasLasTareas.filter((tarea) => tarea._dbSubtareaId)
  const obras = obrasApi.map((o) => {
    const tareasObra = todasLasTareas.filter((tarea) => String(tarea['id-obra']) === String(o.id_obra))
    const subtareas = tareasObra.filter((tarea) => tarea._dbSubtareaId)
    const unidadesCosto = subtareas.length ? subtareas : tareasObra.filter((tarea) => !String(tarea['id-tarea']).includes('_'))
    return {
    'id-obra': o.id_obra, 'id-cliente': o.id_cliente, Estado: o.estado, estado: o.estado,
    nrolote: o.nro_lote, descripcion: o.descripcion, nombre: o.nombre,
    clienteNombre: [o.cliente_nombre, o.cliente_apellido].filter(Boolean).join(' '),
    costoTotal: unidadesCosto.reduce((total, tarea) => total + (Number(tarea['costo-estimado']) || 0), 0),
    }
  })
  return { pagos, obras, tareas }
}

export async function crearPago(datos) {
  const tarea = (await listarTareas()).find((item) => String(item['id-tarea']) === String(datos['id-tarea']))
  if (!tarea?._dbSubtareaId || !Number.isFinite(Number(datos.monto)) || Number(datos.monto) <= 0) {
    throw new Error('Completá una subtarea y un monto válido.')
  }
  return formatoPago(await api('/pagos', {
    method: 'POST', body: jsonBody({ id_subtarea: Number(tarea._dbSubtareaId), descripcion: datos.descripcion.trim(), monto: Number(datos.monto) }),
  }))
}

export async function actualizarPago(id, datos) {
  const tarea = (await listarTareas()).find((item) => String(item['id-tarea']) === String(datos['id-tarea']))
  const idSubtarea = datos['id-subtarea'] ?? tarea?._dbSubtareaId
  if (!idSubtarea) throw new Error('Seleccioná una subtarea válida para el pago.')
  return formatoPago(await api(`/pagos/${id}`, {
    method: 'PUT', body: jsonBody({ id_subtarea: Number(idSubtarea), descripcion: datos.descripcion, monto: Number(datos.monto) }),
  }))
}

export const eliminarPago = (id) => api(`/pagos/${id}`, { method: 'DELETE' })
