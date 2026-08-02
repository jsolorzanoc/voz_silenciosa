import { useState } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Mi cuenta: transparencia sobre los datos y derecho de eliminación
 * (Ley 8968). El borrado lo ejecuta la Edge Function `delete-account`
 * con el service role y arrastra en cascada todos los datos del
 * usuario: perfil, autoevaluaciones, derivaciones, membresías,
 * mensajes y reportes.
 */
export default function Account() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText.trim() === profile?.pseudonym;

  async function deleteAccount() {
    setDeleting(true);
    setError(null);
    const { error: fnError } = await supabase.functions.invoke(
      'delete-account',
      { body: {} },
    );
    setDeleting(false);

    if (fnError) {
      setError('No se pudo eliminar la cuenta. Intenta de nuevo.');
      return;
    }
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi cuenta</h1>
        <p className="mt-2 text-gray-700">
          Seudónimo: <strong>{profile?.pseudonym ?? '…'}</strong>
        </p>
      </div>

      <section
        aria-labelledby="mis-datos"
        className="rounded-xl border border-violet-200 bg-violet-50 p-6"
      >
        <h2 id="mis-datos" className="font-bold text-violet-950">
          Qué guardamos de ti (Ley 8968)
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-6 text-gray-800">
          <li>
            Tu correo institucional, solo para verificar que perteneces al
            consorcio. Nunca se muestra a otras personas ni se asocia a tus
            resultados visibles.
          </li>
          <li>
            Tus autoevaluaciones y derivaciones, ligadas a tu seudónimo y
            protegidas por seguridad a nivel de fila: solo tú puedes leerlas.
          </li>
          <li>
            Tus membresías y mensajes en grupos, firmados con tu seudónimo.
          </li>
          <li>
            El uso del botón de ayuda se registra sin ningún dato personal.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="eliminar"
        className="rounded-xl border-2 border-red-300 bg-white p-6"
      >
        <h2 id="eliminar" className="font-bold text-red-900">
          Eliminar mi cuenta y todos mis datos
        </h2>
        <p className="mt-2 text-gray-700">
          Esta acción es permanente: borra tu cuenta, tus autoevaluaciones,
          derivaciones, membresías y mensajes. No se puede deshacer.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-md bg-red-100 p-3 text-red-900"
          >
            {error}
          </p>
        )}

        <label
          htmlFor="confirmar"
          className="mt-4 block font-medium text-gray-900"
        >
          Escribe tu seudónimo para confirmar
        </label>
        <input
          id="confirmar"
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={profile?.pseudonym ?? ''}
          className="mt-1 w-full max-w-xs rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-red-700"
        />

        <button
          type="button"
          disabled={!canDelete || deleting}
          onClick={() => void deleteAccount()}
          className="mt-4 block rounded-lg bg-red-700 px-5 py-2 font-bold text-white hover:bg-red-800 focus:outline-4 focus:outline-offset-2 focus:outline-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? 'Eliminando…' : 'Eliminar definitivamente'}
        </button>
      </section>
    </div>
  );
}
