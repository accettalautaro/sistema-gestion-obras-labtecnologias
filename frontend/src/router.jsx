import { createBrowserRouter } from 'react-router-dom'
import LayoutPublico from './shared/layout/LayoutPublico'
import LayoutGestor from './shared/layout/LayoutGestor'
import NoEncontradaPage from './shared/pages/NoEncontradaPage'
import Spinner from './shared/components/Spinner'
import { HomePage, ProyectosPage, ProyectoPage } from './features/home'
import { ContactoPage } from './features/contacto'
import { PrincipalPage } from './features/principal'
import { ClientesPage } from './features/clientes'
import { PagosPage } from './features/pagos'
import { RecordatoriosPage } from './features/recordatorios'
import { LoginPage, protegerRuta, redirigirSiHaySesion } from './features/login'
import LayoutCliente from './shared/layout/LayoutClient'
import ClientePage from './features/dashCliente/pages/clientePage'
import { ViewObraPage } from './features/viewObra'
import { ViewPagoPage } from './features/viewPago'
import { ObrasPage, SeguimientoObraPage, SeleccionarSeguimientoPage, GestionarTareasPage } from './features/obras'
import { TerrenosPage, PropietariosPage } from './features/terrenos'


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
      { path: 'obras', element: <ObrasPage /> },
      { path: 'obras/:id/tareas', element: <GestionarTareasPage /> },
      { path: 'seguimiento', element: <SeleccionarSeguimientoPage /> },
      { path: 'obras/:id/avance', element: <SeguimientoObraPage /> },
      { path: 'terrenos/:nrolote?', element: <TerrenosPage /> },
      { path: 'terrenos/:nrolote/propietarios', element: <PropietariosPage /> },
      { path: 'pagos', element: <PagosPage /> },
      { path: 'recordatorios', element: <RecordatoriosPage /> },
    ]
  },
  {
    path: '/cliente',
    element: <LayoutCliente />,
    loader: protegerRuta,
    hydrateFallbackElement: <Spinner />,
    errorElement: <NoEncontradaPage />,
    children: [
      { index: true, element: <ClientePage /> },
      { path: 'obras/:id', element: <ViewObraPage /> },
      { path: 'obras/:idObra/tareas/:idTarea', element: <ViewPagoPage /> },
      { path: 'lotes/:nrolote', element: <TerrenosPage /> },
    ]
  },
  
])
