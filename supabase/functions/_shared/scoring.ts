/**
 * Lógica canónica de puntaje y derivación (HU-04, HU-05, HU-07).
 *
 * Este módulo es TypeScript puro (sin APIs de Deno ni de Node) para que
 * lo importen tanto la Edge Function `score-assessment` como las pruebas
 * unitarias de Vitest. El navegador NUNCA calcula el puntaje: solo la
 * Edge Function ejecuta este código con los datos reales (DoD HU-04).
 *
 * Bandas clínicas estándar definidas en el documento de HU:
 *   PHQ-9: 0-4 mínimo, 5-9 leve, 10-14 moderado,
 *          15-19 moderadamente severo, 20-27 severo.
 *          El ítem 9 (autolesión) escala a crisis por sí solo.
 *   GAD-7: 0-4 mínimo, 5-9 leve, 10-14 moderado, 15-21 severo.
 */

export type Instrument = 'phq9' | 'gad7';

export type RiskLevel =
  | 'minimo'
  | 'leve'
  | 'moderado'
  | 'moderadamente_severo'
  | 'severo';

export type Resource = 'autoayuda' | 'consejeria' | 'crisis';

export const INSTRUMENT_LENGTH: Record<Instrument, number> = {
  phq9: 9,
  gad7: 7,
};

export const MIN_ANSWER = 0;
export const MAX_ANSWER = 3;

/** Índice (base 0) del ítem 9 del PHQ-9: pensamientos de autolesión. */
export const PHQ9_SELF_HARM_INDEX = 8;

export interface ValidationResult {
  valid: boolean;
  /** Índices (base 0) de ítems faltantes o inválidos, para resaltarlos en la UI. */
  invalidItems: number[];
  error?: string;
}

export interface ScoreResult {
  instrument: Instrument;
  total: number;
  level: RiskLevel;
  /** true si aplica la ruta de crisis (prioridad sobre todo lo demás, HU-07). */
  crisis: boolean;
  resource: Resource;
}

export function isInstrument(value: unknown): value is Instrument {
  return value === 'phq9' || value === 'gad7';
}

/**
 * Valida el arreglo de respuestas: longitud exacta del instrumento y
 * cada valor entero entre 0 y 3. Un envío incompleto se bloquea y se
 * reportan los ítems problemáticos (caso 2 de HU-04).
 */
export function validateAnswers(
  instrument: Instrument,
  answers: unknown,
): ValidationResult {
  const expected = INSTRUMENT_LENGTH[instrument];

  if (!Array.isArray(answers)) {
    return {
      valid: false,
      invalidItems: [],
      error: 'Las respuestas deben ser un arreglo',
    };
  }

  if (answers.length !== expected) {
    return {
      valid: false,
      invalidItems: [],
      error: `El instrumento ${instrument} requiere exactamente ${expected} respuestas`,
    };
  }

  const invalidItems = answers.reduce<number[]>((acc, value, index) => {
    const ok =
      typeof value === 'number' &&
      Number.isInteger(value) &&
      value >= MIN_ANSWER &&
      value <= MAX_ANSWER;
    if (!ok) acc.push(index);
    return acc;
  }, []);

  if (invalidItems.length > 0) {
    return {
      valid: false,
      invalidItems,
      error: 'Hay ítems sin responder o con valores fuera de rango',
    };
  }

  return { valid: true, invalidItems: [] };
}

/** Banda de riesgo según el total (HU-05). */
export function levelFor(instrument: Instrument, total: number): RiskLevel {
  if (total <= 4) return 'minimo';
  if (total <= 9) return 'leve';
  if (total <= 14) return 'moderado';
  if (instrument === 'gad7') return 'severo';
  if (total <= 19) return 'moderadamente_severo';
  return 'severo';
}

/**
 * Recurso de derivación según nivel y bandera de crisis (HU-07).
 * La regla de crisis tiene prioridad sobre cualquier otra.
 */
export function resourceFor(level: RiskLevel, crisis: boolean): Resource {
  if (crisis || level === 'severo') return 'crisis';
  if (level === 'moderado' || level === 'moderadamente_severo') {
    return 'consejeria';
  }
  return 'autoayuda';
}

/**
 * Calcula el resultado completo de una autoevaluación.
 *
 * Deliberadamente NO acepta un total del cliente: el total siempre se
 * recalcula aquí a partir de las respuestas (caso 3 de HU-04 — un
 * cliente manipulado no decide el puntaje).
 *
 * @throws Error si las respuestas no pasan la validación.
 */
export function scoreAssessment(
  instrument: Instrument,
  answers: number[],
): ScoreResult {
  const validation = validateAnswers(instrument, answers);
  if (!validation.valid) {
    throw new Error(validation.error ?? 'Respuestas inválidas');
  }

  const total = answers.reduce((sum, value) => sum + value, 0);
  const level = levelFor(instrument, total);

  // Ítem 9 del PHQ-9 positivo => crisis aunque el total sea bajo (HU-05 caso 3)
  const selfHarm =
    instrument === 'phq9' && answers[PHQ9_SELF_HARM_INDEX] > 0;
  const crisis = selfHarm || level === 'severo';

  return {
    instrument,
    total,
    level,
    crisis,
    resource: resourceFor(level, crisis),
  };
}
