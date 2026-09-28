import { createBrowserRouter, redirect } from 'react-router-dom'
import LayoutPublico from './shared/layout/LayoutPublico.jsx'
import LayoutPrivado from './shared/layout/LayoutPrivado.jsx'
import HomePage from './features/home/pages/HomePage.jsx'
import ContactoPage from './features/contacto/pages/ContactoPage.jsx'
import LoginPage from './features/login/pages/LoginPage.jsx'
import ProyectosPage from './features/home/pages/ProyectosPage.jsx'
import ProyectoPage from './features/home/pages/ProyectoPage.jsx'
import PrincipalPage from './features/principal/pages/PrincipalPage.jsx'
import ClientesPage from './features/clientes/pages/ClientesPage.jsx'

const loaderProtegido = () => {
  const sessionString = localStorage.getItem('sesion-usuario')
  if (!sessionString) {
    return redirect('/login')
  }
  return JSON.parse(sessionString)
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutPublico />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'contacto', element: <ContactoPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'proyectos', element: <ProyectosPage /> },
      { path: 'proyecto/:id', element: <ProyectoPage /> },
    ],
  },
  {
    path: '/principal',
    element: <LayoutPrivado />,
    loader: loaderProtegido,
    children: [
      { index: true, element: <PrincipalPage /> },
      { path: 'clientes', element: <ClientesPage /> },
    ]
  }
])
