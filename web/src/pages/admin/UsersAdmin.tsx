import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Profile, University } from '../../lib/types';

/**
 * Gestión de usuarios y roles con RLS (HU-17).
 * La lista solo expone seudónimo, rol y universidad: el correo real
 * nunca sale de auth y el anonimato se mantiene incluso ante
 * administración.
 */
export default function UsersAdmin() {
  const { profile: me } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [profilesRes, unisRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, pseudonym, university_id, role')
        .order('pseudonym'),
      supabase.from('universities').select('id, name, email_domain'),
    ]);
    if (profilesRes.error) {
      setError('No se pudieron cargar los usuarios.');
      return;
    }
    setProfiles(profilesRes.data ?? []);
    setUniversities(unisRes.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const universityName = (id: string) =>
    universities.find((u) => u.id === id)?.name ?? '—';

  async function toggleRole(profile: Profile) {
    const newRole = profile.role === 'admin' ? 'student' : 'admin';
    if (
      !window.confirm(
        `¿Cambiar el rol de "${profile.pseudonym}" a ${newRole === 'admin' ? 'administrador' : 'estudiante'}?`,
      )
    ) {
      return;
    }
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', profile.id);
    void load();
  }

  return (
    <div className="space-y-4">
      <p className="rounded-md bg-violet-50 p-3 text-sm text-gray-800">
        Por diseño solo se ve el seudónimo: el correo institucional no es
        visible ni para administración (Ley 8968).
      </p>

      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
          {error}
        </p>
      )}

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-300 text-gray-700">
            <th scope="col" className="py-2">
              Seudónimo
            </th>
            <th scope="col" className="py-2">
              Universidad
            </th>
            <th scope="col" className="py-2">
              Rol
            </th>
            <th scope="col" className="py-2 text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((profile) => (
            <tr
              key={profile.id}
              className="border-b border-gray-100 text-gray-900"
            >
              <td className="py-2 font-semibold">
                {profile.pseudonym}
                {profile.id === me?.id && (
                  <span className="ml-1 text-xs text-gray-500">(tú)</span>
                )}
              </td>
              <td className="py-2">{universityName(profile.university_id)}</td>
              <td className="py-2">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    profile.role === 'admin'
                      ? 'bg-violet-100 text-violet-900'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {profile.role === 'admin' ? 'Administrador' : 'Estudiante'}
                </span>
              </td>
              <td className="py-2 text-right">
                {profile.id !== me?.id && (
                  <button
                    type="button"
                    onClick={() => void toggleRole(profile)}
                    className="rounded-lg border-2 border-violet-800 px-3 py-1 text-xs font-semibold text-violet-900 hover:bg-violet-50"
                  >
                    {profile.role === 'admin'
                      ? 'Volver estudiante'
                      : 'Hacer administrador'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
