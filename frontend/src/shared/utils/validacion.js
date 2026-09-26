
export function esRequerido(valor) {
  return String(valor ?? '').trim() !== ''
}

export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function tieneLongitudMinima(valor, minimo) {
  return valor.trim().length >= minimo
}
