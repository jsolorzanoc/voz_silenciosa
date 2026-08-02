# Plan y ejecución de pruebas — La Voz Silenciosa

**WBS:** 1.7.1 · **Épica:** EP-07 · **Última ejecución:** 1 de agosto de 2026

## Estrategia

Tres niveles, cada uno con su herramienta y su propósito:

| Nivel | Herramienta | Qué cubre | Cómo se corre |
| --- | --- | --- | --- |
| Unitarias | Vitest | Lógica crítica pura: bandas PHQ-9/GAD-7, crisis por ítem 9, derivación, validación de envíos, filtros del directorio, detector de contenido de riesgo | `npm run test:unit` (en `/web`; corre además en cada PR vía CI) |
| E2E | Playwright | Flujos que no pueden fallar en el navegador real: botón de ayuda visible en toda vista, rechazo de dominios públicos, bloqueo de autoevaluación incompleta | `npm run test:e2e` (requiere `web/.env` y backend desplegado) |
| Seguridad | Suite propia (`scripts/security-tests.mjs`) | RLS y autorización contra un ambiente real: cero accesos cruzados, puntaje solo en servidor, indicadores solo-admin, aislamiento del foro, derecho de eliminación | `npm run test:security` |

Principio rector: **lo probado es lo desplegado**. Las pruebas unitarias de
puntaje importan el mismo módulo (`supabase/functions/_shared/scoring.ts`)
que ejecuta la Edge Function; no hay una copia para pruebas y otra para
producción.

Complementos en CI (cada PR): ESLint, `npm audit --audit-level=high` y
build de producción. Nada roto llega a `main` (HU-02).

## Trazabilidad con los casos de prueba del curso

Los casos del documento *HU clave: DoD y casos de prueba* están
implementados literalmente:

| HU | Caso | Prueba que lo cubre | Estado |
| --- | --- | --- | --- |
| HU-04 | 1. PHQ-9 todo en 0 → total 0, con seudónimo | `scoring.test.ts` + suite de seguridad (registro anónimo) | ✅ |
| HU-04 | 2. Ítem 5 en blanco → bloqueo, ítem resaltado, nada se escribe | `scoring.test.ts`, `autoevaluacion.spec.ts`, suite de seguridad (422) | ✅ |
| HU-04 | 3. Cliente manipulado envía total=3 → servidor guarda 12 | `scoring.test.ts` + suite de seguridad contra la Edge Function real | ✅ |
| HU-05 | 1-3. Bandas mínimo/mod. severo y crisis por ítem 9 | `scoring.test.ts` (todos los cortes de banda) | ✅ |
| HU-06 | 1. Filtros combinables virtual+noche | `filterServices.test.ts` | ✅ |
| HU-06 | 2. Alcance por universidad | Verificación E2E vía RLS (estudiante UX no ve servicios UY) | ✅ |
| HU-06 | 3. Sin coincidencias → estado vacío, no error | `filterServices.test.ts` + estado vacío en `Directory.tsx` | ✅ |
| HU-07 | 1-3. Derivación por nivel y prioridad de crisis | `scoring.test.ts` | ✅ |
| HU-08 | 1-3. Seudónimo, RLS, rechazo de gmail | `registro.spec.ts` + suite de seguridad | ✅ |
| HU-09 | 1-3. Botón visible, respaldo ante fallo, registro sin datos | `help-button.spec.ts` + fallback con caché local y 9-1-1 fijo | ✅ |
| HU-13 | Foro con seudónimo y aislamiento por membresía | Suite de seguridad + verificación E2E (17 casos) | ✅ |
| HU-16 | Indicadores agregados solo-admin | Suite de seguridad (estudiante recibe error) | ✅ |
| HU-17 | Cero accesos cruzados | Suite de seguridad (lectura cruzada, insert directo, anónimo) | ✅ |

## Resultados de la última ejecución

- **Unitarias:** 23/23 en verde (3 archivos: puntaje, filtros, moderación).
- **E2E (Playwright, Chromium, contra el ambiente de pruebas en la nube):**
  6/6 en verde.
- **Seguridad:** 13 casos de la suite en verde contra el ambiente de
  pruebas (ver `scripts/security-tests.mjs`); verificaciones manuales
  adicionales de grupos/moderación: 17/17.

## Pendientes y decisiones

- **OWASP ZAP (análisis dinámico):** planificado como actividad del equipo
  en el cierre del Sprint 7 contra el ambiente de pruebas desplegado;
  requiere la instalación de ZAP (Java) en la máquina del evaluador.
- **Notificaciones Web Push (HU-19, Could):** diferidas conforme a la
  priorización MoSCoW del backlog ("lo primero que cede si el tiempo
  aprieta"); los avisos de sesiones se cubren en la app (HU-14).
- Los specs E2E de flujo autenticado usan credenciales por variables de
  entorno (`E2E_USER_EMAIL`/`E2E_USER_PASSWORD`); no hay credenciales en
  el código.
