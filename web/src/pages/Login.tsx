import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
    } else {
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-gray-900">Iniciar sesión</h1>

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
        </div>

        <div>
          <label htmlFor="password" className="block font-medium text-gray-900">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-400 px-3 py-2 focus:outline-2 focus:outline-violet-700"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-violet-800 px-4 py-3 font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700 disabled:opacity-60"
        >
          {submitting ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>

      <p className="mt-4 text-gray-700">
        ¿No tienes cuenta?{' '}
        <Link
          to="/registro"
          className="font-semibold text-violet-800 underline"
        >
          Regístrate con tu correo institucional
        </Link>
      </p>
    </div>
  );
}
