
export function esRequerido(valor) {
  return String(valor ?? '').trim() !== ''
}

export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function tieneLongitudMinima(valor, minimo) {
  return valor.trim().length >= minimo
}
// Valida que el DNI contenga solo números y tenga una longitud lógica (ej. 7 a 8 dígitos)
export function esDniValido(dni) {
  const dniLimpio = String(dni ?? '').trim()
  // Verifica que sean estrictamente números y tenga entre 7 y 8 dígitos
  return /^\d{7,8}$/.test(dniLimpio)
}

// Valida que el nombre de usuario no tenga espacios en blanco ni caracteres especiales extraños
// (Ajusta la expresión regular según las reglas de tu sistema)
export function esUsuarioValido(usuario) {
  const usuarioLimpio = String(usuario ?? '').trim()
  // Permite letras, números y guiones bajos, longitud mínima 4, máxima 20
  return /^[a-zA-Z0-9_]{4,20}$/.test(usuarioLimpio)
}