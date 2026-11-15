export function soloLetras(valor) {
	return valor.replace(/[^\p{L}\s'-]/gu, '')
}

export function soloNumeros(valor) {
	return valor.replace(/\D/g, '')
}

export function soloDecimal(valor) {
	return /^\d*(?:\.\d*)?$/.test(valor) ? valor : null
}
