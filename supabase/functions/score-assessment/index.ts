/**
 * Edge Function `score-assessment` (HU-04, HU-05, HU-07).
 *
 * Recibe { instrument, answers } de un usuario autenticado, valida que el
 * cuestionario esté completo, calcula el puntaje EN EL SERVIDOR (nunca en
 * el navegador), guarda la autoevaluación y su derivación con el service
 * role, y devuelve el resultado. Cualquier "total" enviado por el cliente
 * se ignora por diseño.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  isInstrument,
  scoreAssessment,
  validateAnswers,
} from '../_shared/scoring.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Identifica al usuario a partir de su JWT (verify_jwt ya validó la firma)
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();

  if (userError || !user) {
    return json({ error: 'No autenticado' }, 401);
  }

  let payload: { instrument?: unknown; answers?: unknown };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Cuerpo JSON inválido' }, 400);
  }

  if (!isInstrument(payload.instrument)) {
    return json({ error: 'Instrumento no soportado (phq9 | gad7)' }, 400);
  }

  const validation = validateAnswers(payload.instrument, payload.answers);
  if (!validation.valid) {
    // Envío incompleto: se bloquea y no se escribe nada (HU-04 caso 2)
    return json(
      { error: validation.error, invalidItems: validation.invalidItems },
      422,
    );
  }

  // El total SIEMPRE se recalcula aquí (HU-04 caso 3)
  const result = scoreAssessment(
    payload.instrument,
    payload.answers as number[],
  );

  // Escritura con service role: las tablas no tienen política de insert
  // para el rol authenticated, así el cliente no puede escribir directo.
  const admin = createClient(supabaseUrl, serviceRoleKey);

  const { data: assessment, error: insertError } = await admin
    .from('assessments')
    .insert({
      user_id: user.id,
      instrument: result.instrument,
      answers: payload.answers,
      total: result.total,
      level: result.level,
      crisis: result.crisis,
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error al guardar la autoevaluación', insertError);
    return json({ error: 'No se pudo guardar la autoevaluación' }, 500);
  }

  const { error: referralError } = await admin.from('referrals').insert({
    assessment_id: assessment.id,
    user_id: user.id,
    level: result.level,
    resource: result.resource,
  });

  if (referralError) {
    console.error('Error al registrar la derivación', referralError);
    return json({ error: 'No se pudo registrar la derivación' }, 500);
  }

  return json({
    assessmentId: assessment.id,
    instrument: result.instrument,
    total: result.total,
    level: result.level,
    crisis: result.crisis,
    resource: result.resource,
  });
});
