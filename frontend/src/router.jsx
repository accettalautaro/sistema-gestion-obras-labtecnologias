import { createBrowserRouter, redirect } from 'react-router-dom'
import LayoutPublico from './shared/layout/LayoutPublico'
import LayoutPrivado from './shared/layout/LayoutPrivado'
import NoEncontradaPage from './shared/pages/NoEncontradaPage'
import { HomePage, ProyectosPage, ProyectoPage } from './features/home'
import { ContactoPage } from './features/contacto'
import { PrincipalPage } from './features/principal'
import { ClientesPage } from './features/clientes'
import { PagosPage } from './features/pagos'
import { LoginPage, protegerRuta, redirigirSiHaySesion } from './features/login'
import { ObrasPage } from './features/obras'


export const router = createBrowserRouter([
  {
    path: '/',
    element: <LayoutPublico />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'contacto', element: <ContactoPage /> },
      { path: 'login', element: <LoginPage />,
        loader: redirigirSiHaySesion,

      },
      { path: 'proyectos', element: <ProyectosPage /> },
      { path: 'proyecto/:id', element: <ProyectoPage /> },
      { path: '*', element: <NoEncontradaPage /> },
    ],
  },
  {
    path: '/principal',
    element: <LayoutPrivado />,
    loader: protegerRuta,
    children: [
      { index: true, element: <PrincipalPage /> },
      { path: 'clientes', element: <ClientesPage /> },
      { path: 'obras', element: <ObrasPage /> },
      { path: 'pagos', element: <PagosPage /> },
    ]
  },
  { path: '*', element: <NoEncontradaPage /> },
])
