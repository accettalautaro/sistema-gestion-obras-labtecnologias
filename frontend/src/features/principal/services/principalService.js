import { listarObras } from '../../obras/services/obrasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'
import { derivarTareas } from '../../../shared/utils/avanceObra.js'

export async function obtenerDatosPanel() {
  const [{ obras, clientes }, pagos] = await Promise.all([listarObras(), listarPagosParciales()])
  const tareasDerivadas = derivarTareas(obras.flatMap((obra) => obra.tareas), pagos)
  const tareas = tareasDerivadas.map((t) => ({
    ...t, id: t['id-tarea'] ?? t.id, obraId: t['id-obra'] ?? t.obraId,
    CostReal: t['costo-real'] ?? t.CostReal, EsUnidadFinal: t.esUnidadFinal,
  }))
  const obrasPanel = obras.map((obra) => {
    const avance = obra.porcentaje ?? obra.Porcentaje ?? '0%'
    return {
      ...obra,
      id: obra.id ?? obra['id-obra'],
      clienteId: obra.clienteId ?? obra['id-cliente'],
      Porcentaje: avance,
    }
  })
  const inversionEjecutada = pagos.reduce((total, pago) => total + (Number(pago.monto) || 0), 0)
  return { obras: obrasPanel, clientes, tareas, inversionEjecutada }
}
