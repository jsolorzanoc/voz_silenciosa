import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { formatSessionDate } from '../lib/dates';
import type { GroupSession, SupportGroup } from '../lib/types';

/**
 * Grupos de apoyo temáticos (HU-12) y avisos de próximas sesiones
 * (HU-14). RLS limita el alcance: se ven los grupos del consorcio y
 * los de la propia universidad.
 */
export default function Groups() {
  const { session } = useAuth();
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [memberships, setMemberships] = useState<Set<string>>(new Set());
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [groupsRes, membersRes, sessionsRes] = await Promise.all([
      supabase
        .from('support_groups')
        .select('id, university_id, name, topic, description, active')
        .order('name'),
      supabase.from('group_members').select('group_id'),
      supabase
        .from('group_sessions')
        .select('id, group_id, title, starts_at, modality, location')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at')
        .limit(5),
    ]);
    setLoading(false);
    if (groupsRes.error) {
      setError('No se pudieron cargar los grupos. Intenta de nuevo.');
      return;
    }
    setGroups(groupsRes.data ?? []);
    setMemberships(new Set((membersRes.data ?? []).map((m) => m.group_id)));
    setSessions(sessionsRes.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function join(groupId: string) {
    if (!session) return;
    const { error: joinError } = await supabase
      .from('group_members')
      .insert({ group_id: groupId, user_id: session.user.id });
    if (!joinError) void load();
  }

  async function leave(groupId: string) {
    if (!session) return;
    const { error: leaveError } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', session.user.id);
    if (!leaveError) void load();
  }

  const groupName = (id: string) =>
    groups.find((g) => g.id === id)?.name ?? 'Grupo';

  if (loading) {
    return (
      <p role="status" className="p-8 text-center text-gray-600">
        Cargando grupos…
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Grupos de apoyo</h1>
        <p className="mt-2 text-gray-700">
          Espacios seguros y moderados para compartir con pares. Dentro del
          grupo solo existe tu seudónimo.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
          {error}
        </p>
      )}

      {sessions.length > 0 && (
        <section
          aria-labelledby="proximas-sesiones"
          className="rounded-xl border border-violet-200 bg-violet-50 p-5"
        >
          <h2 id="proximas-sesiones" className="font-bold text-violet-950">
            Próximas sesiones de tus grupos
          </h2>
          <ul className="mt-3 space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="text-gray-800">
                <span className="font-semibold">{s.title}</span> —{' '}
                {groupName(s.group_id)} · {formatSessionDate(s.starts_at)} ·{' '}
                {s.modality === 'virtual' ? 'Virtual' : 'Presencial'}
                {s.location ? ` · ${s.location}` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}

      {groups.length === 0 ? (
        <p className="rounded-xl border border-gray-300 bg-white p-8 text-center text-gray-700">
          Aún no hay grupos disponibles para tu universidad. Vuelve pronto.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const isMember = memberships.has(group.id);
            return (
              <li
                key={group.id}
                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-gray-900">{group.name}</h2>
                  <span className="whitespace-nowrap rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-900">
                    {group.university_id ? 'Tu universidad' : 'Consorcio'}
                  </span>
                </div>
                <p className="mt-1 text-sm font-medium text-violet-800">
                  {group.topic}
                </p>
                {group.description && (
                  <p className="mt-2 flex-1 text-gray-700">
                    {group.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {isMember ? (
                    <>
                      <Link
                        to={`/grupos/${group.id}`}
                        className="rounded-lg bg-violet-800 px-4 py-2 font-semibold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
                      >
                        Entrar al foro
                      </Link>
                      <button
                        type="button"
                        onClick={() => void leave(group.id)}
                        className="rounded-lg border-2 border-gray-400 px-4 py-2 font-semibold text-gray-800 hover:bg-gray-100 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
                      >
                        Salir del grupo
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void join(group.id)}
                      className="rounded-lg border-2 border-violet-800 px-4 py-2 font-semibold text-violet-900 hover:bg-violet-50 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
                    >
                      Unirme al grupo
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
