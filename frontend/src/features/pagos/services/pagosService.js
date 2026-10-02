const URL_BASE = '/Back/data'

export async function listarPagos() {
    const t = Date.now()
    const [pagosRes, obrasRes, tareasRes] = await Promise.all([
        fetch(`${URL_BASE}/pagos-parciales.json?t=${t}`),
        fetch(`${URL_BASE}/obras.json?t=${t}`),
        fetch(`${URL_BASE}/tareas.json?t=${t}`)
    ])

    if (!pagosRes.ok || !obrasRes.ok || !tareasRes.ok) {
        throw new Error('No se pudieron cargar los datos de pagos.')
    }

    const pagos = await pagosRes.json()
    const obras = await obrasRes.json()
    const tareas = await tareasRes.json()

    return { pagos, obras, tareas }
}

export async function crearPago(datos) {
    // Simulamos un guardado temporal visual. No modifica el .json real.
    // Esta función se conectará al backend (PostgreSQL) en el futuro.
    return new Promise(resolve => setTimeout(resolve, 800))
}
