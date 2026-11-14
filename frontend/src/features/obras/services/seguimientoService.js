import { resumirAvanceTareas, porcentajeTarea } from '../../../shared/utils/avanceObra.js'
import { listarObras } from './obrasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'

function fechaLocal(fecha) {
	if (!fecha) return null
	const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number)
	if (!anio || !mes || !dia) return null
	return new Date(anio, mes - 1, dia)
}

function construirCronograma(etapas) {
	const conFechas = etapas.map((tarea) => {
		const inicioPropio = fechaLocal(tarea['fecha-inicio'])
		const finPropio = fechaLocal(tarea['fecha-fin'])
		if (inicioPropio && finPropio && finPropio >= inicioPropio) return { tarea, inicio: inicioPropio, fin: finPropio }

		const fechasFinales = (tarea.unidadesFinales ?? [])
			.map((subtarea) => ({ inicio: fechaLocal(subtarea['fecha-inicio']), fin: fechaLocal(subtarea['fecha-fin']) }))
			.filter(({ inicio, fin }) => inicio && fin && fin >= inicio)
		if (!fechasFinales.length) return null
		return {
			tarea,
			inicio: new Date(Math.min(...fechasFinales.map(({ inicio }) => inicio.getTime()))),
			fin: new Date(Math.max(...fechasFinales.map(({ fin }) => fin.getTime()))),
		}
	}).filter(Boolean)
	if (!conFechas.length) return null
	const minimo = new Date(Math.min(...conFechas.map(({ inicio }) => inicio.getTime())))
	const maximo = new Date(Math.max(...conFechas.map(({ fin }) => fin.getTime())))
	const totalDias = Math.max(1, (maximo - minimo) / 86400000 + 1)
	return {
		inicio: minimo,
		fin: maximo,
		tareas: conFechas.map(({ tarea, inicio, fin }) => ({
			tarea,
			izquierda: ((inicio - minimo) / 86400000 / totalDias) * 100,
			ancho: Math.max(1, (((fin - inicio) / 86400000 + 1) / totalDias) * 100),
			avance: tarea.avance ?? porcentajeTarea(tarea),
		})),
	}
}

export async function obtenerSeguimientoObra(idObra) {
  const [{ obras, lotes }, pagos] = await Promise.all([listarObras(), listarPagosParciales()])
	const obra = obras.find((item) => String(item['id-obra']) === String(idObra))
	if (!obra) throw new Error(`No se encontró la obra #${idObra}.`)

  const resumen = resumirAvanceTareas(obra.tareas, pagos)
  const { etapas, completadas, total, avance } = resumen
	const lote = lotes.find((item) => String(item['id-lote']) === String(obra['id-lote']))
	const direccion = lote?.direccion
	const direccionCompleta = direccion
		? [direccion.calle && `${direccion.calle} ${direccion.altura ?? ''}`.trim(), direccion.localidad, direccion.provincia].filter(Boolean).join(', ')
		: 'Sin dirección registrada'
  const monto = (valor) => Number(valor) || 0
  const pagosObra = pagos.filter((pago) => String(pago['id-obra']) === String(idObra))
  const costoEstimadoTotal = monto(obra.costoEstimadoTotal)
  const montoAbonado = pagosObra.reduce((suma, pago) => suma + monto(pago.monto), 0)
  const diasAtrasoTotal = resumen.unidades.reduce((suma, tarea) => {
    const atraso = monto(tarea['duracion-real']) - monto(tarea['duracion-estimada'])
    return suma + (atraso > 0 && porcentajeTarea(tarea) < 100 ? atraso : 0)
  }, 0)

	return {
		id: obra['id-obra'],
		nrolote: obra.nrolote || '—',
		estado: obra.Estado ?? 'Sin estado',
		fechaInicio: obra['fecha-inicio-estimada'] ?? '',
		fechaFin: obra['fecha-fin-estimada'] ?? '',
    fechaInicioEstimada: obra['fecha-inicio-estimada'] ?? obra['fecha-inicio'] ?? '',
    fechaFinEstimada: obra['fecha-fin-estimada'] ?? obra['fecha-fin'] ?? '',
    fechaInicioReal: obra['fecha-inicio-real'] ?? '',
    fechaFinReal: obra['fecha-fin-real'] ?? '',
		cliente: obra.clienteNombre || `Cliente #${obra['id-cliente']}`,
		arquitecto: obra.arquitectoNombre || `Arquitecto #${obra['id-arquitecto']}`,
		direccion: direccionCompleta,
    costoEstimadoTotal, montoAbonado,
    diasAtrasoTotal,
    duracionEstimada: obra.duracionEstimada,
    duracionReal: obra.duracionReal,
		avance,
		completadas,
		total,
		etapas,
		cronograma: construirCronograma(etapas.map((etapa, indice) => ({ ...etapa, numeroOrden: indice + 1 }))),
	}
}
