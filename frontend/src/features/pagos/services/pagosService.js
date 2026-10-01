const URL_BASE = '/Back/data'

export async function listarPagos() {
    const t = Date.now()
    const [pagosRes, obrasRes] = await Promise.all([
        fetch(`${URL_BASE}/pagos-parciales.json?t=${t}`),
        fetch(`${URL_BASE}/obras.json?t=${t}`)
    ])

    if (!pagosRes.ok || !obrasRes.ok) {
        throw new Error('No se pudieron cargar los datos de pagos.')
    }

    const pagos = await pagosRes.json()
    const obras = await obrasRes.json()

    return { pagos, obras }
}

export async function crearPago() {
    // Simulamos un guardado temporal visual. No modifica el .json real.
    // Esta función se conectará al backend (PostgreSQL) en el futuro.
    return new Promise(resolve => setTimeout(resolve, 800))
}
