/**
 * Suite de pruebas de seguridad (WBS 1.7.1.3) — La Voz Silenciosa
 *
 * Verifica contra un ambiente real (local o nube) los controles que no
 * pueden fallar en un sistema con datos de salud:
 *   - Registro solo con dominio institucional (HU-08)
 *   - RLS: cero accesos cruzados entre usuarios (HU-17, objetivo del Acta)
 *   - El puntaje solo lo decide el servidor (HU-04)
 *   - Indicadores solo para administración (HU-16)
 *   - Aislamiento del foro por membresía (HU-13)
 *   - Derecho de eliminación (Ley 8968)
 *
 * Uso:  node scripts/security-tests.mjs
 * Lee VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY del entorno o de web/.env.
 * Crea cuentas desechables (@unix.ac.cr) y las elimina al terminar.
 * Requiere las Edge Functions score-assessment y delete-account desplegadas
 * y la confirmación de correo desactivada en el ambiente de pruebas.
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  const env = { ...process.env };
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    try {
      const raw = readFileSync(join(root, 'web', '.env'), 'utf8');
      for (const line of raw.split(/\r?\n/)) {
        const match = line.match(/^([A-Z_]+)=(.*)$/);
        if (match && !env[match[1]]) env[match[1]] = match[2].trim();
      }
    } catch {
      // sin .env: se exige por variables de entorno
    }
  }
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    console.error(
      'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (entorno o web/.env)',
    );
    process.exit(2);
  }
  return { url: env.VITE_SUPABASE_URL, anon: env.VITE_SUPABASE_ANON_KEY };
}

const { url: URL_BASE, anon: ANON } = loadEnv();

let okCount = 0;
let failCount = 0;

function check(name, cond, detail = '') {
  const mark = cond ? 'OK   ' : 'FALLO';
  if (cond) okCount++;
  else failCount++;
  console.log(`[${mark}] ${name}${detail ? ` -> ${detail}` : ''}`);
}

async function req(method, path, { token, body, prefer } = {}) {
  const headers = {
    apikey: ANON,
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token ?? ANON}`,
  };
  if (prefer) headers.Prefer = prefer;
  const resp = await fetch(URL_BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  let data = null;
  try {
    data = await resp.json();
  } catch {
    // respuesta sin cuerpo
  }
  return { status: resp.status, data };
}

async function signup(email, password, pseudonym) {
  const { status, data } = await req('POST', '/auth/v1/signup', {
    body: { email, password, data: { pseudonym } },
  });
  return { status, token: data?.access_token ?? null, userId: data?.user?.id };
}

const stamp = Date.now().toString(36);
const PASSWORD = `Prueba-${stamp}-Segura`;
const emailA = `sec_a_${stamp}@unix.ac.cr`;
const emailB = `sec_b_${stamp}@unix.ac.cr`;

console.log(`Ambiente bajo prueba: ${URL_BASE}\n`);

// --- HU-08: control de dominio -------------------------------------
{
  const { status } = await signup(
    `intruso_${stamp}@gmail.com`,
    PASSWORD,
    `intruso_${stamp}`,
  );
  check('Registro con dominio público rechazado (HU-08)', status >= 400, `status ${status}`);
}

const a = await signup(emailA, PASSWORD, `sec_a_${stamp}`);
const b = await signup(emailB, PASSWORD, `sec_b_${stamp}`);
check(
  'Cuentas de prueba institucionales creadas',
  Boolean(a.token && b.token),
  a.token && b.token ? 'A y B activas' : `A=${a.status} B=${b.status}`,
);
if (!a.token || !b.token) {
  console.error('\nSin cuentas de prueba no se puede continuar.');
  process.exit(1);
}

// --- HU-04: el servidor decide el puntaje ---------------------------
{
  const { status, data } = await req('POST', '/functions/v1/score-assessment', {
    token: a.token,
    body: { instrument: 'phq9', answers: [2, 2, 2, 1, 1, 1, 2, 1, 0], total: 0 },
  });
  check(
    'El total manipulado del cliente se ignora (HU-04)',
    status === 200 && data?.total === 12,
    `total=${data?.total}`,
  );
}
{
  const { status } = await req('POST', '/functions/v1/score-assessment', {
    token: a.token,
    body: { instrument: 'phq9', answers: [1, 1, 1, 1, null, 1, 1, 1, 1] },
  });
  check('Envío incompleto rechazado sin escribir nada (HU-04)', status === 422, `status ${status}`);
}
{
  const { status } = await req('POST', '/rest/v1/assessments', {
    token: a.token,
    body: {
      user_id: a.userId,
      instrument: 'phq9',
      answers: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      total: 0,
      level: 'minimo',
    },
  });
  check(
    'Insert directo de puntaje bloqueado: solo la Edge Function escribe',
    status === 401 || status === 403,
    `status ${status}`,
  );
}

// --- HU-17: cero accesos cruzados -----------------------------------
{
  const { status, data } = await req(
    'GET',
    '/rest/v1/assessments?select=id,user_id',
    { token: b.token },
  );
  const foreign = (data ?? []).filter((row) => row.user_id !== b.userId);
  check(
    'Usuario B no ve evaluaciones de A (RLS, cero accesos cruzados)',
    status === 200 && foreign.length === 0,
    `filas ajenas=${foreign.length}`,
  );
}
{
  const { status, data } = await req('GET', '/rest/v1/profiles?select=id', {
    token: b.token,
  });
  check(
    'Usuario B solo ve su propio perfil',
    status === 200 && (data ?? []).length === 1,
    `filas=${(data ?? []).length}`,
  );
}
{
  const { status, data } = await req('GET', '/rest/v1/assessments?select=id', {});
  check(
    'Anónimo no lee ninguna evaluación',
    (status === 200 && (data ?? []).length === 0) || status === 401,
    `status ${status}`,
  );
}

// --- HU-16: indicadores solo administración -------------------------
{
  const { status } = await req('POST', '/rest/v1/rpc/admin_overview', {
    token: a.token,
    body: {},
  });
  check('Estudiante no puede leer indicadores agregados (HU-16)', status >= 400, `status ${status}`);
}

// --- HU-13: aislamiento del foro por membresía ----------------------
{
  const { data: groups } = await req(
    'GET',
    '/rest/v1/support_groups?select=id&limit=1',
    { token: a.token },
  );
  const groupId = groups?.[0]?.id;
  if (groupId) {
    const { status } = await req('POST', '/rest/v1/group_messages', {
      token: a.token,
      body: { group_id: groupId, user_id: a.userId, content: 'sin membresía' },
    });
    check(
      'No-miembro no puede publicar en un foro (HU-13)',
      status === 401 || status === 403,
      `status ${status}`,
    );
  } else {
    check('No-miembro no puede publicar en un foro (HU-13)', false, 'sin grupos semilla');
  }
}

// --- Ley 8968: derecho de eliminación -------------------------------
{
  const { status } = await req('POST', '/functions/v1/delete-account', {
    token: b.token,
    body: {},
  });
  check('El usuario puede eliminar su cuenta (Ley 8968)', status === 200, `status ${status}`);
  const { status: loginStatus } = await req(
    'POST',
    '/auth/v1/token?grant_type=password',
    { body: { email: emailB, password: PASSWORD } },
  );
  check('La cuenta eliminada ya no puede iniciar sesión', loginStatus >= 400, `status ${loginStatus}`);
}

// Limpieza: elimina la cuenta A (sus datos caen en cascada)
await req('POST', '/functions/v1/delete-account', { token: a.token, body: {} });

console.log(`\nResultado: ${okCount} OK, ${failCount} fallos`);
process.exit(failCount === 0 ? 0 : 1);
