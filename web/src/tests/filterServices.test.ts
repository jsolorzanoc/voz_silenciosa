import { describe, expect, it } from 'vitest';
import { filterServices } from '../lib/filterServices';
import type { Service } from '../lib/types';

/**
 * Pruebas del filtro combinable del directorio (HU-06).
 * El alcance por universidad (caso 2) lo garantiza RLS en la base de
 * datos y se verifica en las pruebas de seguridad, no aquí.
 */

const services: Service[] = [
  {
    id: '1',
    university_id: 'u1',
    name: 'Consejería presencial diurna',
    description: 'Citas individuales en el campus.',
    specialty: 'Psicología clínica',
    modality: 'presencial',
    schedule: 'diurno',
    contact: 'a@uni.cr',
  },
  {
    id: '2',
    university_id: 'u1',
    name: 'Consejería virtual nocturna',
    description: 'Sesiones virtuales.',
    specialty: 'Psicología clínica',
    modality: 'virtual',
    schedule: 'nocturno',
    contact: 'b@uni.cr',
  },
  {
    id: '3',
    university_id: null,
    name: 'Línea de escucha',
    description: 'Atención telefónica.',
    specialty: 'Contención emocional',
    modality: 'virtual',
    schedule: '24h',
    contact: 'c@rube.cr',
  },
  {
    id: '4',
    university_id: 'u1',
    name: 'Grupo de apoyo mixto',
    description: 'Acompañamiento entre pares.',
    specialty: 'Apoyo entre pares',
    modality: 'mixta',
    schedule: 'vespertino',
    contact: 'd@uni.cr',
  },
];

describe('HU-06 — Directorio buscable de servicios', () => {
  it('caso 1: virtual + nocturno solo lista servicios que cumplen ambos', () => {
    const result = filterServices(services, {
      modality: 'virtual',
      schedule: 'nocturno',
    });
    const ids = result.map((s) => s.id);

    // La consejería virtual nocturna y la línea 24h (disponible de noche) sí
    expect(ids).toContain('2');
    expect(ids).toContain('3');
    // El servicio presencial diurno NO se lista
    expect(ids).not.toContain('1');
    // El grupo vespertino no cumple el horario
    expect(ids).not.toContain('4');
  });

  it('caso 3: una búsqueda sin coincidencias devuelve vacío, no un error', () => {
    const result = filterServices(services, {
      query: 'psiquiatría 24h presencial',
    });
    expect(result).toEqual([]);
  });

  it('sin filtros devuelve todos los servicios visibles', () => {
    expect(filterServices(services, {})).toHaveLength(services.length);
  });

  it('la búsqueda de texto no distingue mayúsculas ni campos', () => {
    const byName = filterServices(services, { query: 'ESCUCHA' });
    expect(byName.map((s) => s.id)).toEqual(['3']);

    const bySpecialty = filterServices(services, { query: 'pares' });
    expect(bySpecialty.map((s) => s.id)).toEqual(['4']);
  });

  it('un servicio mixto cuenta para presencial y para virtual', () => {
    const presencial = filterServices(services, { modality: 'presencial' });
    expect(presencial.map((s) => s.id)).toContain('4');

    const virtual = filterServices(services, { modality: 'virtual' });
    expect(virtual.map((s) => s.id)).toContain('4');
  });
});
