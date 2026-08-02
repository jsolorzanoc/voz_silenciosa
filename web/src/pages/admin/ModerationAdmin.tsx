import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatSessionDate } from '../../lib/dates';
import type { GroupMessage } from '../../lib/types';

/**
 * Moderación de contenido de riesgo del foro (WBS 1.4.3.2).
 * Cola de mensajes marcados por el detector automático o por reportes
 * de la comunidad. La decisión final siempre es humana: aprobar
 * (quitar la marca) u ocultar del foro.
 */
export default function ModerationAdmin() {
  const [flagged, setFlagged] = useState<GroupMessage[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [flaggedRes, hiddenRes] = await Promise.all([
      supabase
        .from('group_messages')
        .select('*')
        .eq('flagged', true)
        .eq('hidden', false)
        .order('created_at', { ascending: true }),
      supabase
        .from('group_messages')
        .select('id', { count: 'exact', head: true })
        .eq('hidden', true),
    ]);
    if (flaggedRes.error) {
      setError('No se pudo cargar la cola de moderación.');
      return;
    }
    setFlagged(flaggedRes.data ?? []);
    setHiddenCount(hiddenRes.count ?? 0);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function moderate(message: GroupMessage, action: 'approve' | 'hide') {
    await supabase
      .from('group_messages')
      .update(action === 'approve' ? { flagged: false } : { hidden: true })
      .eq('id', message.id);
    void load();
  }

  return (
    <div className="space-y-6">
      <p className="rounded-md bg-violet-50 p-3 text-sm text-gray-800">
        Un mensaje marcado puede indicar que un estudiante necesita apoyo: antes
        de moderar, valora activar la ruta de acompañamiento con Bienestar
        Estudiantil. Mensajes ocultos actualmente:{' '}
        <strong>{hiddenCount}</strong>.
      </p>

      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
          {error}
        </p>
      )}

      {flagged.length === 0 ? (
        <p className="rounded-xl border border-gray-300 bg-white p-8 text-center text-gray-700">
          No hay mensajes pendientes de revisión. 🎉
        </p>
      ) : (
        <ul className="space-y-3">
          {flagged.map((message) => (
            <li
              key={message.id}
              className="rounded-xl border-2 border-amber-400 bg-white p-4"
            >
              <p className="text-sm text-gray-600">
                <span className="font-bold text-violet-900">
                  {message.author_pseudonym}
                </span>{' '}
                · {formatSessionDate(message.created_at)}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-gray-900">
                {message.content}
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => void moderate(message, 'approve')}
                  className="rounded-lg border-2 border-green-700 px-3 py-1 text-sm font-semibold text-green-800 hover:bg-green-50"
                >
                  Aprobar (sin riesgo)
                </button>
                <button
                  type="button"
                  onClick={() => void moderate(message, 'hide')}
                  className="rounded-lg border-2 border-red-700 px-3 py-1 text-sm font-semibold text-red-800 hover:bg-red-50"
                >
                  Ocultar del foro
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
