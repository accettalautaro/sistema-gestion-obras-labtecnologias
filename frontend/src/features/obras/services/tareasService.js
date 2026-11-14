import { api, jsonBody } from '../../../shared/services/api.js'
import { NOMENCLADOR_TAREAS } from '../data/nomencladorTareas.js'

function fechaISO(valor) {
  if (!valor) return ''
  if (valor instanceof Date && Number.isNaN(valor.getTime())) return ''
  const texto = valor instanceof Date ? valor.toISOString() : String(valor).trim()
  const coincidencia = texto.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/)
  if (!coincidencia) return ''
  const fecha = coincidencia[1]
  const validada = new Date(`${fecha}T00:00:00Z`)
  return Number.isNaN(validada.getTime()) || validada.toISOString().slice(0, 10) !== fecha ? '' : fecha
}

const fecha = fechaISO

export async function listarNomenclador() { return NOMENCLADOR_TAREAS }

function mapearObraTareas(datos) {
  return (datos?.tareas ?? []).flatMap((tarea) => {
    const principal = {
      'id-obra': String(datos.id_obra), 'id-tarea': String(tarea.id_tarea),
      nombre: tarea.nombre_tarea, descripcion: tarea.descripcion_tarea ?? '',
      porcentaje: `${Number(tarea.porcentaje_tarea) || 0}%`,
      estado: tarea.fecha_fin_real_tarea ? 'finalizada' : tarea.fecha_inicio_real_tarea ? 'en ejecucion' : 'sin comenzar',
      'fecha-inicio-estimada': fecha(tarea.fecha_inicio_tarea), 'fecha-fin-estimada': fecha(tarea.fecha_fin_tarea),
      'fecha-inicio-real': fecha(tarea.fecha_inicio_real_tarea), 'fecha-fin-real': fecha(tarea.fecha_fin_real_tarea),
      'fecha-inicio': fecha(tarea.fecha_inicio_tarea), 'fecha-fin': fecha(tarea.fecha_fin_tarea),
      'duracion-estimada': tarea.duracion_estimada_tarea ?? '', 'duracion-real': tarea.duracion_real_tarea ?? '',
      'costo-estimado': tarea.costo_estimado_tarea ?? '', 'costo-real': tarea.costo_real_tarea ?? '',
      _persistida: true,
    }
    const subtareas = (tarea.subtareas ?? []).map((subtarea) => ({
      ...principal,
      'id-tarea': `${tarea.id_tarea}_${subtarea.id_subtarea}`,
      nombre: subtarea.nombre_subtarea, descripcion: subtarea.descripcion_subtarea ?? '',
      porcentaje: `${Number(subtarea.porcentaje_subtarea) || 0}%`,
      estado: subtarea.fecha_fin_real_subtarea ? 'finalizada' : subtarea.fecha_inicio_real_subtarea ? 'en ejecucion' : 'sin comenzar',
      'fecha-inicio-estimada': fecha(subtarea.fecha_inicio_subtarea), 'fecha-fin-estimada': fecha(subtarea.fecha_fin_subtarea),
      'fecha-inicio-real': fecha(subtarea.fecha_inicio_real_subtarea), 'fecha-fin-real': fecha(subtarea.fecha_fin_real_subtarea),
      'fecha-inicio': fecha(subtarea.fecha_inicio_subtarea), 'fecha-fin': fecha(subtarea.fecha_fin_subtarea),
      'duracion-estimada': subtarea.duracion_estimada_subtarea ?? '', 'duracion-real': subtarea.duracion_real_subtarea ?? '',
      'costo-estimado': subtarea.costo_estimado_subtarea ?? '', 'costo-real': subtarea.costo_real_subtarea ?? '',
      _dbSubtareaId: subtarea.id_subtarea,
    }))
    return [principal, ...subtareas]
  })
}

export async function listarTareasDeObra(idObra) {
  return mapearObraTareas(await api(`/obras/${encodeURIComponent(idObra)}/tareas`))
}

