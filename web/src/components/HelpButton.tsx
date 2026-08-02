import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { EmergencyLine } from '../lib/types';

/**
 * Botón de ayuda inmediata 24/7 (HU-09) con protocolo de respaldo (HU-10).
 *
 * - Visible en todas las vistas a un toque (lo monta el Layout).
 * - Conecta con líneas reales verificadas, nunca un bot.
 * - Si la carga del canal principal falla, muestra las líneas de respaldo
 *   y, como última salida, el 9-1-1 fijo en el código: el usuario nunca
 *   queda sin salida.
 * - Cada uso se registra con marca de tiempo, sin datos sensibles
 *   (la tabla help_events no guarda user_id).
 */

// Última salida si ni siquiera la base de datos responde
const LAST_RESORT_LINE = {
  name: 'Sistema de Emergencias 9-1-1',
  phone: '911',
  description: 'Emergencias con riesgo inmediato para la vida.',
};

function logHelpEvent(
  channel: 'principal' | 'respaldo',
  outcome: 'ok' | 'fallo_canal',
) {
  // Registro sin datos sensibles; los errores se ignoran a propósito:
  // el registro jamás debe bloquear el acceso a la ayuda.
  void supabase
    .from('help_events')
    .insert({ channel, outcome })
    .then(() => undefined);
}

// Copia local de las líneas para que el botón funcione sin conexión
// (modo offline de la PWA, WBS 1.6.1.2). Son datos públicos, no sensibles.
const LINES_CACHE_KEY = 'lvs_emergency_lines';

function readCachedLines(): EmergencyLine[] {
  try {
    const raw = localStorage.getItem(LINES_CACHE_KEY);
    const parsed = raw ? (JSON.parse(raw) as EmergencyLine[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<EmergencyLine[]>([]);
  const [channelFailed, setChannelFailed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback(async () => {
    setOpen(true);
    try {
      const { data, error } = await supabase
        .from('emergency_lines')
        .select('*')
        .eq('active', true)
        .order('priority', { ascending: true });

      if (error || !data || data.length === 0) {
        throw new Error('canal principal no disponible');
      }
      setChannelFailed(false);
      setLines(data);
      localStorage.setItem(LINES_CACHE_KEY, JSON.stringify(data));
      logHelpEvent('principal', 'ok');
    } catch {
      // Protocolo de respaldo (HU-10): canal caído o sin conexión.
      // Se usan las líneas guardadas localmente; si tampoco hay,
      // queda el 9-1-1 fijo en el código. Nunca sin salida.
      setChannelFailed(true);
      setLines(readCachedLines());
      logHelpEvent('respaldo', 'fallo_canal');
    }
  }, []);

  useEffect(() => {
    if (open) closeButtonRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const primaryLines = lines.filter((line) => !line.is_backup);
  const backupLines = lines.filter((line) => line.is_backup);

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        aria-label="Ayuda inmediata, disponible 24 horas"
        className="fixed bottom-5 right-5 z-50 rounded-full bg-red-700 px-5 py-3 text-base font-bold text-white shadow-lg transition hover:bg-red-800 focus:outline-4 focus:outline-offset-2 focus:outline-red-700"
      >
        Ayuda 24/7
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-ayuda"
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="titulo-ayuda" className="text-xl font-bold text-gray-900">
                Apoyo inmediato con una persona real
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="rounded-md px-2 py-1 text-2xl leading-none text-gray-600 hover:bg-gray-100 focus:outline-2 focus:outline-violet-700"
              >
                ×
              </button>
            </div>

            <p className="mt-2 text-gray-700">
              Estas líneas son atendidas por personas reales, no por bots. Si tu
              vida o la de alguien más está en riesgo, llama al 9-1-1.
            </p>

            {channelFailed && (
              <p
                role="alert"
                className="mt-3 rounded-md bg-amber-100 p-3 text-amber-900"
              >
                {lines.length > 0
                  ? 'Sin conexión con el canal principal: te mostramos las líneas guardadas en tu dispositivo. Siempre hay una salida disponible.'
                  : 'No pudimos cargar las líneas. Usa el número de emergencias: siempre hay una salida disponible.'}
              </p>
            )}

            <ul className="mt-4 space-y-3">
              {primaryLines.map((line) => (
                <li key={line.id}>
                  <LineCard
                    name={line.name}
                    phone={line.phone}
                    description={line.description}
                  />
                </li>
              ))}
              {backupLines.map((line) => (
                <li key={line.id}>
                  <LineCard
                    name={`${line.name} (respaldo)`}
                    phone={line.phone}
                    description={line.description}
                  />
                </li>
              ))}
              {channelFailed && lines.length === 0 && (
                <li>
                  <LineCard
                    name={LAST_RESORT_LINE.name}
                    phone={LAST_RESORT_LINE.phone}
                    description={LAST_RESORT_LINE.description}
                  />
                </li>
              )}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

function LineCard({
  name,
  phone,
  description,
}: {
  name: string;
  phone: string;
  description: string | null;
}) {
  return (
    <a
      href={`tel:${phone.replace(/[^+\d]/g, '')}`}
      className="block rounded-lg border-2 border-red-700 p-4 hover:bg-red-50 focus:outline-4 focus:outline-red-700"
    >
      <span className="block font-bold text-red-800">{name}</span>
      <span className="block text-2xl font-extrabold tracking-wide text-gray-900">
        {phone}
      </span>
      {description && (
        <span className="mt-1 block text-sm text-gray-700">{description}</span>
      )}
    </a>
  );
}
