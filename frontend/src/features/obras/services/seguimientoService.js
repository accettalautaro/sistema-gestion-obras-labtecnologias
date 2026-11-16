import { resumirAvanceTareas, porcentajeTarea } from '../../../shared/utils/avanceObra.js'
import { listarObras } from './obrasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'

function fechaLocal(fecha) {
	if (!fecha) return null
	const [anio, mes, dia] = String(fecha).slice(0, 10).split('-').map(Number)
	if (!anio || !mes || !dia) return null
	return new Date(anio, mes - 1, dia)
}

function diferenciaDias(fechaInicio, fechaFin) {
	if (!fechaInicio || !fechaFin) return null
	const inicio = Date.parse(`${String(fechaInicio).slice(0, 10)}T00:00:00Z`)
	const fin = Date.parse(`${String(fechaFin).slice(0, 10)}T00:00:00Z`)
	if (!Number.isFinite(inicio) || !Number.isFinite(fin)) return null
	return Math.floor((fin - inicio) / 86400000)
}

function fechaHoyISO() {
	const hoy = new Date()
	return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
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
  const fechaFinEstimada = obra['fecha-fin-estimada'] ?? obra['fecha-fin']
  const fechaFinReal = obra['fecha-fin-real']
  const finalizada = resumen.total > 0 && resumen.completadas === resumen.total
  const diasAtrasoTotal = finalizada
		? Math.max(0, diferenciaDias(fechaFinEstimada, fechaFinReal) ?? 0)
		: Math.max(0, diferenciaDias(fechaFinEstimada, fechaHoyISO()) ?? 0)
  const estadoTiempo = diasAtrasoTotal > 0
		? 'Atrasada'
		: finalizada
			? 'A tiempo'
			: fechaFinEstimada ? 'En plazo' : 'Sin datos'

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
    estadoTiempo,
    duracionEstimada: obra.duracionEstimada,
    duracionReal: obra.duracionReal,
		avance,
		completadas,
		total,
		etapas,
		cronograma: construirCronograma(etapas.map((etapa, indice) => ({ ...etapa, numeroOrden: indice + 1 }))),
	}
}
