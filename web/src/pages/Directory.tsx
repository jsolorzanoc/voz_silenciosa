import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { filterServices } from '../lib/filterServices';
import type { Modality, Schedule, Service } from '../lib/types';

const MODALITY_LABELS: Record<Modality, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  mixta: 'Presencial y virtual',
};

const SCHEDULE_LABELS: Record<Schedule, string> = {
  diurno: 'Diurno',
  vespertino: 'Vespertino',
  nocturno: 'Nocturno',
  '24h': '24 horas',
};

/**
 * Directorio buscable de servicios (HU-06).
 * RLS ya limita el alcance: el estudiante recibe solo los servicios de
 * su universidad y los generales del consorcio; aquí solo se filtra y
 * se presenta. Sin resultados => estado vacío controlado con enlace a
 * la línea de ayuda, nunca un error.
 */
export default function Directory() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modality, setModality] = useState<Modality | ''>('');
  const [schedule, setSchedule] = useState<Schedule | ''>('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    supabase
      .from('services')
      .select(
        'id, university_id, name, description, specialty, modality, schedule, contact',
      )
      .then(({ data, error }) => {
        setLoading(false);
        if (error) {
          setLoadError(true);
        } else {
          setServices(data ?? []);
        }
      });
  }, []);

  const visible = useMemo(
    () => filterServices(services, { modality, schedule, query }),
    [services, modality, schedule, query],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Directorio de servicios de apoyo
        </h1>
        <p className="mt-2 text-gray-700">
          Servicios de tu universidad y del consorcio RUBE-CR. Combina los
          filtros para encontrar el recurso que mejor se ajuste a ti.
        </p>
      </div>

      <form
        aria-label="Filtros del directorio"
        className="grid gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-3"
        onSubmit={(e) => e.preventDefault()}
      >
        <div>
          <label htmlFor="busqueda" className="block font-medium text-gray-900">
            Buscar
          </label>
          <input
            id="busqueda"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ej. consejería"
            className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
          />
        </div>

        <div>
          <label
            htmlFor="modalidad"
            className="block font-medium text-gray-900"
          >
            Modalidad
          </label>
          <select
            id="modalidad"
            value={modality}
            onChange={(e) => setModality(e.target.value as Modality | '')}
            className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
          >
            <option value="">Todas</option>
            <option value="presencial">Presencial</option>
            <option value="virtual">Virtual</option>
          </select>
        </div>

        <div>
          <label htmlFor="horario" className="block font-medium text-gray-900">
            Horario
          </label>
          <select
            id="horario"
            value={schedule}
            onChange={(e) => setSchedule(e.target.value as Schedule | '')}
            className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
          >
            <option value="">Todos</option>
            <option value="diurno">Diurno</option>
            <option value="vespertino">Vespertino</option>
            <option value="nocturno">Nocturno</option>
            <option value="24h">24 horas</option>
          </select>
        </div>
      </form>

      <div aria-live="polite">
        {loading ? (
          <p role="status" className="p-4 text-center text-gray-600">
            Cargando servicios…
          </p>
        ) : loadError ? (
          <EmptyState
            title="No pudimos cargar el directorio"
            body="Intenta de nuevo en unos minutos. Si necesitas apoyo ahora, usa el botón rojo de Ayuda 24/7: siempre está disponible."
          />
        ) : visible.length === 0 ? (
          <EmptyState
            title="No encontramos servicios con esos filtros"
            body="Prueba con otra combinación de modalidad y horario. Si necesitas apoyo inmediato, el botón rojo de Ayuda 24/7 te conecta con una línea real a cualquier hora."
            onClear={() => {
              setModality('');
              setSchedule('');
              setQuery('');
            }}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {visible.map((service) => (
              <li
                key={service.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-bold text-gray-900">{service.name}</h2>
                  <span className="whitespace-nowrap rounded-full bg-violet-100 px-2 py-1 text-xs font-semibold text-violet-900">
                    {service.university_id ? 'Tu universidad' : 'Consorcio'}
                  </span>
                </div>
                {service.specialty && (
                  <p className="mt-1 text-sm font-medium text-violet-800">
                    {service.specialty}
                  </p>
                )}
                {service.description && (
                  <p className="mt-2 text-gray-700">{service.description}</p>
                )}
                <dl className="mt-3 space-y-1 text-sm text-gray-700">
                  <div className="flex gap-2">
                    <dt className="font-semibold">Modalidad:</dt>
                    <dd>{MODALITY_LABELS[service.modality]}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-semibold">Horario:</dt>
                    <dd>{SCHEDULE_LABELS[service.schedule]}</dd>
                  </div>
                  {service.contact && (
                    <div className="flex gap-2">
                      <dt className="font-semibold">Contacto:</dt>
                      <dd>{service.contact}</dd>
                    </div>
                  )}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  onClear,
}: {
  title: string;
  body: string;
  onClear?: () => void;
}) {
  return (
    <div className="rounded-xl border border-gray-300 bg-white p-8 text-center">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-gray-700">{body}</p>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-lg border-2 border-violet-800 px-5 py-2 font-semibold text-violet-900 hover:bg-violet-50 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
