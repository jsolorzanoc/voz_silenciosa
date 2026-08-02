import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { University } from '../lib/types';

/**
 * Registro anónimo (HU-08): correo institucional + seudónimo.
 * El dominio se valida aquí para dar un mensaje claro y, de forma
 * definitiva, en la base de datos (trigger handle_new_user): un correo
 * de dominio público como gmail.com se rechaza siempre.
 */
export default function Register() {
  const { signUp } = useAuth();
  const [universities, setUniversities] = useState<University[]>([]);
  const [email, setEmail] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from('universities')
      .select('id, name, email_domain')
      .then(({ data }) => setUniversities(data ?? []));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const domain = email.trim().toLowerCase().split('@')[1] ?? '';
    const domainOk = universities.some((u) => u.email_domain === domain);
    if (universities.length > 0 && !domainOk) {
      setError(
        'Solo se aceptan correos institucionales de las universidades del consorcio RUBE-CR.',
      );
      return;
    }
    if (pseudonym.trim().length < 3) {
      setError('El seudónimo debe tener al menos 3 caracteres.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(email.trim(), password, pseudonym.trim());
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-green-300 bg-green-50 p-6">
        <h1 className="text-xl font-bold text-green-900">Revisa tu correo</h1>
        <p className="mt-2 text-green-900">
          Te enviamos un enlace de confirmación a tu correo institucional. El
          correo solo verifica que perteneces a tu universidad: dentro de la
          plataforma, los demás solo verán tu seudónimo{' '}
          <strong>{pseudonym}</strong>.
        </p>
        <Link
          to="/login"
          className="mt-4 inline-block font-semibold text-violet-800 underline"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-gray-900">Crear cuenta anónima</h1>
      <p className="mt-2 text-gray-700">
        Tu correo institucional solo verifica que eres estudiante del consorcio.
        Nunca se muestra junto a tus respuestas ni resultados.
      </p>

      <form
        onSubmit={(e) => void onSubmit(e)}
        className="mt-6 space-y-4"
        noValidate
      >
        {error && (
          <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
            {error}
          </p>
        )}

        <div>
          <label htmlFor="email" className="block font-medium text-gray-900">
            Correo institucional
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
          />
          {universities.length > 0 && (
            <p className="mt-1 text-sm text-gray-600">
              Dominios aceptados:{' '}
              {universities.map((u) => `@${u.email_domain}`).join(', ')}
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="pseudonym"
            className="block font-medium text-gray-900"
          >
            Seudónimo (visible para otros)
          </label>
          <input
            id="pseudonym"
            type="text"
            required
            minLength={3}
            maxLength={30}
            value={pseudonym}
            onChange={(e) => setPseudonym(e.target.value)}
            placeholder="ej. lobo_azul"
            className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
          />
        </div>

        <div>
          <label htmlFor="password" className="block font-medium text-gray-900">
            Contraseña (mínimo 8 caracteres)
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
          />
        </div>

        <p className="rounded-md bg-violet-50 p-3 text-sm text-gray-800">
          Al crear la cuenta consientes el tratamiento confidencial de tus datos
          según la Ley 8968. Recolectamos lo mínimo y puedes pedir la
          eliminación de tu cuenta cuando quieras.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-violet-800 px-4 py-3 font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700 disabled:opacity-60"
        >
          {submitting ? 'Creando cuenta…' : 'Crear cuenta'}
        </button>
      </form>

      <p className="mt-4 text-gray-700">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-violet-800 underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
