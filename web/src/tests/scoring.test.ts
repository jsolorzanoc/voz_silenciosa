import { describe, expect, it } from 'vitest';
import {
  levelFor,
  resourceFor,
  scoreAssessment,
  validateAnswers,
} from '../../../supabase/functions/_shared/scoring';

/**
 * Pruebas unitarias de la lógica crítica (WBS 1.7.1.1).
 * Cada bloque corresponde a los casos de prueba del documento
 * "HU clave: Definition of Done y casos de prueba".
 */

describe('HU-04 — Autoevaluación validada y anónima', () => {
  it('caso 1: PHQ-9 con las 9 respuestas en 0 da total 0 y nivel mínimo', () => {
    const result = scoreAssessment('phq9', [0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(result.total).toBe(0);
    expect(result.level).toBe('minimo');
    expect(result.crisis).toBe(false);
  });

  it('caso 2: un envío incompleto (ítem 5 en blanco) se bloquea y señala el ítem', () => {
    const answers = [1, 1, 1, 1, null, 1, 1, 1, 1];
    const validation = validateAnswers('phq9', answers);
    expect(validation.valid).toBe(false);
    expect(validation.invalidItems).toContain(4);
    expect(() => scoreAssessment('phq9', answers as number[])).toThrow();
  });

  it('caso 3: el puntaje sale solo de las respuestas; un "total" del cliente no existe en la API', () => {
    // La función no acepta ningún total externo: siempre recalcula.
    const result = scoreAssessment('phq9', [2, 2, 2, 1, 1, 1, 2, 1, 0]);
    expect(result.total).toBe(12);
    expect(result.level).toBe('moderado');
  });

  it('rechaza respuestas fuera de rango o no enteras', () => {
    expect(validateAnswers('phq9', [4, 0, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(
      false,
    );
    expect(validateAnswers('phq9', [-1, 0, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(
      false,
    );
    expect(validateAnswers('phq9', [1.5, 0, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(
      false,
    );
  });

  it('rechaza longitudes incorrectas y valores que no son arreglo', () => {
    expect(validateAnswers('gad7', [0, 0, 0, 0, 0, 0, 0, 0, 0]).valid).toBe(
      false,
    );
    expect(validateAnswers('phq9', [0, 0, 0]).valid).toBe(false);
    expect(validateAnswers('phq9', 'no-es-arreglo').valid).toBe(false);
  });
});

describe('HU-05 — Resultado y nivel de riesgo', () => {
  it('caso 1: PHQ-9 total 3 es nivel mínimo, sin alarma', () => {
    const result = scoreAssessment('phq9', [1, 1, 1, 0, 0, 0, 0, 0, 0]);
    expect(result.total).toBe(3);
    expect(result.level).toBe('minimo');
    expect(result.crisis).toBe(false);
  });

  it('caso 2: PHQ-9 total 16 es moderadamente severo', () => {
    const result = scoreAssessment('phq9', [3, 3, 3, 3, 2, 2, 0, 0, 0]);
    expect(result.total).toBe(16);
    expect(result.level).toBe('moderadamente_severo');
  });

  it('caso 3: ítem 9 positivo escala a crisis aunque el total sea bajo', () => {
    const result = scoreAssessment('phq9', [1, 1, 1, 1, 1, 0, 0, 0, 1]);
    expect(result.total).toBe(6);
    expect(result.level).toBe('leve');
    expect(result.crisis).toBe(true);
    expect(result.resource).toBe('crisis');
  });

  it('bandas PHQ-9 completas en los cortes', () => {
    expect(levelFor('phq9', 0)).toBe('minimo');
    expect(levelFor('phq9', 4)).toBe('minimo');
    expect(levelFor('phq9', 5)).toBe('leve');
    expect(levelFor('phq9', 9)).toBe('leve');
    expect(levelFor('phq9', 10)).toBe('moderado');
    expect(levelFor('phq9', 14)).toBe('moderado');
    expect(levelFor('phq9', 15)).toBe('moderadamente_severo');
    expect(levelFor('phq9', 19)).toBe('moderadamente_severo');
    expect(levelFor('phq9', 20)).toBe('severo');
    expect(levelFor('phq9', 27)).toBe('severo');
  });

  it('bandas GAD-7 completas en los cortes', () => {
    expect(levelFor('gad7', 0)).toBe('minimo');
    expect(levelFor('gad7', 4)).toBe('minimo');
    expect(levelFor('gad7', 5)).toBe('leve');
    expect(levelFor('gad7', 9)).toBe('leve');
    expect(levelFor('gad7', 10)).toBe('moderado');
    expect(levelFor('gad7', 14)).toBe('moderado');
    expect(levelFor('gad7', 15)).toBe('severo');
    expect(levelFor('gad7', 21)).toBe('severo');
  });
});

describe('HU-07 — Derivación automática según puntaje', () => {
  it('caso 1: nivel bajo (PHQ-9 = 3) deriva a autoayuda, nada urgente', () => {
    const result = scoreAssessment('phq9', [1, 1, 1, 0, 0, 0, 0, 0, 0]);
    expect(result.resource).toBe('autoayuda');
  });

  it('caso 2: nivel moderado (GAD-7 = 12) deriva a consejería', () => {
    const result = scoreAssessment('gad7', [2, 2, 2, 2, 2, 1, 1]);
    expect(result.total).toBe(12);
    expect(result.level).toBe('moderado');
    expect(result.resource).toBe('consejeria');
  });

  it('caso 3: PHQ-9 = 22 (severo) deriva a la ruta de crisis', () => {
    const result = scoreAssessment('phq9', [3, 3, 3, 3, 3, 3, 2, 2, 0]);
    expect(result.total).toBe(22);
    expect(result.level).toBe('severo');
    expect(result.crisis).toBe(true);
    expect(result.resource).toBe('crisis');
  });

  it('la regla de crisis tiene prioridad sobre cualquier otra', () => {
    expect(resourceFor('minimo', true)).toBe('crisis');
    expect(resourceFor('leve', true)).toBe('crisis');
    expect(resourceFor('moderado', false)).toBe('consejeria');
    expect(resourceFor('moderadamente_severo', false)).toBe('consejeria');
    expect(resourceFor('severo', false)).toBe('crisis');
    expect(resourceFor('minimo', false)).toBe('autoayuda');
    expect(resourceFor('leve', false)).toBe('autoayuda');
  });
});
