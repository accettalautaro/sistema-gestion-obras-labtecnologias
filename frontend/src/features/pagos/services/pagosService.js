import { listarTareas } from '../../obras/services/tareasService.js'
const URL_BASE = '/Back/data'
const CLAVE_PAGOS = 'gestion-obras:pagos-parciales:v1'

export async function listarPagosParciales() {
    const local = localStorage.getItem(CLAVE_PAGOS)
    if (local) return JSON.parse(local)
    const respuesta = await fetch(`${URL_BASE}/pagos-parciales.json?t=${Date.now()}`)
    if (!respuesta.ok) throw new Error('No se pudieron cargar los pagos parciales.')
    return respuesta.json()
}

export async function listarPagos() {
    const t = Date.now()
    const [pagosRes, obrasRes, tareas] = await Promise.all([
        listarPagosParciales(),
        fetch(`${URL_BASE}/obras.json?t=${t}`),
        listarTareas()
    ])

    if (!obrasRes.ok) {
        throw new Error('No se pudieron cargar los datos de pagos.')
    }

    const pagos = pagosRes
    const obras = await obrasRes.json()

    return { pagos, obras, tareas }
}

export async function crearPago(datos) {
    const pagos = await listarPagosParciales()
    const nuevoPago = {
        'id-pago': Math.max(0, ...pagos.map((pago) => Number(pago['id-pago']) || 0)) + 1,
        'id-obra': Number(datos['id-obra']),
        'id-tarea': String(datos['id-tarea']),
        descripcion: datos.descripcion.trim(),
        monto: Number(datos.monto),
    }
    if (!nuevoPago['id-obra'] || !nuevoPago['id-tarea'] || !Number.isFinite(nuevoPago.monto) || nuevoPago.monto <= 0) {
        throw new Error('Completá una obra, tarea y monto válido.')
    }
    localStorage.setItem(CLAVE_PAGOS, JSON.stringify([...pagos, nuevoPago]))
    return nuevoPago
}
