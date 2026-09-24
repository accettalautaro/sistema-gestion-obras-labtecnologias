import { useState } from 'react'
import casanieve from '../../../assets/casanieve.jpg'
import logoSimple from '../../../assets/logosimple.png'
import '../../../styles/Contacto.css'

const initialForm = {
	nombre: '',
	correo: '',
	telefono: '',
	asunto: '',
	mensaje: '',
}

function ContactoPage() {
	const [formulario, setFormulario] = useState(initialForm)
	const [enviado, setEnviado] = useState(false)

	const handleChange = (event) => {
		const { name, value } = event.target
		setFormulario((actual) => ({ ...actual, [name]: value }))
		setEnviado(false)
	}

	const handleSubmit = (event) => {
		event.preventDefault()
		setEnviado(true)
		setFormulario(initialForm)
	}

	return (
		<main className="contenido-principal contacto-page">
			<section className="contacto-hero" style={{ backgroundImage: `url(${casanieve})` }}>
				<h1>Contacto</h1>
			</section>

			<section className="info-contacto contacto-page__info">
				<div className="contacto-card">
					<div className="contacto-logo-wrap">
						<img src={logoSimple} alt="Logo de Accetta Equipamiento" className="contacto-logo" />
					</div>
					<div className="contacto-datos">
						<h2>Accetta Equipamiento</h2>
						<p className="contacto-direccion">Ciudad de la Paz 2761 - 7A - CABA</p>
						<p className="contacto-email">Email: <a href="mailto:arqaccetta@gmail.com">arqaccetta@gmail.com</a></p>
						<p className="contacto-telefono">Teléfono: 2657-657808</p>
					</div>
				</div>
			</section>

			<section className="contacto-formulario" aria-labelledby="titulo-formulario">
				<form onSubmit={handleSubmit}>
					<h2 id="titulo-formulario">Formulario de Contacto</h2>

					<div className="contacto-formulario__campo">
						<label htmlFor="nombre">Nombre</label>
						<input id="nombre" name="nombre" type="text" value={formulario.nombre} onChange={handleChange} placeholder="Ingrese su nombre..." required />
					</div>

					<div className="contacto-formulario__campo">
						<label htmlFor="correo">Correo electrónico</label>
						<input id="correo" name="correo" type="email" value={formulario.correo} onChange={handleChange} placeholder="ejemplo@gmail.com" required />
					</div>

					<div className="contacto-formulario__campo">
						<label htmlFor="telefono">Teléfono</label>
						<input id="telefono" name="telefono" type="tel" value={formulario.telefono} onChange={handleChange} minLength="10" maxLength="10" pattern="[0-9]{10}" placeholder="2664123456" required />
					</div>

					<div className="contacto-formulario__campo">
						<label htmlFor="asunto">Asunto</label>
						<select id="asunto" name="asunto" value={formulario.asunto} onChange={handleChange} required>
							<option value="">Seleccione un asunto</option>
							<option value="consulta">Consulta</option>
							<option value="sugerencia">Sugerencia</option>
							<option value="reclamo">Reclamo</option>
						</select>
					</div>

					<div className="contacto-formulario__campo">
						<label htmlFor="mensaje">Mensaje</label>
						<textarea id="mensaje" name="mensaje" rows="5" value={formulario.mensaje} onChange={handleChange} placeholder="Describa brevemente cómo podemos ayudarle" required />
					</div>

					<button type="submit">Enviar mensaje</button>
					{enviado && <p className="contacto-formulario__exito" role="status">¡Gracias! Recibimos tu consulta.</p>}
				</form>
			</section>
		</main>
	)
}

export default ContactoPage
