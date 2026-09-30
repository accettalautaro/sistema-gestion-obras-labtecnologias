const URL_BASE = '/Back/data'

export async function obtenerDatosPanel() {
  const t = Date.now()
  const [obrasRes, clientesRes, tareasRes] = await Promise.all([
    fetch(`${URL_BASE}/obras.json?t=${t}`),
    fetch(`${URL_BASE}/clientes.json?t=${t}`),
    fetch(`${URL_BASE}/tareas.json?t=${t}`)
  ])

  if (!obrasRes.ok || !clientesRes.ok || !tareasRes.ok) {
    throw new Error('No se pudieron obtener los datos del panel.')
  }

  const obrasData = await obrasRes.json()
  const clientesData = await clientesRes.json()
  const tareasData = await tareasRes.json()

  const obrasRaw = Array.isArray(obrasData) ? obrasData : obrasData.obras || []
  const clientesRaw = Array.isArray(clientesData) ? clientesData : clientesData.clientes || []
  const tareasRaw = Array.isArray(tareasData) ? tareasData : tareasData.tareas || []

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

  const tareas = tareasRaw.map(t => ({
    ...t,
    id: t['id-tarea'] || t.id,
    obraId: t['id-obra'] || t.obraId,
    CostReal: t['costo-real'] || t.CostReal
  }))

  return { obras, clientes, tareas }
}