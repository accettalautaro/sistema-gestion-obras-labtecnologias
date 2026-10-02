import { listarTareas } from '../../obras/services/tareasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'
import { derivarTareas } from '../../../shared/utils/avanceObra.js'
const URL_BASE = '/Back/data'

export async function obtenerDatosPanel() {
  const t = Date.now()
  const [obrasRes, clientesRes, tareasRaw, pagos] = await Promise.all([
    fetch(`${URL_BASE}/obras.json?t=${t}`),
    fetch(`${URL_BASE}/clientes.json?t=${t}`),
    listarTareas(),
    listarPagosParciales()
  ])

  if (!obrasRes.ok || !clientesRes.ok) {
    throw new Error('No se pudieron obtener los datos del panel.')
  }

  const obrasData = await obrasRes.json()
  const clientesData = await clientesRes.json()

  const obrasRaw = Array.isArray(obrasData) ? obrasData : obrasData.obras || []
  const clientesRaw = Array.isArray(clientesData) ? clientesData : clientesData.clientes || []

  // Mapear claves de JSON a las esperadas por el frontend
  const obras = obrasRaw.map(o => ({
    ...o,
    id: o['id-obra'] || o.id,
    clienteId: o['id-cliente'] || o.clienteId,
    Porcentaje: o.porcentaje || o.Porcentaje,
    loteId: o.nrolote || o.loteId
  }))

  const clientes = clientesRaw.map(c => ({
    ...c,
    id: c['id-cliente'] || c.id
  }))

  const tareasDerivadas = derivarTareas(tareasRaw, pagos)
  const tareas = tareasDerivadas.map(t => ({
    ...t,
    id: t['id-tarea'] || t.id,
    obraId: t['id-obra'] || t.obraId,
    CostReal: t['costo-real'] || t.CostReal,
    EsUnidadFinal: t.esUnidadFinal,
  }))

  return { obras, clientes, tareas }
}
