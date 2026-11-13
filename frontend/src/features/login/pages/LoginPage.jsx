import { useNavigate } from 'react-router-dom'

import FormularioIngreso from '../components/FormularioContacto' 
import { iniciarSesion } from '../service/authService' 
import casalogin from '../../../assets/casalogin.jpg'
import '../../../styles/Login.css'

function LoginPage() {
    const navigate = useNavigate()

    // Esta es la función puente que le pasamos al formulario
    const handleIngresar = async (dni, usuario) => {
        const sesionData = await iniciarSesion(dni, usuario)

        if (sesionData.rol === 'arquitecto') {
            navigate('/principal')
        } else {
            navigate('/cliente')
        }
    }

    return (
        <main className="login-page">
            <section 
                className="login-page__image" 
                style={{ backgroundImage: `url(${casalogin})` }} 
                aria-label="Interior de una obra" 
            />
            <section className="login-page__panel">
                {/*
                  Aquí llamamos al componente limpio que armamos en la respuesta anterior.
                  Le pasamos handleIngresar como la propiedad 'onIngresar'
                */}
                <FormularioIngreso onIngresar={handleIngresar} />
            </section>
        </main>
    )
}

export default LoginPage
