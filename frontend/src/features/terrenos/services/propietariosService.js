import { api, jsonBody } from '../../../shared/services/api.js'

function personasUnicasPorDni(personas) {
  return [...new Map(personas.map((p) => [String(p.dni), {
    nombre: p.nombre, apellido: p.apellido, dni: p.dni,
    estadocivil: p.estado_civil,
  }])).values()]
}

export async function listarPersonasPropietarias() {
  const personas = await api('/terrenos/propietarios')
  if (!Array.isArray(personas)) throw new Error('El servidor devolvió una lista de propietarios inválida.')
  return personasUnicasPorDni(personas)
}

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
    id_documento: escritura.id_documento, documentoId: escritura.id_documento, estadocivil: p.estado_civil,
  })))
  const personasUnicas = personasUnicasPorDni(await api('/terrenos/propietarios'))
  return {
    lote: { ...lote, id: lote.id_lote, nrolote: lote.nro_lote },
    escriturasLote: escriturasLote.map((e) => ({ ...e, documentoId: e.id_documento, nroescritura: e.nro_escritura })),
    propietariosLote, personasUnicas,
  }
}

function cuerpoPropietario(datos, id_documento) {
  return {
    nombre: datos.nombre, apellido: datos.apellido, dni: datos.dni,
    estado_civil: datos.estadoCivil ?? datos.estadocivil ?? null,
    porcentaje: Number(datos.porcentaje), ...(id_documento ? { id_documento: Number(id_documento) } : {}),
  }
}

export async function guardarPropietario(id, datos) {
  return id == null
    ? api('/terrenos/propietarios', { method: 'POST', body: jsonBody(cuerpoPropietario(datos, datos.id_documento)) })
    : api(`/terrenos/propietarios/${id}`, { method: 'PUT', body: jsonBody(cuerpoPropietario(datos, datos.id_documento)) })
}

export async function crearPropietario(idLote, idDocumento, datos) {
  const personas = await api('/terrenos/propietarios')
  const persona = personas.find((item) => String(item.dni) === String(datos.dni))
  if (persona) return api(`/terrenos/escrituras/${idDocumento}/propietarios/${persona.id_propietario}`, {
    method: 'POST', body: jsonBody({ porcentaje: Number(datos.porcentaje) }),
  })
  return guardarPropietario(null, { ...datos, id_documento: idDocumento })
}

export const actualizarPropietario = (_idLote, idDocumento, id, datos) =>
  guardarPropietario(id, { ...datos, id_documento: idDocumento })

export const eliminarPropietario = (_idLote, idDocumento, id) =>
  api(`/terrenos/escrituras/${idDocumento}/propietarios/${id}`, { method: 'DELETE' })
