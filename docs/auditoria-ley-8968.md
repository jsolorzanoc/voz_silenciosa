# Auditoría de cumplimiento — Ley 8968 y seguridad

**WBS:** 1.7.2 · **Épica:** EP-07 · **Fecha de revisión:** 1 de agosto de 2026

Lista de verificación de privacidad (Ley 8968, Protección de la Persona
frente al Tratamiento de sus Datos Personales) y revisión OWASP Top 10
aplicada a La Voz Silenciosa. Los datos de autoevaluación son **datos
sensibles de salud**: el estándar aplicado es el más estricto del marco.

## Checklist Ley 8968

| # | Principio | Implementación | Evidencia | Estado |
| --- | --- | --- | --- | --- |
| 1 | Consentimiento informado y explícito | Aviso al crear cuenta y casilla de consentimiento obligatoria antes de cada autoevaluación | `Register.tsx`, `Assessment.tsx` | ✅ |
| 2 | Minimización de datos | Solo correo institucional (verificación), seudónimo y respuestas; sin nombre, cédula ni teléfono | Esquema en `20260801120000_esquema_inicial.sql` | ✅ |
| 3 | Seudonimización | El correo vive solo en `auth.users`; `profiles` y todo lo visible usan seudónimo; los mensajes lo copian por trigger sin exponer perfiles | Trigger `handle_new_user`, `prepare_group_message` | ✅ |
| 4 | Confidencialidad / acceso | RLS en el 100 % de las tablas: cada usuario lee solo lo suyo; administración ve seudónimos, nunca correos ni resultados individuales | Suite `scripts/security-tests.mjs` (cero accesos cruzados) | ✅ |
| 5 | Datos agregados para gestión | Los indicadores del panel salen de funciones `security definer` que solo devuelven conteos | `admin_*` en `20260802090000_grupos_y_panel.sql` | ✅ |
| 6 | Cifrado en tránsito | HTTPS extremo a extremo (Supabase/Vercel fuerzan TLS) | Configuración de plataforma | ✅ |
| 7 | Cifrado en reposo | Cifrado de disco administrado por Supabase (AES-256) | Documentación de plataforma | ✅ |
| 8 | Derecho de eliminación | Página "Mi cuenta" → Edge Function `delete-account` (service role) borra la cuenta y arrastra en cascada perfil, evaluaciones, derivaciones, membresías, mensajes y reportes | `Account.tsx`, `delete-account/index.ts`, FKs `on delete cascade` | ✅ |
| 9 | Registro sin datos personales | `help_events` guarda solo canal, resultado y marca de tiempo; sin `user_id` por diseño | Esquema + DoD HU-09 | ✅ |
| 10 | No transferencia a terceros | Ningún resultado se comparte; sin analítica de terceros ni rastreadores | Revisión de dependencias del frontend | ✅ |
| 11 | Sin decisiones automatizadas de IA sobre personas | El puntaje sale de instrumentos validados con reglas fijas; el botón de ayuda conecta con personas reales | `scoring.ts` (reglas deterministas) | ✅ |

## Revisión OWASP Top 10 (2021)

| Riesgo | Mitigación en el proyecto | Estado |
| --- | --- | --- |
| A01 Broken Access Control | RLS por fila en todas las tablas; escrituras sensibles solo vía Edge Functions con service role; verificación explícita de acceso cruzado en la suite de seguridad | ✅ |
| A02 Cryptographic Failures | TLS en tránsito, cifrado en reposo, sin secretos en el repositorio (`.env` ignorado, solo `.env.example`) | ✅ |
| A03 Injection | Sin SQL construido a mano en el cliente (PostgREST parametriza); React escapa la salida (XSS); funciones SQL con `search_path` fijado | ✅ |
| A04 Insecure Design | Modelo de amenazas guiado por las HU: el navegador nunca decide puntaje ni banderas de moderación; triggers del lado servidor | ✅ |
| A05 Security Misconfiguration | `verify_jwt = true` en las Edge Functions; `main` protegida + CI obligatorio; llaves anon/service separadas | ✅ |
| A06 Vulnerable Components | `npm audit --audit-level=high` en cada PR (falla el build); migración a react-router 8.3.0 por GHSA-qwww-vcr4-c8h2 | ✅ |
| A07 Identification & Auth Failures | Supabase Auth (bcrypt, sesiones JWT); dominio institucional validado en el servidor; contraseña mínima de 8 | ✅ |
| A08 Software & Data Integrity | PRs con revisión + CI; lockfile versionado; sin CDNs de terceros en runtime | ✅ |
| A09 Logging & Monitoring | Eventos de ayuda y derivaciones registrados sin datos sensibles; logs de Edge Functions en Supabase | ✅ |
| A10 SSRF | El servidor no consume URLs provistas por usuarios | ✅ (no aplica) |

## Hallazgos y pendientes antes de la entrega final

| # | Hallazgo | Severidad | Acción |
| --- | --- | --- | --- |
| 1 | "Confirm email" está desactivado en el ambiente de pruebas (los dominios semilla son ficticios y no reciben correo) | Media | Reactivar en Auth → Providers antes de la entrega/producción |
| 2 | Los teléfonos de líneas de ayuda distintos del 9-1-1 son de ejemplo | Alta (operativa) | Bienestar Estudiantil debe verificar cada número y marcarlo "verificada" en el panel |
| 3 | El repositorio es público durante el desarrollo del entregable | Baja | Pasarlo a privado con acceso al equipo y al profesor (según el plan del Avance 1) |
| 4 | Análisis dinámico OWASP ZAP aún no ejecutado | Media | Correr ZAP (baseline scan) contra el ambiente de pruebas en el cierre del Sprint 7 y registrar hallazgos aquí |

Sin hallazgos críticos abiertos. El objetivo del Acta —cero accesos
cruzados en las pruebas de RLS— se cumple y queda automatizado en
`scripts/security-tests.mjs` para re-verificarse en cualquier momento.
