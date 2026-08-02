import type { Resource, RiskLevel } from './types';

/**
 * Textos de resultado y recomendación por nivel de riesgo (HU-05).
 * La regla de crisis tiene prioridad y la define el servidor.
 */

export const LEVEL_LABELS: Record<RiskLevel, string> = {
  minimo: 'Mínimo',
  leve: 'Leve',
  moderado: 'Moderado',
  moderadamente_severo: 'Moderadamente severo',
  severo: 'Severo',
};

export const LEVEL_RECOMMENDATIONS: Record<RiskLevel, string> = {
  minimo:
    'Tu resultado indica un malestar mínimo. Te compartimos material de autocuidado e información para mantener tu bienestar.',
  leve: 'Tu resultado indica un malestar leve. Revisa el material de autocuidado y repite la autoevaluación en unas semanas para dar seguimiento a cómo te sientes.',
  moderado:
    'Tu resultado indica un malestar moderado. Te recomendamos agendar una atención con los servicios de consejería de tu universidad.',
  moderadamente_severo:
    'Tu resultado indica un malestar moderadamente severo. Te recomendamos agendar una atención cuanto antes; el directorio te muestra los servicios disponibles.',
  severo:
    'Tu resultado indica un malestar severo. No tienes que pasar por esto en soledad: contacta ahora una línea de apoyo.',
};

export const CRISIS_MESSAGE =
  'Lo que respondiste nos indica que podrías necesitar apoyo inmediato. No estás solo(a): hay una persona real disponible para escucharte ahora mismo.';

export const RESOURCE_LABELS: Record<Resource, string> = {
  autoayuda: 'Recursos de autoayuda e información',
  consejeria: 'Consejería de tu universidad',
  crisis: 'Ruta de apoyo inmediato',
};
