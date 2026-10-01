const URL_BASE = '/Back/data'

export async function obtenerDatosRecordatorios() {
  const t = Date.now()
  const [obrasRes, tareasRes, recordatoriosRes] = await Promise.all([
    fetch(`${URL_BASE}/obras.json?t=${t}`),
    fetch(`${URL_BASE}/tareas.json?t=${t}`),
    fetch(`${URL_BASE}/recordatorios.json?t=${t}`)
  ])

  if (!obrasRes.ok || !tareasRes.ok || !recordatoriosRes.ok) {
    throw new Error('No se pudieron obtener los datos de recordatorios.')
  }

  const obrasData = await obrasRes.json()
  const tareasData = await tareasRes.json()
  const recordatoriosData = await recordatoriosRes.json()

  const obrasRaw = Array.isArray(obrasData) ? obrasData : obrasData.obras || []
  const tareasRaw = Array.isArray(tareasData) ? tareasData : tareasData.tareas || []
  const recordatoriosRaw = Array.isArray(recordatoriosData) ? recordatoriosData : recordatoriosData.recordatorios || []

  const obras = obrasRaw.map(o => ({
    ...o,
    id: o['id-obra'] || o.id,
    clienteId: o['id-cliente'] || o.clienteId,
    estado: o.Estado || o.estado,
    porcentaje: o.porcentaje || o.Porcentaje,
  }))

  const tareas = tareasRaw.map(t => ({
    ...t,
    id: t['id-tarea'] || t.id,
    obraId: t['id-obra'] || t.obraId,
    fechaInicio: t['fecha-inicio'] || t.fechaInicio,
    fechaFin: t['fecha-fin'] || t.fechaFin,
  }))

  const recordatorios = recordatoriosRaw.map(r => ({
    ...r
  }))

  return { obras, tareas, recordatorios }
}
