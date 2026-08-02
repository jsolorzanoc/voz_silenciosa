# La Voz Silenciosa

Plataforma web y móvil (PWA) de bienestar estudiantil del consorcio
**RUBE-CR**: autoevaluación de salud mental con instrumentos validados
(PHQ-9 / GAD-7), directorio de servicios de apoyo, derivación según nivel
de riesgo y botón de ayuda 24/7 con líneas reales.

Proyecto final del curso **Pruebas de Aseguramiento de la Seguridad del
Software** (ULACIT, II Cuatrimestre 2026).

> La plataforma orienta, no diagnostica. Los datos se tratan bajo la
> **Ley 8968** de protección de datos de Costa Rica.

## Estructura del repositorio

| Carpeta     | Contenido                                                        |
| ----------- | ---------------------------------------------------------------- |
| `/docs`     | Documentación del curso (acta, WBS, backlog, HU y casos de prueba) |
| `/web`      | Aplicación React + Vite + TypeScript + Tailwind (PWA)            |
| `/supabase` | Migraciones SQL (esquema + RLS), semilla y Edge Functions        |

## Stack

- **Frontend/PWA:** React + Vite + TypeScript + Tailwind CSS
- **Backend (BaaS):** Supabase — PostgreSQL, Auth, RLS, Edge Functions
- **Pruebas:** Vitest (unitarias), Playwright (E2E)
- **CI:** GitHub Actions (lint + pruebas + auditoría + build en cada PR)

## Cómo levantar el proyecto

Requisitos: [Node.js 22+](https://nodejs.org), [Supabase CLI](https://supabase.com/docs/guides/local-development)
y Docker (para el Supabase local).

```bash
# 1. Backend local: aplica migraciones + semilla y levanta los servicios
supabase start
supabase db reset          # aplica supabase/migrations + supabase/seed.sql

# 2. Sirve la Edge Function de puntaje (en otra terminal)
supabase functions serve score-assessment

# 3. Frontend
cd web
cp .env.example .env       # completa con la URL y anon key que imprime `supabase start`
npm install
npm run dev
```

Para usar un proyecto Supabase en la nube: `supabase link --project-ref <ref>`,
`supabase db push`, `supabase functions deploy score-assessment`, y coloca la
URL y la anon key del proyecto en `web/.env`.

## Scripts (`/web`)

| Script                 | Qué hace                                    |
| ---------------------- | ------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo                      |
| `npm run build`        | Chequeo de tipos + build de producción      |
| `npm run lint`         | ESLint                                      |
| `npm run format`       | Prettier                                    |
| `npm run test:unit`    | Pruebas unitarias (Vitest)                  |
| `npm run test:e2e`     | Pruebas E2E (Playwright; requiere `.env`)   |

## Modelo de seguridad (resumen)

- **El navegador nunca calcula el puntaje.** Las respuestas viajan a la
  Edge Function `score-assessment`, que valida, recalcula el total e
  inserta el resultado con el service role. Las tablas `assessments` y
  `referrals` no tienen política de escritura para usuarios: un cliente
  manipulado no puede fijar su puntaje (HU-04).
- **RLS en todas las tablas.** Cada usuario lee solo lo suyo; el
  directorio se limita a la universidad del estudiante más los servicios
  generales del consorcio (HU-06, HU-17).
- **Anonimato por diseño.** El correo institucional solo verifica la
  pertenencia (trigger que valida el dominio contra `universities`); ante
  otros usuarios solo existe el seudónimo (HU-08).
- **Botón de ayuda 24/7** visible en todas las vistas, con líneas reales,
  protocolo de respaldo si el canal principal falla y un último recurso
  (9-1-1) fijo en el código; su uso se registra con marca de tiempo y sin
  datos personales (HU-09, HU-10).
- **Secretos fuera del repositorio:** solo `.env.example` sin llaves; la
  service role jamás toca el frontend.

## Pruebas

Las pruebas unitarias (`web/src/tests`) cubren los casos de prueba del
documento *HU clave: DoD y casos de prueba*: bandas PHQ-9/GAD-7, escalada
a crisis por el ítem 9, reglas de derivación, bloqueo de envíos
incompletos y filtros combinables del directorio. Importan la **misma**
lógica canónica que ejecuta la Edge Function
(`supabase/functions/_shared/scoring.ts`), de modo que lo probado es lo
desplegado.

Las E2E (`web/e2e`) cubren la visibilidad del botón de ayuda en todas las
vistas, el rechazo de correos no institucionales y el bloqueo de
autoevaluaciones incompletas.

## Gestión

Backlog y sprints en Jira (proyecto **LVS**):
[Tablero del proyecto](https://lavozsilenciosa.atlassian.net/jira/software/projects/LVS/boards/2/timeline)
