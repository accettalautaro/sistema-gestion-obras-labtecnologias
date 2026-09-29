import { createBrowserRouter, redirect } from 'react-router-dom'
import LayoutPublico from './shared/layout/LayoutPublico'
import LayoutGestor from './shared/layout/LayoutGestor'
import NoEncontradaPage from './shared/pages/NoEncontradaPage'
import Spinner from './shared/components/Spinner'
import { HomePage, ProyectosPage, ProyectoPage } from './features/home'
import { ContactoPage } from './features/contacto'
import { PrincipalPage } from './features/principal'
import { ClientesPage } from './features/clientes'
import { LoginPage, protegerRuta, redirigirSiHaySesion } from './features/login'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutPublico />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'contacto', element: <ContactoPage /> },
      { path: 'login', element: <LoginPage />,
        loader: redirigirSiHaySesion,
        hydrateFallbackElement: <Spinner />

      },
      { path: 'proyectos', element: <ProyectosPage /> },
      { path: 'proyecto/:id', element: <ProyectoPage /> },
      { path: '*', element: <NoEncontradaPage /> },
    ],
  },
  {
    path: '/principal',
    element: <LayoutGestor />,
    loader: protegerRuta,
    hydrateFallbackElement: <Spinner />,
    errorElement: <NoEncontradaPage />,
    children: [
      { index: true, element: <PrincipalPage /> },
      { path: 'clientes', element: <ClientesPage /> },
    ]
  },
  
])
