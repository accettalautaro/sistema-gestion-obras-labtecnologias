import { api, jsonBody } from '../../../shared/services/api.js'

const mapearTerreno = (lote) => ({
  ...lote, 'id-lote': lote.id_lote, nrolote: lote.nro_lote,
  direcciones: lote.direccion ? [{ ...lote.direccion, codpos: lote.direccion.codigo_postal }] : [],
  mensuras: lote.mensuras ?? [], escrituras: lote.escrituras ?? [],
  obras: lote.obra ? [{ 'id-obra': lote.obra.id_obra, Estado: lote.obra.estado }] : [],
})

export async function listarTerrenos() {
  return (await api('/terrenos')).map(mapearTerreno)
}

export async function obtenerTerreno(id) { return mapearTerreno(await api(`/terrenos/${id}`)) }

export async function crearTerreno(datos) {
  const body = {
    nro_lote: datos.nrolote, id_obra: datos.idObra || null,
    direccion: datos.direccion ? {
      calle: datos.direccion.calle, altura: datos.direccion.altura || null,
      localidad: datos.direccion.localidad || null, provincia: datos.direccion.provincia || null,
      codigo_postal: datos.direccion.codpos || null,
    } : null,
    mensura: datos.mensura ?? null,
  }
  return mapearTerreno(await api('/terrenos', { method: 'POST', body: jsonBody(body) }))
}

export const actualizarTerreno = (id, datos) => api(`/terrenos/${id}`, {
  method: 'PUT', body: jsonBody({ nro_lote: datos.nro_lote, id_direccion: datos.id_direccion, id_obra: datos.id_obra }),
})
export const eliminarTerreno = (id) => api(`/terrenos/${id}`, { method: 'DELETE' })
