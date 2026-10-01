import { NavLink, Outlet, ScrollRestoration, useLoaderData, useNavigate } from 'react-router-dom'
import NavbarGestor from './NavbarGestor'
import { cerrarSesion } from '../../features/login'
import { useFetch } from '../hooks/useFetch'
import { obtenerDatosRecordatorios } from '../../features/recordatorios/services/recordatoriosService'
const ENLACES_GESTOR = [
  { id: 1, texto: 'Inicio', destino: '/principal', disponible: true },
  { id: 2, texto: 'Gestión de clientes', destino: '/principal/clientes', disponible: true, requiereArquitecto: true },

  { id: 3, texto: 'Gestión de obras', destino: '/principal/obras', disponible: true, requiereArquitecto: true },
  { id: 4, texto: 'Gestión de terrenos', destino: '/principal/terrenos', disponible: true, requiereArquitecto: true },
  { id: 5, texto: 'Gestión de pagos', destino: '/principal/pagos', disponible: true, requiereArquitecto: true },
  { id: 6, texto: 'Recordatorios', destino: '/principal/recordatorios', disponible: true },

]

function LayoutGestor() {
  // El loader (protegerRuta) ya te devuelve { id, nombre, dni, usuario, rol }
  const usuario = useLoaderData()
  const navigate = useNavigate()

  // ¡Magia! Leemos el rol directamente de la sesión. 
  // (Si en tu sistema el arquitecto usa la cuenta de administrador, lo validas así):
  const esArquitecto = usuario?.rol === 'administrador' || usuario?.rol === 'arquitecto'

  const handleCerrarSesion = () => {
    cerrarSesion()
    navigate('/login', { replace: true })
  }

  // Lógica de badge para recordatorios
  const { datos: datosRec } = useFetch(obtenerDatosRecordatorios);
  let recordatoriosAtrasados = 0;
  let recordatoriosProximos = 0;

  if (datosRec) {
    const hoy = new Date('2026-09-30T00:00:00');
    const calcularDiff = (fechaStr) => {
      if (!fechaStr) return null;
      const fecha = new Date(fechaStr + 'T00:00:00');
      return Math.ceil((fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
    };

    const { tareas = [], recordatorios = [] } = datosRec;

    tareas.forEach(tarea => {
      const diffInicio = calcularDiff(tarea.fechaInicio);
      const diffFin = calcularDiff(tarea.fechaFin);
      const estado = (tarea.estado || '').toLowerCase();

      if (estado === 'sin comenzar') {
        if (diffInicio < 0) recordatoriosAtrasados++;
        else if (diffInicio <= 7) recordatoriosProximos++;
      } else if (estado === 'en ejecucion') {
        if (diffFin < 0) recordatoriosAtrasados++;
        else if (diffFin <= 7) recordatoriosProximos++;
      }
    });
    // Los recordatorios personalizados (json) se manejan dentro de la página,
    // para el badge principal solo contamos las alertas de plazos de tareas.
  }

  return (
    <div className="layout-gestor d-flex flex-column min-vh-100 bg-body-tertiary">
      <NavbarGestor usuario={usuario} handleCerrarSesion={handleCerrarSesion} />

      <div className="d-flex flex-grow-1">
        <aside
          className="offcanvas-lg offcanvas-start sidebar-gestor bg-white border-end"
          tabIndex="-1"
          id="menuGestor"
          aria-labelledby="tituloMenuGestor"
        >
          <div className="offcanvas-header">
            <h2 className="offcanvas-title h6" id="tituloMenuGestor">
              Menú
            </h2>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="offcanvas"
              data-bs-target="#menuGestor"
              aria-label="Cerrar"
            ></button>
          </div>

          <div className="offcanvas-body p-lg-3">
            <nav className="nav nav-pills flex-column w-100 gap-1">
              {ENLACES_GESTOR.map((enlace) => {
                if (enlace.requiereArquitecto && !esArquitecto) return null;
                if (!enlace.disponible) {
                  return (
                    <span
                      key={enlace.id}
                      className="nav-link disabled d-flex justify-content-between align-items-center"
                    >
                      {enlace.texto}
                      <small className="badge text-bg-light">Próximamente</small>
                    </span>
                  );
                }

                const esRecordatorios = enlace.id === 6;
                const mostrarBadge = esRecordatorios && (recordatoriosAtrasados > 0 || recordatoriosProximos > 0);

                return (
                  <NavLink
                    key={enlace.id}
                    className={`nav-link ${mostrarBadge ? 'd-flex justify-content-between align-items-center' : ''}`}
                    to={enlace.destino}
                    end
                  >
                    {enlace.texto}
                    {mostrarBadge && (
                      recordatoriosAtrasados > 0 ? (
                        <span className="badge bg-danger rounded-pill">{recordatoriosAtrasados}</span>
                      ) : (
                        <span className="badge bg-warning rounded-pill">{recordatoriosProximos}</span>
                      )
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>

        <main className="flex-grow-1 p-3 p-lg-4">
          <Outlet context={{ usuario, esArquitecto }} />
        </main>
      </div>

      <ScrollRestoration />
    </div>
  )
}

export default LayoutGestor
