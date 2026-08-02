import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import type { Modality, Schedule, Service, University } from '../../lib/types';

interface AdminService extends Service {
  active: boolean;
}

/**
 * Gestión del directorio de servicios (HU-15). Solo administración:
 * la política RLS services_admin_all autoriza estas escrituras.
 */
export default function ServicesAdmin() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    university_id: '',
    specialty: '',
    description: '',
    modality: 'presencial' as Modality,
    schedule: 'diurno' as Schedule,
    contact: '',
  });

  const load = useCallback(async () => {
    const [servicesRes, unisRes] = await Promise.all([
      supabase
        .from('services')
        .select(
          'id, university_id, name, description, specialty, modality, schedule, contact, active',
        )
        .order('name'),
      supabase.from('universities').select('id, name, email_domain'),
    ]);
    if (servicesRes.error) {
      setError('No se pudo cargar el directorio.');
      return;
    }
    setServices(servicesRes.data ?? []);
    setUniversities(unisRes.data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const universityName = (id: string | null) =>
    id
      ? (universities.find((u) => u.id === id)?.name ?? 'Universidad')
      : 'Consorcio';

  async function create(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const { error: insertError } = await supabase.from('services').insert({
      name: form.name.trim(),
      university_id: form.university_id || null,
      specialty: form.specialty.trim() || null,
      description: form.description.trim() || null,
      modality: form.modality,
      schedule: form.schedule,
      contact: form.contact.trim() || null,
    });
    if (insertError) {
      setError('No se pudo crear el servicio. Revisa los campos.');
      return;
    }
    setForm({
      name: '',
      university_id: '',
      specialty: '',
      description: '',
      modality: 'presencial',
      schedule: 'diurno',
      contact: '',
    });
    void load();
  }

  async function toggleActive(service: AdminService) {
    await supabase
      .from('services')
      .update({ active: !service.active })
      .eq('id', service.id);
    void load();
  }

  async function remove(service: AdminService) {
    if (!window.confirm(`¿Eliminar "${service.name}" del directorio?`)) return;
    await supabase.from('services').delete().eq('id', service.id);
    void load();
  }

  const inputClass =
    'mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700';

  return (
    <div className="space-y-6">
      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => void create(e)}
        className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        <h2 className="font-bold text-gray-900 sm:col-span-2">
          Agregar servicio
        </h2>
        <div>
          <label htmlFor="srv-nombre" className="block text-sm font-medium">
            Nombre *
          </label>
          <input
            id="srv-nombre"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="srv-uni" className="block text-sm font-medium">
            Alcance
          </label>
          <select
            id="srv-uni"
            value={form.university_id}
            onChange={(e) =>
              setForm({ ...form, university_id: e.target.value })
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
          <label htmlFor="srv-esp" className="block text-sm font-medium">
            Especialidad
          </label>
          <input
            id="srv-esp"
            value={form.specialty}
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="srv-contacto" className="block text-sm font-medium">
            Contacto
          </label>
          <input
            id="srv-contacto"
            value={form.contact}
            onChange={(e) => setForm({ ...form, contact: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="srv-modalidad" className="block text-sm font-medium">
            Modalidad
          </label>
          <select
            id="srv-modalidad"
            value={form.modality}
            onChange={(e) =>
              setForm({ ...form, modality: e.target.value as Modality })
            }
            className={inputClass}
          >
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
            <option value="mixta">Mixta</option>
          </select>
        </div>
        <div>
          <label htmlFor="srv-horario" className="block text-sm font-medium">
            Horario
          </label>
          <select
            id="srv-horario"
            value={form.schedule}
            onChange={(e) =>
              setForm({ ...form, schedule: e.target.value as Schedule })
            }
            className={inputClass}
          >
            <option value="diurno">Diurno</option>
            <option value="vespertino">Vespertino</option>
            <option value="nocturno">Nocturno</option>
            <option value="24h">24 horas</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="srv-desc" className="block text-sm font-medium">
            Descripción
          </label>
          <textarea
            id="srv-desc"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-violet-800 px-5 py-2 font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700 sm:col-span-2 sm:justify-self-start"
        >
          Crear servicio
        </button>
      </form>

      <ul className="space-y-3">
        {services.map((service) => (
          <li
            key={service.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${
              service.active
                ? 'border-gray-200 bg-white'
                : 'border-gray-300 bg-gray-100 opacity-70'
            }`}
          >
            <div>
              <p className="font-bold text-gray-900">
                {service.name}
                {!service.active && (
                  <span className="ml-2 text-sm font-semibold text-gray-600">
                    (inactivo)
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-700">
                {universityName(service.university_id)} · {service.modality} ·{' '}
                {service.schedule}
                {service.contact ? ` · ${service.contact}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void toggleActive(service)}
                className="rounded-lg border-2 border-violet-800 px-3 py-1 text-sm font-semibold text-violet-900 hover:bg-violet-50"
              >
                {service.active ? 'Desactivar' : 'Activar'}
              </button>
              <button
                type="button"
                onClick={() => void remove(service)}
                className="rounded-lg border-2 border-red-700 px-3 py-1 text-sm font-semibold text-red-800 hover:bg-red-50"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