export async function listarTareas() {
  const obras = await api('/obras')
  const listas = await Promise.all(obras.map((obra) => listarTareasDeObra(obra.id_obra)))
  return listas.flat()
}

function payloadTarea(tarea, idObra, idPadre = null) {
  return {
    ...(idPadre == null ? { id_obra: Number(idObra) } : { id_tarea: Number(idPadre) }),
    nombre: String(tarea.nombre ?? '').trim(), descripcion: tarea.descripcion || null,
    fecha_inicio_estimada: fechaISO(tarea['fecha-inicio-estimada']) || fechaISO(tarea['fecha-inicio']) || null,
    fecha_fin_estimada: fechaISO(tarea['fecha-fin-estimada']) || fechaISO(tarea['fecha-fin']) || null,
    ...(idPadre == null ? {} : {
      costo_estimado: tarea['costo-estimado'] === '' || tarea['costo-estimado'] == null
        ? null
        : Number(tarea['costo-estimado']),
    }),
  }
}

export async function guardarTareasObra(idObra, lista) {
  const existentes = await listarTareasDeObra(idObra)
  const etapas = lista.filter((item) => !String(item['id-tarea']).includes('_') && !item._dbSubtareaId)
  const idsPersistidos = new Map()
  for (const etapa of etapas) {
    const idAnterior = String(etapa['id-tarea'])
    const persistida = existentes.find((item) => String(item['id-tarea']) === idAnterior && !item._dbSubtareaId)
    const resultado = persistida
      ? await api(`/tareas/${persistida['id-tarea']}`, { method: 'PUT', body: jsonBody(payloadTarea(etapa, idObra)) })
      : await api('/tareas', { method: 'POST', body: jsonBody(payloadTarea(etapa, idObra)) })
    idsPersistidos.set(idAnterior, resultado.id_tarea)
  }

  const subtareasNuevas = lista.filter((item) => item._dbSubtareaId || String(item['id-tarea']).includes('_'))
  const idsSubtareasPersistidas = new Set()
  for (const subtarea of subtareasNuevas) {
    const idTexto = String(subtarea['id-tarea'])
    const [idPadreTexto] = idTexto.split('_')
    const idPadre = idsPersistidos.get(idPadreTexto) ?? Number(idPadreTexto)
    const payload = payloadTarea(subtarea, idObra, idPadre)
    if (subtarea._dbSubtareaId) {
      await api(`/subtareas/${subtarea._dbSubtareaId}`, { method: 'PUT', body: jsonBody(payload) })
      idsSubtareasPersistidas.add(String(subtarea._dbSubtareaId))
    } else {
      const creada = await api('/subtareas', { method: 'POST', body: jsonBody(payload) })
      idsSubtareasPersistidas.add(String(creada.id_subtarea))
    }
  }

  const idsTareasFinales = new Set(etapas.map((item) => {
    const previo = existentes.find((actual) => String(actual['id-tarea']) === String(item['id-tarea']) && !actual._dbSubtareaId)
    return String(idsPersistidos.get(String(item['id-tarea'])) ?? previo?.['id-tarea'] ?? '')
  }))
  for (const tarea of existentes.filter((item) => item._dbSubtareaId && !idsSubtareasPersistidas.has(String(item._dbSubtareaId)))) {
    await api(`/subtareas/${tarea._dbSubtareaId}`, { method: 'DELETE' })
  }
  for (const tarea of existentes.filter((item) => !item._dbSubtareaId && !idsTareasFinales.has(String(item['id-tarea'])))) {
    await api(`/tareas/${tarea['id-tarea']}`, { method: 'DELETE' })
  }
  return listarTareasDeObra(idObra)
}

export async function actualizarEstadoTarea(idObra, tarea, accion) {
  if (tarea._dbSubtareaId == null) {
    throw new Error('El seguimiento del avance se realiza desde las subtareas.')
  }
  await api(`/subtareas/${tarea._dbSubtareaId}/estado`, {
    method: 'PATCH',
    body: jsonBody({ accion }),
  })
  return listarTareasDeObra(idObra)
}
