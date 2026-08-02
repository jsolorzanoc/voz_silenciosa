import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold text-gray-900">Página no encontrada</h1>
      <p className="mt-3 text-gray-700">
        La dirección que buscas no existe o cambió de lugar.
      </p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-lg bg-violet-800 px-6 py-3 font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
