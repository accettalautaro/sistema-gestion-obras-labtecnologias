import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'

const URL_BASE = '/Back/data'

async function leerJson(nombre) {
  const respuesta = await fetch(`${URL_BASE}/${nombre}.json`)
  if (!respuesta.ok) {
    throw new Error(`No se pudo obtener ${nombre}`)
  }
  return respuesta.json()
}

const aNumero = (porcentaje) => parseInt(String(porcentaje), 10) || 0

export async function obtenerDetalleObra(idObra) {
  idObra = Number(idObra)
  const [obras, arquitectos, direcciones, tareas, pagos] = await Promise.all([
    leerJson('obras'),
    leerJson('arquitectos'),
    leerJson('direcciones'),
    leerJson('tareas'),
    leerJson('pagos-parciales'),
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
  const avanceObra = resumirAvanceTareas(tareasObra).avance

  const costoEstimadoTotal = tareasObra.reduce((acc, t) => acc + (t['costo-estimado'] || 0), 0)
  const montoAbonado = pagosObra.reduce((acc, p) => acc + (p.monto || 0), 0)
  
  const diasAtrasoTotal = tareasObra.reduce((acc, t) => {
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
    tareas: tareasObra.map(t => ({
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
