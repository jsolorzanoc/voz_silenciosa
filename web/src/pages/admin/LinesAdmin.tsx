import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../../lib/supabase';
import type { EmergencyLine } from '../../lib/types';

/**
 * Gestión de líneas de emergencia (WBS 1.3.2). Toda línea debe estar
 * verificada por Bienestar Estudiantil antes de marcarse como tal.
 */
export default function LinesAdmin() {
  const [lines, setLines] = useState<EmergencyLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    description: '',
    is_backup: false,
    priority: 5,
  });

  const load = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('emergency_lines')
      .select('*')
      .order('priority');
    if (loadError) {
      setError('No se pudieron cargar las líneas.');
      return;
    }
    setLines(data ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create(event: FormEvent) {
    event.preventDefault();
    const { error: insertError } = await supabase
      .from('emergency_lines')
      .insert({
        name: form.name.trim(),
        phone: form.phone.trim(),
        description: form.description.trim() || null,
        is_backup: form.is_backup,
        priority: form.priority,
        verified: false,
        active: true,
      });
    if (insertError) {
      setError('No se pudo crear la línea.');
      return;
    }
    setForm({
      name: '',
      phone: '',
      description: '',
      is_backup: false,
      priority: 5,
    });
    void load();
  }

  async function toggle(line: EmergencyLine, field: 'active' | 'verified') {
    await supabase
      .from('emergency_lines')
      .update({ [field]: !line[field] })
      .eq('id', line.id);
    void load();
  }

  const inputClass =
    'mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700';

  return (
    <div className="space-y-6">
      <p className="rounded-md bg-amber-100 p-3 text-sm text-amber-900">
        Una línea solo debe marcarse como <strong>verificada</strong> cuando
        Bienestar Estudiantil confirme que conecta con una persona real (DoD
        HU-09).
      </p>

      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => void create(e)}
        className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2"
      >
        <h2 className="font-bold text-gray-900 sm:col-span-2">Agregar línea</h2>
        <div>
          <label htmlFor="line-nombre" className="block text-sm font-medium">
            Nombre *
          </label>
          <input
            id="line-nombre"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="line-tel" className="block text-sm font-medium">
            Teléfono *
          </label>
          <input
            id="line-tel"
            required
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="line-desc" className="block text-sm font-medium">
            Descripción
          </label>
          <input
            id="line-desc"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
          />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.is_backup}
              onChange={(e) =>
                setForm({ ...form, is_backup: e.target.checked })
              }
              className="h-4 w-4 accent-violet-800"
            />
            Es línea de respaldo (HU-10)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            Prioridad
            <input
              type="number"
              min={1}
              max={99}
              value={form.priority}
              onChange={(e) =>
                setForm({ ...form, priority: Number(e.target.value) })
              }
              className="w-20 rounded-md border border-gray-400 px-2 py-1"
            />
          </label>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-violet-800 px-5 py-2 font-bold text-white hover:bg-violet-900 sm:justify-self-start"
        >
          Crear línea
        </button>
      </form>

      <ul className="space-y-3">
        {lines.map((line) => (
          <li
            key={line.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4"
          >
            <div>
              <p className="font-bold text-gray-900">
                {line.name}{' '}
                <span className="font-extrabold text-violet-900">
                  {line.phone}
                </span>
              </p>
              <p className="text-sm text-gray-700">
                {line.is_backup ? 'Respaldo' : 'Principal'} · prioridad{' '}
                {line.priority} ·{' '}
                <span
                  className={
                    line.verified
                      ? 'font-semibold text-green-700'
                      : 'font-semibold text-amber-700'
                  }
                >
                  {line.verified ? 'Verificada' : 'Sin verificar'}
                </span>{' '}
                · {line.active ? 'Activa' : 'Inactiva'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void toggle(line, 'verified')}
                className="rounded-lg border-2 border-violet-800 px-3 py-1 text-sm font-semibold text-violet-900 hover:bg-violet-50"
              >
                {line.verified ? 'Quitar verificación' : 'Marcar verificada'}
              </button>
              <button
                type="button"
                onClick={() => void toggle(line, 'active')}
                className="rounded-lg border-2 border-gray-400 px-3 py-1 text-sm font-semibold text-gray-800 hover:bg-gray-100"
              >
                {line.active ? 'Desactivar' : 'Activar'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
