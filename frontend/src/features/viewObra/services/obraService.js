import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'
import { listarTareas } from '../../obras/services/tareasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'

const URL_BASE = '/Back/data'

async function leerJson(nombre) {
  const respuesta = await fetch(`${URL_BASE}/${nombre}.json`)
  if (!respuesta.ok) {
    throw new Error(`No se pudo obtener ${nombre}`)
  }
  return respuesta.json()
}

const aNumero = (porcentaje) => parseInt(String(porcentaje), 10) || 0
const aMonto = (valor) => {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

export async function obtenerDetalleObra(idObra) {
  idObra = Number(idObra)
  const [obras, arquitectos, direcciones, tareas, pagos] = await Promise.all([
    leerJson('obras'),
    leerJson('arquitectos'),
    leerJson('direcciones'),
    listarTareas(),
    listarPagosParciales(),
  ])

  const obra = obras.find((o) => o['id-obra'] === idObra)
  if (!obra) {
    throw new Error('Obra no encontrada')
  }

  const arquitecto = arquitectos.find((a) => a['id-arquitecto'] === obra['id-arquitecto'])
  const direccion = direcciones.find((d) => d.nrolote === obra.nrolote)
  
  const tareasObra = tareas
    .filter((t) => t['id-obra'] === idObra)
    .sort((a, b) => {
      const dateA = new Date(a['fecha-inicio'] || '9999-12-31')
      const dateB = new Date(b['fecha-inicio'] || '9999-12-31')
      return dateA - dateB
    })
  const pagosObra = pagos.filter((p) => p['id-obra'] === idObra)
  const resumenTareas = resumirAvanceTareas(tareasObra, pagos)
  const avanceObra = resumenTareas.avance

  // Si una etapa tiene subtareas, su costo es un resumen. Sumamos solo las unidades
  // finales del avance para no contar a la vez el total de la etapa y cada subtarea.
  const costoEstimadoTotal = resumenTareas.unidades.reduce((total, tarea) => total + aMonto(tarea['costo-estimado']), 0)
  const montoAbonado = pagosObra.reduce((total, pago) => total + aMonto(pago.monto), 0)
  
  const diasAtrasoTotal = resumenTareas.unidades.reduce((acc, t) => {
    const estimado = t['duracion-estimada'] || 0
    const real = t['duracion-real'] || 0
    if (real > estimado && aNumero(t.porcentaje) < 100) {
      return acc + (real - estimado)
    }
    return acc
  }, 0)

  let estadoObra = obra.Estado
  if (estadoObra === 'En ejecución' && diasAtrasoTotal > 0) {
    estadoObra = 'Atrasada'
  }

  return {
    idObra: obra['id-obra'],
    nroLote: obra.nrolote,
    estado: estadoObra,
    porcentaje: avanceObra,
    fechaInicio: obra['fecha-inicio'] ?? null,
    fechaFin: obra['fecha-fin'] ?? null,
    direccionCompleta: direccion
      ? `${direccion.calle} ${direccion.altura}, ${direccion.localidad}, ${direccion.provincia} (CP ${direccion.codpos})`
      : 'Sin dirección cargada',
    arquitecto: arquitecto ? `${arquitecto.nombre} ${arquitecto.apellido}` : 'Sin asignar',
    arquitectoTelefono: arquitecto?.telefono ?? '',
    arquitectoMatricula: arquitecto?.nromatricula ?? '',
    costoEstimadoTotal,
    montoAbonado,
    diasAtrasoTotal,
    tareas: resumenTareas.etapas.flatMap(etapa => [etapa, ...etapa.subtareas]).map(t => ({
      idTarea: t['id-tarea'],
      nombre: t.nombre,
      descripcion: t.descripcion,
      porcentaje: aNumero(t.porcentaje),
      estado: t.estado,
      fechaInicio: t['fecha-inicio'],
      fechaFin: t['fecha-fin'],
      duracionEstimada: t['duracion-estimada'],
      duracionReal: t['duracion-real'],
      costoEstimado: t['costo-estimado'],
      costoReal: t['costo-real'],
    }))
  }
}
