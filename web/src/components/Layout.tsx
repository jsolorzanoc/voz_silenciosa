import { Link, NavLink, Outlet } from 'react-router';
import { useAuth } from '../context/AuthContext';
import HelpButton from './HelpButton';

/**
 * Estructura común: encabezado, navegación, contenido y botón de
 * ayuda 24/7 presente en TODAS las vistas (DoD HU-09).
 * Accesibilidad: enlace para saltar al contenido, navegación por
 * teclado y contraste AA.
 */
export default function Layout() {
  const { session, profile, signOut } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-2 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-white ${
      isActive
        ? 'bg-violet-950 text-white'
        : 'text-violet-100 hover:bg-violet-800'
    }`;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-violet-900"
      >
        Saltar al contenido principal
      </a>

      <header className="bg-violet-900 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="text-lg font-bold focus:outline-2 focus:outline-offset-2 focus:outline-white"
          >
            La Voz Silenciosa
          </Link>

          <nav
            aria-label="Navegación principal"
            className="flex flex-wrap items-center gap-1"
          >
            <NavLink to="/" end className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/autoevaluacion" className={navLinkClass}>
              Autoevaluación
            </NavLink>
            <NavLink to="/directorio" className={navLinkClass}>
              Directorio
            </NavLink>
            <NavLink to="/grupos" className={navLinkClass}>
              Grupos
            </NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={navLinkClass}>
                Panel
              </NavLink>
            )}

            {session ? (
              <div className="ml-2 flex items-center gap-2">
                <span className="rounded-full bg-violet-800 px-3 py-1 text-sm">
                  {profile?.pseudonym ?? '…'}
                </span>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="rounded-md px-3 py-2 font-medium text-violet-100 hover:bg-violet-800 focus:outline-2 focus:outline-offset-2 focus:outline-white"
                >
                  Salir
                </button>
              </div>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                Ingresar
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main
        id="contenido"
        className="mx-auto w-full max-w-5xl flex-1 px-4 py-8"
      >
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-600">
        <p>
          La Voz Silenciosa orienta, no diagnostica. Tus datos se tratan de
          forma confidencial según la Ley 8968 de Costa Rica.
        </p>
      </footer>

      <HelpButton />
    </div>
  );
}
