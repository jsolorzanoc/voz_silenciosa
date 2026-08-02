# Acta de Cierre del Proyecto — La Voz Silenciosa

**WBS:** 1.7.3.2 · **Estado del documento:** BORRADOR — pendiente de revisión del equipo y aprobación del patrocinador

| Campo | Detalle |
| --- | --- |
| Proyecto | La Voz Silenciosa — plataforma de bienestar estudiantil (PWA) |
| Patrocinador (Sponsor) | Dirección de Bienestar Estudiantil, consorcio RUBE-CR |
| Gerente del Proyecto (PM) | José Mauricio Méndez Bermúdez |
| Product Owner | Karla Calderón Sánchez |
| Equipo de desarrollo | Valeria Rojas (Tech Lead), Lorenzo Corredor Ramírez, Jose Solorzano Cruz |
| Periodo de ejecución | II Cuatrimestre 2026 · Sprints 0 a 7 (16 semanas) |
| Fecha de cierre | [completar al cierre del Sprint 7] |

## 1. Propósito

Este documento formaliza el cierre del proyecto "La Voz Silenciosa",
declara el estado final de sus entregables contra la Definición de
Terminado, verifica el cumplimiento de los criterios de éxito del Acta
Constitutiva y registra los pendientes que se transfieren a operación.

## 2. Cumplimiento de los criterios de éxito del Acta Constitutiva

| Criterio de éxito | Estado | Evidencia |
| --- | --- | --- |
| MVP de autoevaluación y directorio desplegado y funcional al cierre del Sprint 2 | ✅ Cumplido | Ambiente de pruebas en Supabase/Vercel; verificación E2E 13/13 |
| Botón de ayuda operativo con líneas verificadas y protocolo de respaldo probado antes del cierre del Sprint 3 | ✅ Técnica­mente cumplido · ⚠️ operativo pendiente | Botón visible en todas las vistas, respaldo y modo offline probados; la verificación telefónica de las líneas la debe confirmar Bienestar Estudiantil |
| Cero accesos cruzados entre usuarios en las pruebas de Row Level Security | ✅ Cumplido | Suite `scripts/security-tests.mjs`: 12/12 controles en verde, repetible en cualquier momento |
| Las siete épicas "Must" completadas según su Definición de Terminado | ✅ Cumplido | Ver tabla de entregables (sección 3) |
| Auditoría de cumplimiento de la Ley 8968 cerrada sin hallazgos críticos pendientes | ✅ Cumplido | `docs/auditoria-ley-8968.md`: 0 hallazgos críticos; 4 pendientes no críticos transferidos (sección 5) |

## 3. Entregables por épica

| Épica | Entregable mayor | Prioridad | Estado |
| --- | --- | --- | --- |
| EP-01 | Gestión y Documentación (acta, WBS, backlog Jira, repo con CI) | Must | ✅ Completo |
| EP-02 | MVP: autoevaluación PHQ-9/GAD-7 con puntaje en servidor, resultado por nivel, directorio con filtros, registro anónimo con RLS | Must | ✅ Completo |
| EP-03 | Recursos de emergencia: botón 24/7, líneas, protocolo de respaldo | Must | ✅ Completo |
| EP-04 | Grupos de apoyo: membresías, foro Realtime con seudónimo, sesiones, moderación de contenido de riesgo | Should | ✅ Completo |
| EP-05 | Panel administrativo: directorio, líneas, grupos, moderación, usuarios/roles e indicadores agregados y anónimos | Should | ✅ Completo |
| EP-06 | Aplicación móvil (PWA): instalación y modo offline seguro | Should | ✅ Completo · HU-19 (push, Could) diferida por MoSCoW |
| EP-07 | Pruebas y cierre: plan de pruebas, suite de seguridad, auditoría Ley 8968, documentación técnica y esta acta | Must | ✅ Completo (acta en aprobación) |

Adición sobre el alcance original: **derecho de eliminación** (página
"Mi cuenta" + Edge Function `delete-account`), requerido por la Ley 8968
y verificado de punta a punta.

## 4. Resultados de calidad

- **Pruebas unitarias (Vitest):** 23/23 en verde; cubren literalmente los
  casos del documento *HU clave: DoD y casos de prueba*.
- **Pruebas E2E (Playwright, Chromium):** 6/6 en verde contra el ambiente
  de pruebas real.
- **Suite de seguridad (RLS/autorización):** 12/12 en verde, incluyendo
  cero accesos cruzados, puntaje inmodificable desde el cliente y ciclo
  completo de eliminación de cuenta.
- **Dependencias:** 0 vulnerabilidades (`npm audit`); CI obligatorio en
  cada PR (lint + pruebas + auditoría + build).
- Trazabilidad completa HU → prueba en `docs/plan-de-pruebas.md`.

## 5. Pendientes transferidos a operación

| # | Pendiente | Responsable sugerido | Referencia |
| --- | --- | --- | --- |
| 1 | Verificar los números telefónicos reales de las líneas de ayuda y marcarlos "verificada" en el panel | Dirección de Bienestar Estudiantil | Auditoría, hallazgo 2 |
| 2 | Reactivar la confirmación de correo en autenticación (desactivada solo para el ambiente de pruebas) | Equipo técnico | Auditoría, hallazgo 1 |
| 3 | Ejecutar OWASP ZAP (baseline) contra el ambiente de pruebas y registrar resultados en la auditoría | Equipo técnico / QA | Auditoría, hallazgo 4 |
| 4 | Pasar el repositorio a privado con acceso al equipo y al profesor | Scrum Master | Auditoría, hallazgo 3 |
| 5 | Notificaciones Web Push (HU-19, Could) como mejora futura | Backlog de producto | Plan de pruebas |

## 6. Lecciones aprendidas

*(A completar por el equipo en la Sprint Retrospective de cierre; se
sugieren como punto de partida:)*

- Centralizar la lógica clínica en un único módulo compartido entre la
  Edge Function y las pruebas evitó divergencias entre lo probado y lo
  desplegado.
- Diseñar la seguridad desde el esquema (RLS primero, UI después) hizo
  que las pantallas de administración no requirieran lógica de permisos
  propia.
- La priorización MoSCoW permitió ceder lo accesorio (push) sin
  comprometer ningún criterio de éxito.

## 7. Declaración de cierre

Con los entregables aceptados por el Product Owner conforme a su
Definición de Terminado y los criterios de éxito verificados, se declara
formalmente cerrado el proyecto "La Voz Silenciosa". Los activos del
proyecto (repositorio, ambiente de pruebas, tablero Jira y documentación)
quedan bajo custodia del consorcio RUBE-CR.

## Bloque de firmas

| Rol | Nombre | Firma | Fecha |
| --- | --- | --- | --- |
| Patrocinador (Sponsor) | Dirección de Bienestar Estudiantil, RUBE-CR | | |
| Gerente del Proyecto (PM) | José Mauricio Méndez Bermúdez | | |
| Product Owner | Karla Calderón Sánchez | | |
| Scrum Master | José Mauricio Méndez Bermúdez | | |

*Documento preparado por el equipo de desarrollo como parte del paquete
de trabajo 1.7.3.2 (Acta de cierre).*
