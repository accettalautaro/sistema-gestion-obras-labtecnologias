import { api, jsonBody } from '../../../shared/services/api.js'

const mapearTerreno = (lote) => ({
  ...lote, id: lote.id_lote, idLote: lote.id_lote,
  'id-lote': lote.id_lote, nrolote: lote.nro_lote,
  direcciones: lote.direccion ? [{ ...lote.direccion, 'id-direc': lote.id_direccion, codpos: lote.direccion.codigo_postal }] : [],
  mensuras: (lote.mensuras ?? []).map((m) => ({ ...m, id: m.id_documento })),
  escrituras: (lote.escrituras ?? []).map((e) => ({
    ...e, documentoId: e.id_documento, nroescritura: e.nro_escritura,
    propietarios: (e.propietarios ?? []).map((p) => ({
      ...p, 'id-propietario': p.id_propietario, estadocivil: p.estado_civil,
    })),
  })),
  obras: (lote.obras ?? []).map((obra) => ({ 'id-obra': obra.id_obra, Estado: obra.estado })),
})

export async function listarTerrenos() {
  return (await api('/terrenos')).map(mapearTerreno)
}

export async function obtenerTerreno(id) { return mapearTerreno(await api(`/terrenos/${id}`)) }

export async function crearTerreno(datos) {
  const numeroLote = datos.nrolote ?? datos.numero
  const direccion = datos.direccion ?? {
    calle: datos.calle, altura: datos.altura, localidad: datos.localidad,
    provincia: datos.provincia, codpos: datos.codpos ?? datos.codigoPostal,
  }
  const ancho = datos.mensura?.ancho ?? datos.ancho
  const largo = datos.mensura?.largo ?? datos.largo
  const body = {
    nro_lote: numeroLote,
    direccion: direccion?.calle ? {
      calle: direccion.calle, altura: direccion.altura || null,
      localidad: direccion.localidad || null, provincia: direccion.provincia || null,
      codigo_postal: direccion.codpos || direccion.codigo_postal || null,
    } : null,
    mensura: ancho || largo ? { nombre: datos.mensura?.nombre || `Mensura lote ${numeroLote}`, ancho, largo } : null,
  }
  const creado = await api('/terrenos', { method: 'POST', body: jsonBody(body) })
  if (datos.numeroEscritura) {
    const escritura = await api('/terrenos/escrituras', { method: 'POST', body: jsonBody({
      id_lote: creado.id_lote, nombre: `Escritura ${datos.numeroEscritura}`,
      nro_escritura: String(datos.numeroEscritura),
    }) })
    const propietarios = Array.isArray(datos.propietarios)
      ? datos.propietarios
      : datos.propietario ? [datos.propietario] : []
    if (propietarios.length) {
      const personas = await api('/terrenos/propietarios')
      if (!Array.isArray(personas)) throw new Error('El servidor devolvió una lista de propietarios inválida.')
      for (const propietario of propietarios) {
        const existente = personas.find((p) => String(p.dni) === String(propietario.dni))
        if (existente) {
          await api(`/terrenos/escrituras/${escritura.id_documento}/propietarios/${existente.id_propietario}`, {
            method: 'POST', body: jsonBody({ porcentaje: Number(propietario.porcentaje) }),
          })
        } else {
          const creadoPropietario = await api('/terrenos/propietarios', { method: 'POST', body: jsonBody({
            id_documento: escritura.id_documento, nombre: propietario.nombre,
            apellido: propietario.apellido, dni: propietario.dni,
            estado_civil: propietario.estadoCivil ?? null, porcentaje: Number(propietario.porcentaje),
          }) })
          personas.push(creadoPropietario)
        }
      }
    }
  }
  return mapearTerreno(await api(`/terrenos/${creado.id_lote}`))
}

export async function actualizarTerreno(id, datos) {
  const actual = await api(`/terrenos/${id}`)
  const direccionActual = actual.direccion
  const direccion = datos.direccion ?? datos
  let idDireccion = actual.id_direccion
  const cuerpoDireccion = {
    calle: direccion.calle || direccionActual?.calle || '', altura: direccion.altura || null,
    piso: direccion.piso || null, departamento: direccion.departamento || null,
    localidad: direccion.localidad || null, provincia: direccion.provincia || null,
    codigo_postal: direccion.codpos || direccion.codigoPostal || direccion.codigo_postal || null,
  }
  if (cuerpoDireccion.calle) {
    if (idDireccion) await api(`/terrenos/direcciones/${idDireccion}`, { method: 'PUT', body: jsonBody(cuerpoDireccion) })
    else idDireccion = (await api('/terrenos/direcciones', { method: 'POST', body: jsonBody(cuerpoDireccion) })).id_direccion
  }
  await api(`/terrenos/${id}`, { method: 'PUT', body: jsonBody({
    nro_lote: datos.nro_lote ?? datos.nrolote ?? datos.numero ?? actual.nro_lote,
    id_direccion: idDireccion,
  }) })
  const mensura = datos.mensura ?? datos
  if (mensura.ancho !== undefined || mensura.largo !== undefined) {
    const existente = actual.mensuras?.[0]
    if (existente) await api(`/terrenos/mensuras/${existente.id_documento}`, { method: 'PUT', body: jsonBody({
      nombre: existente.nombre, descripcion: existente.descripcion, archivo: existente.archivo,
      ancho: Number(mensura.ancho) || null, largo: Number(mensura.largo) || null,
    }) })
    else await api('/terrenos/mensuras', { method: 'POST', body: jsonBody({
      id_lote: Number(id), nombre: `Mensura lote ${datos.nrolote ?? datos.numero ?? actual.nro_lote}`,
      ancho: Number(mensura.ancho) || null, largo: Number(mensura.largo) || null,
    }) })
  }
  return mapearTerreno(await api(`/terrenos/${id}`))
}
export const eliminarTerreno = (id) => api(`/terrenos/${id}`, { method: 'DELETE' })
