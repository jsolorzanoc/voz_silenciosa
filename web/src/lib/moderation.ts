/**
 * Detección de contenido de riesgo en el foro (WBS 1.4.3.2).
 *
 * Espejo de la función SQL `contains_risk_content`: la autoridad es el
 * trigger de la base de datos, que marca el mensaje para revisión
 * humana. Este módulo se usa en la UI para mostrar apoyo inmediato a
 * quien escribió el mensaje, nunca para censurarlo.
 */

export const RISK_KEYWORDS = [
  'suicid',
  'matarme',
  'quitarme la vida',
  'no quiero vivir',
  'no vale la pena vivir',
  'hacerme daño',
  'hacerme dano',
  'autolesion',
  'autolesión',
  'cortarme',
  'lastimarme',
  'acabar con todo',
  'mejor muerto',
  'mejor muerta',
] as const;

export function containsRiskContent(content: string): boolean {
  const normalized = content.toLowerCase();
  return RISK_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
