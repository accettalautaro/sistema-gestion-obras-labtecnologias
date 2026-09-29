import { useEffect, useState } from 'react'

export function useFetch(fetcher, dependencia) {
	const [datos, setDatos] = useState(null)
	const [cargando, setCargando] = useState(true)
	const [error, setError] = useState(null)

	useEffect(() => {
		let vigente = true
		setCargando(true)
		setError(null)

		fetcher()
			.then((resultado) => {
				if (vigente) setDatos(resultado)
			})
			.catch((motivo) => {
				if (vigente) setError(motivo)
			})
			.finally(() => {
				if (vigente) setCargando(false)
			})

		return () => {
			vigente = false
		}
	}, [fetcher, dependencia])

	return { datos, cargando, error }
}