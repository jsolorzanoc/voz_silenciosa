import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { formatSessionDate } from '../../lib/dates';
import type { GroupSession, SupportGroup, University } from '../../lib/types';

/**
 * Gestión de grupos de apoyo y su calendario de sesiones
 * (WBS 1.4.1, 1.4.2). Solo administración.
 */
export default function GroupsAdmin() {
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    topic: '',
    description: '',
    university_id: '',
  });
  const [sessionForm, setSessionForm] = useState({
    group_id: '',
    title: '',
    starts_at: '',
    modality: 'virtual' as 'virtual' | 'presencial',
    location: '',
  });

  const load = useCallback(async () => {
    const [groupsRes, sessionsRes, unisRes] = await Promise.all([
      supabase
        .from('support_groups')
        .select('id, university_id, name, topic, description, active')
        .order('name'),
      supabase
        .from('group_sessions')
        .select('id, group_id, title, starts_at, modality, location')
        .gte('starts_at', new Date().toISOString())
        .order('starts_at'),
      supabase.from('universities').select('id, name, email_domain'),
    ]);
    if (groupsRes.error) {
      setError('No se pudieron cargar los grupos.');
      return;
    }
    setGroups(groupsRes.data ?? []);
    setSessions(sessionsRes.data ?? []);
    setUniversities(unisRes.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createGroup(event: FormEvent) {
    event.preventDefault();
    const { error: insertError } = await supabase
      .from('support_groups')
      .insert({
        name: groupForm.name.trim(),
        topic: groupForm.topic.trim(),
        description: groupForm.description.trim() || null,
        university_id: groupForm.university_id || null,
      });
    if (insertError) {
      setError('No se pudo crear el grupo.');
      return;
    }
    setGroupForm({ name: '', topic: '', description: '', university_id: '' });
    void load();
  }

  async function createSession(event: FormEvent) {
    event.preventDefault();
    const { error: insertError } = await supabase
      .from('group_sessions')
      .insert({
        group_id: sessionForm.group_id,
        title: sessionForm.title.trim(),
        starts_at: new Date(sessionForm.starts_at).toISOString(),
        modality: sessionForm.modality,
        location: sessionForm.location.trim() || null,
      });
    if (insertError) {
      setError('No se pudo programar la sesión.');
      return;
    }
    setSessionForm({
      group_id: '',
      title: '',
      starts_at: '',
      modality: 'virtual',
      location: '',
    });
    void load();
  }

  async function toggleGroup(group: SupportGroup) {
    await supabase
      .from('support_groups')
      .update({ active: !group.active })
      .eq('id', group.id);
    void load();
  }

  const groupName = (id: string) =>
    groups.find((g) => g.id === id)?.name ?? 'Grupo';

  const inputClass =
    'mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700';

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => void createGroup(e)}
          className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <h2 className="font-bold text-gray-900">Crear grupo</h2>
          <div>
            <label htmlFor="grp-nombre" className="block text-sm font-medium">
              Nombre *
            </label>
            <input
              id="grp-nombre"
              required
              value={groupForm.name}
              onChange={(e) =>
                setGroupForm({ ...groupForm, name: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="grp-tema" className="block text-sm font-medium">
              Tema *
            </label>
            <input
              id="grp-tema"
              required
              value={groupForm.topic}
              onChange={(e) =>
                setGroupForm({ ...groupForm, topic: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="grp-uni" className="block text-sm font-medium">
              Alcance
            </label>
            <select
              id="grp-uni"
              value={groupForm.university_id}
              onChange={(e) =>
                setGroupForm({ ...groupForm, university_id: e.target.value })
              }
              className={inputClass}
            >
              <option value="">Consorcio (todas)</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="grp-desc" className="block text-sm font-medium">
              Descripción
            </label>
            <textarea
              id="grp-desc"
              rows={2}
              value={groupForm.description}
              onChange={(e) =>
                setGroupForm({ ...groupForm, description: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-violet-800 px-5 py-2 font-bold text-white hover:bg-violet-900"
          >
            Crear grupo
          </button>
        </form>

        <form
          onSubmit={(e) => void createSession(e)}
          className="space-y-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <h2 className="font-bold text-gray-900">Programar sesión</h2>
          <div>
            <label htmlFor="ses-grupo" className="block text-sm font-medium">
              Grupo *
            </label>
            <select
              id="ses-grupo"
              required
              value={sessionForm.group_id}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, group_id: e.target.value })
              }
              className={inputClass}
            >
              <option value="">Selecciona un grupo…</option>
              {groups
                .filter((g) => g.active)
                .map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label htmlFor="ses-titulo" className="block text-sm font-medium">
              Título *
            </label>
            <input
              id="ses-titulo"
              required
              value={sessionForm.title}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, title: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="ses-fecha" className="block text-sm font-medium">
              Fecha y hora *
            </label>
            <input
              id="ses-fecha"
              type="datetime-local"
              required
              value={sessionForm.starts_at}
              onChange={(e) =>
                setSessionForm({ ...sessionForm, starts_at: e.target.value })
              }
              className={inputClass}
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="ses-modalidad"
                className="block text-sm font-medium"
              >
                Modalidad
              </label>
              <select
                id="ses-modalidad"
                value={sessionForm.modality}
                onChange={(e) =>
                  setSessionForm({
                    ...sessionForm,
                    modality: e.target.value as 'virtual' | 'presencial',
                  })
                }
                className={inputClass}
              >
                <option value="virtual">Virtual</option>
                <option value="presencial">Presencial</option>
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="ses-lugar" className="block text-sm font-medium">
                Lugar / enlace
              </label>
              <input
                id="ses-lugar"
                value={sessionForm.location}
                onChange={(e) =>
                  setSessionForm({ ...sessionForm, location: e.target.value })
                }
                className={inputClass}
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-violet-800 px-5 py-2 font-bold text-white hover:bg-violet-900"
          >
            Programar sesión
          </button>
        </form>
      </div>

      <section aria-labelledby="lista-grupos">
        <h2 id="lista-grupos" className="text-lg font-bold text-gray-900">
          Grupos existentes
        </h2>
        <ul className="mt-3 space-y-3">
          {groups.map((group) => (
            <li
              key={group.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
                group.active
                  ? 'border-gray-200 bg-white'
                  : 'border-gray-300 bg-gray-100 opacity-70'
              }`}
            >
              <div>
                <p className="font-bold text-gray-900">
                  {group.name}
                  {!group.active && (
                    <span className="ml-2 text-sm font-semibold text-gray-600">
                      (inactivo)
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-700">
                  {group.topic} ·{' '}
                  {group.university_id ? 'Universidad' : 'Consorcio'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void toggleGroup(group)}
                className="rounded-lg border-2 border-violet-800 px-3 py-1 text-sm font-semibold text-violet-900 hover:bg-violet-50"
              >
                {group.active ? 'Desactivar' : 'Activar'}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="lista-sesiones">
        <h2 id="lista-sesiones" className="text-lg font-bold text-gray-900">
          Próximas sesiones
        </h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-gray-600">No hay sesiones programadas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sessions.map((s) => (
              <li key={s.id} className="text-gray-800">
                📅 <span className="font-semibold">{s.title}</span> —{' '}
                {groupName(s.group_id)} · {formatSessionDate(s.starts_at)} ·{' '}
                {s.modality === 'virtual' ? 'Virtual' : 'Presencial'}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
