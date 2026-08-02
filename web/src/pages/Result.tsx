import { Link, Navigate, useLocation } from 'react-router';
import {
  CRISIS_MESSAGE,
  LEVEL_LABELS,
  LEVEL_RECOMMENDATIONS,
} from '../lib/recommendations';
import type { ScoreResponse } from '../lib/types';

/**
 * Resultado y nivel de riesgo (HU-05) + derivación (HU-07).
 * La bandera de crisis viene del servidor y anula cualquier otro
 * mensaje: ítem 9 positivo escala aunque el total sea bajo.
 */
export default function Result() {
  const location = useLocation();
  const result = location.state as ScoreResponse | null;

  if (!result) {
    return <Navigate to="/autoevaluacion" replace />;
  }

  if (result.crisis) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div
          role="alert"
          className="rounded-2xl border-4 border-red-700 bg-red-50 p-6"
        >
          <h1 className="text-2xl font-extrabold text-red-900">
            Busquemos apoyo ahora mismo
          </h1>
          <p className="mt-3 text-lg text-gray-900">{CRISIS_MESSAGE}</p>
          <p className="mt-3 text-gray-800">
            Usa el botón rojo <strong>“Ayuda 24/7”</strong> (abajo a la derecha)
            para ver las líneas de apoyo atendidas por personas reales,
            disponibles a cualquier hora. Si tu vida está en riesgo, llama al{' '}
            <a className="font-bold underline" href="tel:911">
              9-1-1
            </a>
            .
          </p>
        </div>

        <p className="text-sm text-gray-600">
          Tu resultado se guardó de forma confidencial, asociado solo a tu
          seudónimo. Nadie más puede verlo.
        </p>
      </div>
    );
  }

  const showDirectory =
    result.resource === 'consejeria' || result.resource === 'crisis';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Tu resultado</h1>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-700">
          {result.instrument === 'phq9' ? 'PHQ-9' : 'GAD-7'} — Puntaje total:{' '}
          <strong>{result.total}</strong>
        </p>
        <p className="mt-2 text-xl font-bold text-violet-900">
          Nivel: {LEVEL_LABELS[result.level]}
        </p>
        <p className="mt-3 text-gray-800">
          {LEVEL_RECOMMENDATIONS[result.level]}
        </p>
      </div>

      {showDirectory ? (
        <Link
          to="/directorio"
          className="inline-block rounded-lg bg-violet-800 px-6 py-3 font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
        >
          Ver servicios de consejería disponibles
        </Link>
      ) : (
        <section
          aria-labelledby="autocuidado"
          className="rounded-xl border border-violet-200 bg-violet-50 p-6"
        >
          <h2 id="autocuidado" className="font-bold text-violet-950">
            Material de autocuidado
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-gray-800">
            <li>Mantén horarios regulares de sueño y comidas.</li>
            <li>
              Reserva pausas breves de descanso durante el estudio y muévete un
              poco cada día.
            </li>
            <li>
              Habla de cómo te sientes con alguien de confianza; pedir apoyo es
              una fortaleza.
            </li>
            <li>
              Repite esta autoevaluación en dos semanas para dar seguimiento a
              tu bienestar.
            </li>
          </ul>
        </section>
      )}

      <p className="text-sm text-gray-600">
        Este resultado orienta, no diagnostica. Se guardó de forma confidencial,
        asociado solo a tu seudónimo, y no se comparte con terceros.
      </p>
    </div>
  );
}
