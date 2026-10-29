import { resumirAvanceTareas } from '../../../shared/utils/avanceObra.js'
import { listarTareas } from '../../obras/services/tareasService.js'
import { listarPagosParciales } from '../../pagos/services/pagosService.js'
import { obtenerPerfilCliente } from '../../clientes/services/clientesService.js'

const URL_BASE = '/Back/data'

async function leerJson(nombre) {
  const respuesta = await fetch(`${URL_BASE}/${nombre}.json`)
  if (!respuesta.ok) {
    throw new Error(`No se pudo obtener ${nombre}`)
  }
  return respuesta.json()
}

// "50%" -> 50
const aNumero = (porcentaje) => parseInt(String(porcentaje), 10) || 0

/**
 * Combina el perfil verificado por el backend con los datos actuales de obras
 * y recordatorios, que todavía se leen desde JSON.
 */
export async function obtenerResumenCliente() {
  const [cliente, obras, arquitectos, direcciones, recordatorios, tareas, pagos] = await Promise.all([
    obtenerPerfilCliente(),
    leerJson('obras'),
    leerJson('arquitectos'),
    leerJson('direcciones'),
    leerJson('recordatorios'),
    listarTareas(),
    listarPagosParciales(),
  ])

  const obrasCliente = obras
    .filter((o) => String(o['id-cliente']) === String(cliente['id-cliente']))
    .map((obra) => {
      const arquitecto = arquitectos.find((a) => a['id-arquitecto'] === obra['id-arquitecto'])
      const direccion = direcciones.find((d) => d.nrolote === obra.nrolote)
      
      const tareasObra = tareas.filter((t) => String(t['id-obra']) === String(obra['id-obra']))
      const resumen = resumirAvanceTareas(tareasObra, pagos)
      const tieneTareaAtrasada = resumen.unidades.some((t) => Number(t['duracion-real']) > Number(t['duracion-estimada']) && aNumero(t.porcentaje) < 100)
      const avanceObra = resumen.avance
      
      let estadoObra = obra.Estado
      if (estadoObra === 'En ejecución' && tieneTareaAtrasada) {
        estadoObra = 'Atrasada'
      }

      return {
        idObra: obra['id-obra'],
        nroLote: obra.nrolote,
        estado: estadoObra,
        porcentaje: avanceObra,
        fechaInicio: obra['fecha-inicio'] ?? null,
        fechaFin: obra['fecha-fin'] ?? null,
        direccion: direccion ? `${direccion.calle} ${direccion.altura}, ${direccion.localidad}` : 'Sin dirección cargada',
        direccionCompleta: direccion
          ? `${direccion.calle} ${direccion.altura}, ${direccion.localidad}, ${direccion.provincia} (CP ${direccion.codpos})`
          : 'Sin dirección cargada',
        arquitecto: arquitecto ? `${arquitecto.nombre} ${arquitecto.apellido}` : 'Sin asignar',
        arquitectoTelefono: arquitecto?.telefono ?? '',
        arquitectoMatricula: arquitecto?.nromatricula ?? '',
      }
    })

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Todos los recordatorios del cliente, con los datos de su obra
  const recordatoriosCliente = recordatorios
    .filter((r) => String(r['id-cliente']) === String(cliente['id-cliente']))
    .map((r) => {
      const obra = obrasCliente.find((o) => o.idObra === r['id-obra'])
      
      let estadoR = r.estado.toLowerCase()
      if (estadoR === 'pendiente') {
        const [y, m, d] = r.fecha.split('-').map(Number)
        const fechaR = new Date(y, m - 1, d)
        if (fechaR < hoy) {
          estadoR = 'atrasado'
        }
      }

      return {
        idRecordatorio: r['id-recordatorio'],
        idObra: r['id-obra'],
        fecha: r.fecha,
        descripcion: r.descripcion,
        estado: estadoR,
        nroLote: obra?.nroLote ?? null,
        direccion: obra?.direccion ?? 'Obra no encontrada',
        direccionCompleta: obra?.direccionCompleta ?? '',
        estadoObra: obra?.estado ?? '',
        arquitecto: obra?.arquitecto ?? '',
        arquitectoTelefono: obra?.arquitectoTelefono ?? '',
        arquitectoMatricula: obra?.arquitectoMatricula ?? '',
      }
    })

  return {
    cliente: { nombre: cliente.nombre, apellido: cliente.apellido },
    obras: obrasCliente,
    recordatorios: recordatoriosCliente,
  }
}
