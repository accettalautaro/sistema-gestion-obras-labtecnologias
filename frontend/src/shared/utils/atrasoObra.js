function fechaHoyISO() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

export function calcularDiasAtrasoObra(fechaFinEstimada, fechaFinReal, finalizada, hoy = fechaHoyISO()) {
  if (!fechaFinEstimada) return 0
  const fechaComparacion = finalizada ? fechaFinReal : hoy
  if (!fechaComparacion) return 0
  const finEstimado = Date.parse(`${String(fechaFinEstimada).slice(0, 10)}T00:00:00Z`)
  const finComparacion = Date.parse(`${String(fechaComparacion).slice(0, 10)}T00:00:00Z`)
  if (!Number.isFinite(finEstimado) || !Number.isFinite(finComparacion)) return 0
  return Math.max(0, Math.floor((finComparacion - finEstimado) / 86400000))
}
