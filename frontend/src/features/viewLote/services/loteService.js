const URL_BASE = '/Back/data'

async function leerJson(nombre) {
  const respuesta = await fetch(`${URL_BASE}/${nombre}.json`)
  if (!respuesta.ok) {
    throw new Error(`No se pudo obtener ${nombre}`)
  }
  return respuesta.json()
}

export async function obtenerDetalleLote(nroLote) {
  nroLote = Number(nroLote)
  const [lotes, direcciones, mensuras, escrituras, propietarios] = await Promise.all([
    leerJson('lotes'),
    leerJson('direcciones'),
    leerJson('mensuras'),
    leerJson('escrituras'),
    leerJson('propietarios')
  ])
  
  const loteBasico = lotes.find(l => l.nrolote === nroLote) || { nrolote: nroLote };
  const direccion = direcciones.find(d => d.nrolote === nroLote);
  const mensura = mensuras.find(m => m.nrolote === nroLote);
  const escritura = escrituras.find(e => e.nrolote === nroLote);
  
  let propietariosLote = [];
  if (escritura) {
    propietariosLote = propietarios.filter(p => p.nroescritura === escritura.nroescritura);
  }

  return {
    nroLote: nroLote,
    direccionCompleta: direccion
      ? `${direccion.calle} ${direccion.altura}, ${direccion.localidad}, ${direccion.provincia} (CP ${direccion.codpos})`
      : 'Sin dirección cargada',
    mensura: mensura ? {
      largo: mensura.largo,
      ancho: mensura.ancho,
      area: (mensura.largo * mensura.ancho)
    } : null,
    escritura: escritura ? {
      nroEscritura: escritura.nroescritura
    } : null,
    propietarios: propietariosLote.map(p => ({
      idPropietario: p['id-propietario'],
      nombre: p.nombre,
      apellido: p.apellido,
      dni: p.dni,
      estadoCivil: p.estadocivil,
      porcentaje: p.porcentaje
    }))
  }
}
