const URL_BASE = '/Back/data'

async function leerJson(nombre) {
  const respuesta = await fetch(`${URL_BASE}/${nombre}.json`)
  if (!respuesta.ok) {
    throw new Error(`No se pudo obtener ${nombre}`)
  }
  return respuesta.json()
}

export async function obtenerDetalleTareaYPagos(idObra, idTarea) {
  idObra = Number(idObra)
  
  const [tareas, pagos, obras] = await Promise.all([
    leerJson('tareas'),
    leerJson('pagos-parciales'),
    leerJson('obras')
  ])

  const tarea = tareas.find(t => t['id-obra'] === idObra && String(t['id-tarea']) === String(idTarea))
  if (!tarea) {
    throw new Error('Tarea no encontrada')
  }

  const obra = obras.find(o => o['id-obra'] === idObra)
  
  const pagosTarea = pagos.filter(p => p['id-obra'] === idObra && String(p['id-tarea']) === String(idTarea))

  const totalAbonado = pagosTarea.reduce((acc, p) => acc + (p.monto || 0), 0)

  return {
    obra: {
      idObra: obra['id-obra'],
      nroLote: obra.nrolote
    },
    tarea: {
      idTarea: tarea['id-tarea'],
      nombre: tarea.nombre,
      descripcion: tarea.descripcion,
      estado: tarea.estado,
      porcentaje: parseInt(String(tarea.porcentaje), 10) || 0,
      fechaInicio: tarea['fecha-inicio'],
      fechaFin: tarea['fecha-fin'],
      duracionEstimada: tarea['duracion-estimada'],
      duracionReal: tarea['duracion-real'],
      costoEstimado: tarea['costo-estimado'],
      costoReal: tarea['costo-real']
    },
    pagos: pagosTarea.map(p => ({
      idPago: p['id-pago'],
      monto: p.monto,
      descripcion: p.descripcion
    })),
    totalAbonado
  }
}
