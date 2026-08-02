import type { Instrument } from './types';

/**
 * Instrumentos validados PHQ-9 y GAD-7 en español (HU-04).
 * El texto de los ítems debe ser revisado por el área de psicología
 * antes del despliegue (supuesto del Acta Constitutiva).
 */

export interface InstrumentDef {
  id: Instrument;
  name: string;
  focus: string;
  intro: string;
  items: string[];
}

export const ANSWER_OPTIONS = [
  { value: 0, label: 'Ningún día' },
  { value: 1, label: 'Varios días' },
  { value: 2, label: 'Más de la mitad de los días' },
  { value: 3, label: 'Casi todos los días' },
] as const;

export const INSTRUMENTS: Record<Instrument, InstrumentDef> = {
  phq9: {
    id: 'phq9',
    name: 'PHQ-9',
    focus: 'Estado de ánimo (depresión)',
    intro:
      'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
    items: [
      'Poco interés o placer en hacer cosas',
      'Se ha sentido decaído(a), deprimido(a) o sin esperanzas',
      'Dificultad para quedarse dormido(a), permanecer dormido(a) o ha dormido demasiado',
      'Se ha sentido cansado(a) o con poca energía',
      'Sin apetito o ha comido en exceso',
      'Se ha sentido mal con usted mismo(a), o que es un fracaso, o que ha quedado mal con usted mismo(a) o con su familia',
      'Dificultad para concentrarse en actividades como leer o ver televisión',
      'Se ha movido o hablado tan lento que otras personas podrían notarlo, o lo contrario: tan inquieto(a) o agitado(a) que se ha movido mucho más de lo normal',
      'Pensamientos de que estaría mejor muerto(a) o de lastimarse de alguna manera',
    ],
  },
  gad7: {
    id: 'gad7',
    name: 'GAD-7',
    focus: 'Ansiedad',
    intro:
      'Durante las últimas 2 semanas, ¿con qué frecuencia le han molestado los siguientes problemas?',
    items: [
      'Se ha sentido nervioso(a), ansioso(a) o con los nervios de punta',
      'No ha podido dejar de preocuparse o controlar la preocupación',
      'Se ha preocupado demasiado por diferentes cosas',
      'Ha tenido dificultad para relajarse',
      'Se ha sentido tan inquieto(a) que no ha podido quedarse quieto(a)',
      'Se ha molestado o irritado fácilmente',
      'Ha sentido miedo de que algo terrible pudiera pasar',
    ],
  },
};
