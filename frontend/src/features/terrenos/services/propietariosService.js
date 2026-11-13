import { api, jsonBody } from '../../../shared/services/api.js'

export async function listarDatosPropietarios(nrolote) {
  const lotes = await api('/terrenos')
  const lote = lotes.find((item) => String(item.nro_lote) === String(nrolote))
  if (!lote) throw new Error('Lote no encontrado')
  const escrituras = await api('/terrenos/escrituras')
  const escriturasLote = escrituras.filter((e) => String(e.id_lote) === String(lote.id_lote))
  const grupos = await Promise.all(escriturasLote.map(async (e) => ({
    escritura: e,
    propietarios: await api(`/terrenos/propietarios?id_documento=${encodeURIComponent(e.id_documento)}`),
  })))
  const propietariosLote = grupos.flatMap(({ escritura, propietarios }) => propietarios.map((p) => ({
    ...p, 'id-propietario': p.id_propietario, nroescritura: escritura.nro_escritura,
    id_documento: escritura.id_documento, estadocivil: p.estado_civil,
  })))
  const personas = await api('/terrenos/propietarios')
  const personasUnicas = [...new Map(personas.map((p) => [String(p.dni), {
    nombre: p.nombre, apellido: p.apellido, dni: p.dni, estadocivil: p.estado_civil,
  }])).values()]
  return {
    lote: { ...lote, nrolote: lote.nro_lote },
    escriturasLote: escriturasLote.map((e) => ({ ...e, nroescritura: e.nro_escritura })),
    propietariosLote, personasUnicas,
  }
}

export async function guardarPropietario(id, datos) {
  const body = {
    nombre: datos.nombre, apellido: datos.apellido, dni: datos.dni,
    estado_civil: datos.estadocivil || null, porcentaje: Number(datos.porcentaje),
  }
  return id == null
    ? api('/terrenos/propietarios', { method: 'POST', body: jsonBody({ ...body, id_documento: Number(datos.id_documento) }) })
    : api(`/terrenos/propietarios/${id}`, { method: 'PUT', body: jsonBody(body) })
}

export const eliminarPropietario = (id) => api(`/terrenos/propietarios/${id}`, { method: 'DELETE' })
