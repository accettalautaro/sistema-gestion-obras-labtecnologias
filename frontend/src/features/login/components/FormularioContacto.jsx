function FormularioContacto(){
   
    return (
         <form className="login-form" onSubmit={handleSubmit}>
					<h1>Ingresar</h1>

					<div className="login-form__field">
						<label htmlFor="dni">DNI</label>
						<input id="dni" name="dni" type="number" value={dni} onChange={(event) => setDni(event.target.value)} required />
					</div>

					<div className="login-form__field">
						<label htmlFor="usuario">Usuario</label>
						<input id="usuario" name="usuario" type="text" value={usuario} onChange={(event) => setUsuario(event.target.value)} required />
					</div>

					<label className="login-form__remember" htmlFor="recordar">
						<input id="recordar" name="recordar" type="checkbox" checked={recordarDni} onChange={(event) => setRecordarDni(event.target.checked)} />
						<span>Recordá tu DNI</span>
					</label>

					<button type="submit" disabled={cargando}>{cargando ? 'Verificando...' : 'Ingresar'}</button>

					<p className="login-form__contacto">
						¿No tienes cuenta? Ponte en contacto para iniciar un proyecto nuevo y obtener una cuenta{' '}
						<a href="#contacto">Click aquí</a>
					</p>

					{mensaje && <p className="login-form__mensaje login-form__mensaje--error" role="alert">{mensaje}</p>}
				</form>
    )           
}

export default FormularioContacto   