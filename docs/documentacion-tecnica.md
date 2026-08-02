# Documentación técnica — La Voz Silenciosa

**WBS:** 1.7.3.1 · **Última actualización:** 1 de agosto de 2026

## Arquitectura

Una sola aplicación web responsiva (React + Vite + TypeScript + Tailwind),
instalable como PWA, que habla directamente con Supabase como backend
administrado. La lógica que no puede vivir en el navegador (cálculo de
puntaje, borrado de cuenta) corre en Edge Functions.

```
┌─────────────────────────────┐
│  PWA (React + Vite + TS)    │  /web
│  - shell precacheado (SW)   │
│  - líneas de ayuda en caché │
└──────────────┬──────────────┘
               │ HTTPS (anon key + JWT del usuario)
┌──────────────▼──────────────┐
│  Supabase                   │  /supabase
│  - PostgreSQL + RLS         │  migrations/
│  - Auth (correo + seudónimo)│
│  - Realtime (foro)          │
│  - Edge Functions:          │  functions/
│      score-assessment       │   (service role: única vía de
│      delete-account         │    escritura de resultados)
└─────────────────────────────┘
```

## Esquema de datos (resumen)

| Tabla | Propósito | Escritura |
| --- | --- | --- |
| `universities` | Consorcio y dominios de correo válidos | Semilla/admin |
| `profiles` | Seudónimo, universidad y rol (1:1 con auth) | Trigger de alta; rol solo admin |
| `services` | Directorio RUBE-CR con modalidad y horario | Panel admin |
| `assessments` | Autoevaluaciones (respuestas, total, nivel, crisis) | **Solo Edge Function** |
| `referrals` | Derivación registrada por nivel de riesgo | **Solo Edge Function** |
| `emergency_lines` | Líneas 24/7 verificadas y de respaldo | Panel admin |
| `help_events` | Uso del botón de ayuda (sin datos personales) | Cualquiera (insert) |
| `support_groups` / `group_members` / `group_sessions` | Grupos temáticos, membresías y calendario | Admin / el propio usuario |
| `group_messages` / `message_reports` | Foro con seudónimo y reportes | Miembros; moderación solo admin |

Reglas de negocio en el servidor: bandas PHQ-9/GAD-7 y derivación en
`functions/_shared/scoring.ts`; validación de dominio en el trigger
`handle_new_user`; seudónimo y marcado de riesgo de mensajes en
`prepare_group_message`; indicadores agregados en funciones `admin_*`.

## Decisiones técnicas relevantes

1. **El navegador nunca calcula el puntaje.** `assessments` y `referrals`
   no tienen política de INSERT para usuarios; la Edge Function revalida
   y recalcula todo lo que llega del cliente.
2. **react-router 8.3.0** en lugar de `react-router-dom` 7.x: la 7.x
   arrastraba la vulnerabilidad alta GHSA-qwww-vcr4-c8h2 sin parche en esa
   línea.
3. **La PWA no cachea respuestas de la API** (datos sensibles de salud);
   solo el shell de la app. Las líneas de emergencia —datos públicos— se
   guardan en `localStorage` para que el botón de ayuda funcione offline.
4. **Los administradores ven agregados, no filas.** Las funciones
   `admin_*` (security definer) devuelven conteos y rechazan a quien no
   es admin; ni el panel ni la API exponen resultados individuales.
5. **Web Push (HU-19, Could) diferido** según la priorización MoSCoW del
   backlog; los avisos de sesiones se muestran en la app.

## Ambientes y despliegue

- **Local:** `supabase start` + `supabase db reset` (migraciones y
  semilla) + `supabase functions serve` + `npm run dev` en `/web`.
- **Nube (pruebas):** proyecto Supabase del equipo; `supabase db push`
  aplica migraciones y `supabase functions deploy <n>` las funciones.
  El frontend puede desplegarse en Vercel/Netlify apuntando `web/` con
  las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- **CI (GitHub Actions):** lint + unitarias + `npm audit` + build en cada
  PR y push a `main`.

## Estructura del repositorio

```
/docs        documentación del curso y de cierre
/scripts     suite de pruebas de seguridad (node)
/supabase    config, migrations/, seed.sql, functions/
/web         aplicación (src/, e2e/, public/)
```

Guías de ejecución y scripts: ver `README.md`. Plan y resultados de
pruebas: `docs/plan-de-pruebas.md`. Auditoría de privacidad:
`docs/auditoria-ley-8968.md`.
