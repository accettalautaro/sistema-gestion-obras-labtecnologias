import { listarTareas } from '../../obras/services/tareasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'
import { derivarTareas, normalizarIdTarea } from '../../../shared/utils/avanceObra.js'
import { api } from '../../../shared/services/api.js'

export async function obtenerDetalleTareaYPagos(idObra, idTarea) {
  idObra = Number(idObra)
  
  const [tareas, pagos, obras] = await Promise.all([
    listarTareas(),
    listarPagosParciales(),
    api('/obras'),
  ])

  const tareasObra = tareas.filter(t => String(t['id-obra']) === String(idObra))
  const tareaDerivada = derivarTareas(tareasObra, pagos).find(t => normalizarIdTarea(t['id-tarea']) === normalizarIdTarea(idTarea))
  const tarea = tareasObra.find(t => normalizarIdTarea(t['id-tarea']) === normalizarIdTarea(idTarea))
  if (!tarea) {
    throw new Error('Tarea no encontrada')
  }

  const obra = obras.find(o => Number(o.id_obra) === idObra)
  
  const idsTarea = new Set([tareaDerivada, ...(tareaDerivada?.subtareas ?? [])].flatMap((item) => [normalizarIdTarea(item['id-tarea']), ...(item.subtareas ?? []).map((hijo) => normalizarIdTarea(hijo['id-tarea']))]))
  const incluirDescendientes = (item) => {
    for (const hijo of item.subtareas ?? []) { idsTarea.add(normalizarIdTarea(hijo['id-tarea'])); incluirDescendientes(hijo) }
  }
  if (tareaDerivada) incluirDescendientes(tareaDerivada)
  const pagosTarea = pagos.filter(p => String(p['id-obra']) === String(idObra) && idsTarea.has(normalizarIdTarea(p['id-tarea'])))

  const totalAbonado = pagosTarea.reduce((acc, p) => acc + (Number(p.monto) || 0), 0)

  return {
    obra: {
      idObra: obra.id_obra,
      nroLote: obra.nro_lote ?? ''
    },
    tarea: {
      idTarea: tarea['id-tarea'],
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      estado: tarea.estado,
      porcentaje: tareaDerivada.avance,
      fechaInicio: tarea['fecha-inicio'], fechaInicioEstimada: tarea['fecha-inicio-estimada'] || tarea['fecha-inicio'],
      fechaFin: tarea['fecha-fin'], fechaFinEstimada: tarea['fecha-fin-estimada'] || tarea['fecha-fin'],
      fechaInicioReal: tarea['fecha-inicio-real'] || '', fechaFinReal: tarea['fecha-fin-real'] || '',
      duracionEstimada: tareaDerivada['duracion-estimada'],
      duracionReal: tareaDerivada['duracion-real'],
      costoEstimado: tarea['costo-estimado'],
      costoReal: tareaDerivada['costo-real'],
      subtareas: (tareaDerivada.subtareas ?? []).map((subtarea) => ({
        idTarea: subtarea['id-tarea'],
        nombre: subtarea.nombre,
        porcentaje: subtarea.avance ?? 0,
        costoEstimado: subtarea['costo-estimado'],
        costoReal: subtarea['costo-real'],
      }))
    },
    pagos: pagosTarea.map(p => ({
      idPago: p['id-pago'],
      monto: p.monto,
      descripcion: p.descripcion
    })),
    totalAbonado
  }
}
