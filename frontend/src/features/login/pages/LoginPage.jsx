import { useOutletContext, useNavigate } from 'react-router-dom'

import FormularioIngreso from '../components/FormularioContacto' 
import { iniciarSesion } from '../service/authService' 
import casalogin from '../../../assets/casalogin.jpg'
import '../../../styles/Login.css'

function LoginPage() {
    // Obtenemos setSesion del Layout (si es que tu LayoutPublico lo provee)
    const { setSesion } = useOutletContext() 
    const navigate = useNavigate()

    // Esta es la función puente que le pasamos al formulario
    const handleIngresar = async (dni, usuario) => {
        // 1. Usamos tu auth.js real, que hace el fetch y guarda en sessionStorage
        const sesionData = await iniciarSesion(dni, usuario)
        
        // 2. Actualizamos el estado global (Context)
        if (setSesion) {
            setSesion(sesionData)
        }
        
        // 3. Redirigimos
        if (sesionData.rol === 'administrador') {
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