const URL_BASE = '/Back/data'
import { listarTareas } from '../../obras/services/tareasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'
import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'

export async function obtenerDatosRecordatorios() {
  const t = Date.now()
  const [obrasRes, recordatoriosRes, clientesRes, tareas, pagos] = await Promise.all([
    fetch(`${URL_BASE}/obras.json?t=${t}`),
    fetch(`${URL_BASE}/recordatorios.json?t=${t}`),
    fetch(`${URL_BASE}/clientes.json?t=${t}`),
    listarTareas(),
    listarPagosParciales()
  ])

  if (!obrasRes.ok || !recordatoriosRes.ok || !clientesRes.ok) {
    throw new Error('No se pudieron obtener los datos de recordatorios.')
  }

  const obrasData = await obrasRes.json()
  const recordatoriosData = await recordatoriosRes.json()
  const clientesData = await clientesRes.json()

  const obrasRaw = Array.isArray(obrasData) ? obrasData : obrasData.obras || []
  const recordatoriosRaw = Array.isArray(recordatoriosData) ? recordatoriosData : recordatoriosData.recordatorios || []
  const clientesRaw = Array.isArray(clientesData) ? clientesData : clientesData.clientes || []

  const obras = obrasRaw.map(o => ({
    ...o,
    id: o['id-obra'] || o.id,
    clienteId: o['id-cliente'] || o.clienteId,
    estado: o.Estado || o.estado,
    porcentaje: o.porcentaje || o.Porcentaje,
  }))

  const tareasNormalizadas = tareas.map(t => ({
    ...t,
    id: t['id-tarea'] || t.id,
    obraId: t['id-obra'] || t.obraId,
    fechaInicio: t['fecha-inicio'] || t.fechaInicio,
    fechaFin: t['fecha-fin'] || t.fechaFin,
  }))

  const recordatorios = recordatoriosRaw.map(r => ({
    ...r
  }))

  const clientes = clientesRaw.map(c => ({
    ...c,
    id: c['id-cliente'] || c.id,
  }))

  const tareasDerivadas = obras.flatMap((obra) => resumirAvanceTareas(tareasNormalizadas.filter((t) => String(t.obraId) === String(obra.id)), pagos).etapas.flatMap((etapa) => [etapa, ...etapa.subtareas]))
  return { obras, tareas: tareasDerivadas, recordatorios, clientes }
}

export async function crearRecordatorio(nuevoRecordatorio) {
  // Simulando llamada a la API
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true)
    }, 500)
  })
}
