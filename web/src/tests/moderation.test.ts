import { describe, expect, it } from 'vitest';
import { containsRiskContent } from '../lib/moderation';

/**
 * Pruebas de la detección de contenido de riesgo (WBS 1.4.3.2).
 * La lista de palabras clave es espejo de la función SQL
 * `contains_risk_content` que marca los mensajes en el servidor.
 */

describe('Moderación de contenido de riesgo en el foro (HU-13)', () => {
  it('detecta expresiones de riesgo con y sin tildes', () => {
    expect(containsRiskContent('He pensado en la autolesión')).toBe(true);
    expect(containsRiskContent('he pensado en la autolesion')).toBe(true);
    expect(containsRiskContent('A veces quiero quitarme la vida')).toBe(true);
    expect(containsRiskContent('siento que estaría mejor muerto')).toBe(true);
  });

  it('no distingue mayúsculas', () => {
    expect(containsRiskContent('NO QUIERO VIVIR más así')).toBe(true);
  });

  it('detecta variantes de la raíz suicid-', () => {
    expect(containsRiskContent('pienso en el suicidio')).toBe(true);
    expect(containsRiskContent('he tenido ideas suicidas')).toBe(true);
  });

  it('no marca mensajes normales del grupo', () => {
    expect(containsRiskContent('Hoy tuve un examen muy difícil')).toBe(false);
    expect(containsRiskContent('Gracias por escucharme, me siento mejor')).toBe(
      false,
    );
    expect(containsRiskContent('¿Alguien va a la sesión del jueves?')).toBe(
      false,
    );
  });
});
