import type { Modality, Schedule, Service } from './types';

/**
 * Filtro combinable del directorio de servicios (HU-06).
 *
 * Reglas de dominio:
 * - Un servicio de modalidad "mixta" atiende tanto presencial como virtual.
 * - Un servicio "24h" está disponible en cualquier horario.
 * - Los filtros se combinan con AND: el servicio debe cumplirlos todos.
 * - Sin coincidencias => arreglo vacío (la UI muestra estado vacío
 *   controlado, nunca un error).
 */

export interface ServiceFilters {
  modality?: Modality | '';
  schedule?: Schedule | '';
  query?: string;
}

function matchesModality(service: Service, modality?: Modality | ''): boolean {
  if (!modality) return true;
  return service.modality === modality || service.modality === 'mixta';
}

function matchesSchedule(service: Service, schedule?: Schedule | ''): boolean {
  if (!schedule) return true;
  return service.schedule === schedule || service.schedule === '24h';
}

function matchesQuery(service: Service, query?: string): boolean {
  const q = query?.trim().toLowerCase();
  if (!q) return true;
  return [service.name, service.description, service.specialty]
    .filter((field): field is string => Boolean(field))
    .some((field) => field.toLowerCase().includes(q));
}

export function filterServices(
  services: Service[],
  filters: ServiceFilters,
): Service[] {
  return services.filter(
    (service) =>
      matchesModality(service, filters.modality) &&
      matchesSchedule(service, filters.schedule) &&
      matchesQuery(service, filters.query),
  );
}
