import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'
import { listarObras } from '../../obras/services/obrasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'
import { obtenerPerfilCliente } from '../../clientes/services/clientesService.js'

const numero = (valor) => Number.parseFloat(String(valor ?? 0).replace('%', '').replace(',', '.')) || 0

export async function obtenerDetalleObra(idObra) {
  const [{ obras, lotes }, pagos, cliente] = await Promise.all([
    listarObras(), listarPagosParciales(), obtenerPerfilCliente(),
  ])
  const obra = obras.find((item) => String(item['id-obra']) === String(idObra))
  if (!obra) throw new Error('Obra no encontrada')
  const lote = lotes.find((item) => String(item['id-lote']) === String(obra['id-lote']))
  const tareas = obra.tareas ?? []
  const resumen = resumirAvanceTareas(tareas, pagos)
  const pagosObra = pagos.filter((pago) => String(pago['id-obra']) === String(idObra))
  const duracionEstimada = obra.duracionEstimada
  const duracionReal = obra.duracionReal
  const diasAtrasoTotal = resumen.unidades.reduce((suma, tarea) => {
    const atraso = numero(tarea['duracion-real']) - numero(tarea['duracion-estimada'])
    return suma + (atraso > 0 && numero(tarea.porcentaje) < 100 ? atraso : 0)
  }, 0)
  const estado = String(obra.Estado ?? '')
  const estadoObra = estado.toLowerCase().includes('ejecuci') && diasAtrasoTotal > 0 ? 'Atrasada' : estado
  const direccion = lote?.direccion
  const tareasPlanas = resumen.etapas.flatMap((etapa) => [etapa, ...etapa.subtareas]).map((tarea) => ({
    idTarea: tarea['id-tarea'], nombre: tarea.nombre, descripcion: tarea.descripcion,
    porcentaje: numero(tarea.porcentaje), estado: tarea.estado,
    fechaInicio: tarea['fecha-inicio-estimada'] || tarea['fecha-inicio'],
    fechaFin: tarea['fecha-fin-estimada'] || tarea['fecha-fin'],
    fechaInicioEstimada: tarea['fecha-inicio-estimada'] || tarea['fecha-inicio'],
    fechaFinEstimada: tarea['fecha-fin-estimada'] || tarea['fecha-fin'],
    fechaInicioReal: tarea['fecha-inicio-real'] || '', fechaFinReal: tarea['fecha-fin-real'] || '',
    duracionEstimada: tarea['duracion-estimada'], duracionReal: tarea['duracion-real'],
    costoEstimado: tarea['costo-estimado'], costoReal: tarea['costo-real'],
  }))
  return {
    idObra: obra['id-obra'], nroLote: obra.nrolote, estado: estadoObra,
    cliente: [cliente.nombre, cliente.apellido].filter(Boolean).join(' '),
    porcentaje: resumen.avance,
    fechaInicioEstimada: obra['fecha-inicio-estimada'], fechaFinEstimada: obra['fecha-fin-estimada'],
    fechaInicioReal: obra['fecha-inicio-real'], fechaFinReal: obra['fecha-fin-real'],
    direccionCompleta: direccion ? [direccion.calle && `${direccion.calle} ${direccion.altura ?? ''}`.trim(), direccion.localidad, direccion.provincia].filter(Boolean).join(', ') : 'Sin dirección cargada',
    arquitecto: obra.arquitectoNombre || 'Sin asignar',
    arquitectoTelefono: obra.arquitectoTelefono ?? '', arquitectoMatricula: obra.arquitectoMatricula ?? '',
    costoEstimadoTotal: obra.costoEstimadoTotal,
    montoAbonado: pagosObra.reduce((suma, pago) => suma + numero(pago.monto), 0),
    duracionEstimada, duracionReal, diasAtrasoTotal, tareas: tareasPlanas,
  }
}
