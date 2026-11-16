import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'
import { obtenerPerfilCliente } from '../../clientes/services/clientesService.js'
import { listarObras } from '../../obras/services/obrasService.js'
import { listarTerrenos } from '../../terrenos/services/terrenosService.js'
import { api } from '../../../shared/services/api.js'
import { calcularDiasAtrasoObra } from '../../../shared/utils/atrasoObra.js'

export async function obtenerResumenCliente() {
  const [cliente, datosObras, lotes, recordatoriosApi] = await Promise.all([
    obtenerPerfilCliente(), listarObras(), listarTerrenos(), api('/recordatorios'),
  ])
  const obrasCliente = datosObras.obras
    .filter((obra) => String(obra['id-cliente']) === String(cliente['id-cliente']))
    .map((obra) => {
      const lote = lotes.find((item) => String(item['id-lote']) === String(obra['id-lote']))
      const direccion = lote?.direcciones?.[0]
      const tareas = obra.tareas ?? []
      const resumen = resumirAvanceTareas(tareas)
      const finalizada = resumen.total > 0 && resumen.completadas === resumen.total
      const diasAtraso = calcularDiasAtrasoObra(
        obra['fecha-fin-estimada'],
        obra['fecha-fin-real'],
        finalizada,
      )
      const estado = diasAtraso > 0 && String(obra.Estado).toLowerCase().includes('ejecuci')
        ? 'Atrasada'
        : obra.Estado
      const estadoTiempo = diasAtraso > 0
        ? 'Atrasada'
        : finalizada
          ? 'A tiempo'
          : obra['fecha-fin-estimada'] ? 'En plazo' : 'Sin datos'
      return {
        idObra: obra['id-obra'], nombre: obra.nombre, nroLote: obra.nrolote, estado, estadoTiempo,
        porcentaje: resumen.avance, diasAtraso,
        direccion: direccion ? [direccion.calle, direccion.altura, direccion.localidad, direccion.provincia].filter(Boolean).join(', ') : 'Dirección sin registrar',
        arquitecto: obra.arquitectoNombre || 'Sin asignar',
        fechaInicioEstimada: obra['fecha-inicio-estimada'], fechaFinEstimada: obra['fecha-fin-estimada'],
        fechaInicioReal: obra['fecha-inicio-real'], fechaFinReal: obra['fecha-fin-real'], tareas,
      }
    })
  const idsObras = new Map(obrasCliente.map((obra) => [String(obra.idObra), obra]))
  const recordatorios = recordatoriosApi.filter((item) => idsObras.has(String(item.id_obra))).map((item) => {
    const obra = idsObras.get(String(item.id_obra))
    const fecha = String(item.fecha).slice(0, 10)
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    const fechaRecordatorio = new Date(`${fecha}T00:00:00`)
    return {
      idRecordatorio: item.id_recordatorio, idObra: item.id_obra, nroLote: obra.nroLote,
      fecha, estado: fechaRecordatorio < hoy ? 'atrasado' : 'pendiente',
      descripcion: item.descripcion, direccion: obra.direccion, direccionCompleta: obra.direccion,
    }
  })
  return { cliente, obras: obrasCliente, recordatorios }
}
