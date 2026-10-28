import { useOutletContext, useNavigate } from 'react-router-dom'

import FormularioIngreso from '../components/FormularioContacto' 
import { iniciarSesion } from '../service/authService' 
import casalogin from '../../../assets/casalogin.jpg'
import '../../../styles/Login.css'

function LoginPage() {
    const { setSesion } = useOutletContext() 
    const navigate = useNavigate()

    const handleIngresar = async (dni, contrasena) => {
        const sesionData = await iniciarSesion(dni, contrasena)
        
        if (setSesion) {
            setSesion(sesionData)
        }
        
        if (sesionData.rol === 'cliente') {
            navigate('/cliente')
        } else {
            navigate('/principal')
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
                <FormularioIngreso onIngresar={handleIngresar} />
            </section>
        </main>
    )
}

export default LoginPage