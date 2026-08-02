import { Navigate } from 'react-router';
import type { ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Acceso solo para administradores (HU-17). La autoridad real es RLS:
 * aunque alguien llegue a esta ruta, la base de datos no le sirve datos
 * de administración.
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading || (session && !profile)) {
    return (
      <p className="p-8 text-center text-gray-600" role="status">
        Cargando…
      </p>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
