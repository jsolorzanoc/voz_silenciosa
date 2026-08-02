import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { ANSWER_OPTIONS, INSTRUMENTS } from '../lib/instruments';
import type { Instrument, ScoreResponse } from '../lib/types';

/**
 * Autoevaluación validada y anónima (HU-04).
 *
 * - No se puede enviar incompleta: se bloquea el envío, se resalta el
 *   ítem faltante y se lleva el foco ahí (caso 2).
 * - El navegador NUNCA calcula el puntaje: envía las respuestas crudas
 *   a la Edge Function `score-assessment`, que valida, calcula y guarda
 *   asociado al seudónimo (casos 1 y 3).
 */
export default function Assessment() {
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState<Instrument | null>(null);
  const [consent, setConsent] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [invalidItems, setInvalidItems] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function start(selected: Instrument) {
    setInstrument(selected);
    setAnswers(new Array(INSTRUMENTS[selected].items.length).fill(null));
    setInvalidItems([]);
    setError(null);
  }

  function setAnswer(index: number, value: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setInvalidItems((prev) => prev.filter((i) => i !== index));
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!instrument) return;
    setError(null);

    // Validación de completitud (UX). La Edge Function la repite de
    // forma definitiva: el cliente no es la autoridad.
    const missing = answers.reduce<number[]>((acc, value, index) => {
      if (value === null) acc.push(index);
      return acc;
    }, []);

    if (missing.length > 0) {
      setInvalidItems(missing);
      setError(
        `Falta responder ${missing.length === 1 ? 'el ítem' : 'los ítems'} ${missing
          .map((i) => i + 1)
          .join(', ')}. Todas las preguntas son necesarias.`,
      );
      formRef.current
        ?.querySelector<HTMLElement>(`#item-${missing[0]} input`)
        ?.focus();
      return;
    }

    setSubmitting(true);
    const { data, error: fnError } = await supabase.functions.invoke(
      'score-assessment',
      { body: { instrument, answers } },
    );
    setSubmitting(false);

    if (fnError) {
      if (fnError instanceof FunctionsHttpError) {
        const detail = (await fnError.context.json().catch(() => null)) as {
          error?: string;
          invalidItems?: number[];
        } | null;
        setInvalidItems(detail?.invalidItems ?? []);
        setError(
          detail?.error ??
            'No se pudo procesar la autoevaluación. Intenta de nuevo.',
        );
      } else {
        setError('No hay conexión con el servidor. Intenta de nuevo.');
      }
      return;
    }

    navigate('/resultado', { state: data as ScoreResponse });
  }

  if (!instrument) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Autoevaluación</h1>
        <p className="text-gray-700">
          Estos cuestionarios son instrumentos validados internacionalmente. El
          resultado te orienta sobre cómo te has sentido en las últimas dos
          semanas; no es un diagnóstico clínico. Tus respuestas se guardan
          asociadas únicamente a tu seudónimo.
        </p>

        <label className="flex items-start gap-3 rounded-lg border border-violet-200 bg-violet-50 p-4">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-1 h-5 w-5 accent-violet-800"
          />
          <span className="text-gray-800">
            Consiento que mis respuestas se procesen de forma confidencial para
            calcular mi nivel de riesgo y recomendarme recursos de apoyo (Ley
            8968). Puedo pedir la eliminación de mis datos cuando quiera.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {Object.values(INSTRUMENTS).map((def) => (
            <button
              key={def.id}
              type="button"
              disabled={!consent}
              onClick={() => start(def.id)}
              className="rounded-xl border-2 border-violet-800 p-6 text-left hover:bg-violet-50 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="block text-xl font-bold text-violet-900">
                {def.name}
              </span>
              <span className="mt-1 block text-gray-700">{def.focus}</span>
              <span className="mt-2 block text-sm text-gray-600">
                {def.items.length} preguntas · 2-3 minutos
              </span>
            </button>
          ))}
        </div>
        {!consent && (
          <p className="text-sm text-gray-600">
            Marca el consentimiento para habilitar los cuestionarios.
          </p>
        )}
      </div>
    );
  }

  const def = INSTRUMENTS[instrument];
  const answered = answers.filter((a) => a !== null).length;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">
        {def.name} — {def.focus}
      </h1>
      <p className="mt-2 text-gray-700">{def.intro}</p>
      <p
        className="mt-2 text-sm font-medium text-violet-900"
        aria-live="polite"
      >
        Progreso: {answered} de {def.items.length} respondidas
      </p>

      <form
        ref={formRef}
        onSubmit={(e) => void onSubmit(e)}
        className="mt-6 space-y-6"
        noValidate
      >
        {error && (
          <p role="alert" className="rounded-md bg-red-100 p-3 text-red-900">
            {error}
          </p>
        )}

        {def.items.map((item, index) => {
          const invalid = invalidItems.includes(index);
          return (
            <fieldset
              key={index}
              id={`item-${index}`}
              aria-invalid={invalid}
              className={`rounded-xl border-2 bg-white p-4 ${
                invalid ? 'border-red-700' : 'border-gray-200'
              }`}
            >
              <legend className="px-1 font-medium text-gray-900">
                {index + 1}. {item}
              </legend>
              {invalid && (
                <p className="mb-2 text-sm font-semibold text-red-800">
                  Esta pregunta está pendiente de respuesta.
                </p>
              )}
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ANSWER_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 ${
                      answers[index] === option.value
                        ? 'border-violet-800 bg-violet-50'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`item-${index}`}
                      value={option.value}
                      checked={answers[index] === option.value}
                      onChange={() => setAnswer(index, option.value)}
                      className="h-4 w-4 accent-violet-800"
                    />
                    <span className="text-gray-800">{option.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        })}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-violet-800 px-6 py-3 font-bold text-white hover:bg-violet-900 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700 disabled:opacity-60"
          >
            {submitting ? 'Enviando…' : 'Enviar autoevaluación'}
          </button>
          <button
            type="button"
            onClick={() => setInstrument(null)}
            className="rounded-lg border-2 border-gray-400 px-6 py-3 font-semibold text-gray-800 hover:bg-gray-100 focus:outline-4 focus:outline-offset-2 focus:outline-violet-700"
          >
            Cambiar de cuestionario
          </button>
        </div>
      </form>
    </div>
  );
}
