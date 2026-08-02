-- ============================================================
-- Datos semilla para desarrollo y pruebas (idempotente: puede
-- ejecutarse varias veces sin duplicar registros).
-- ADVERTENCIA: los teléfonos de líneas de ayuda distintos del
-- 9-1-1 son de ejemplo y deben verificarse con la Dirección de
-- Bienestar Estudiantil antes de cualquier despliegue real
-- (supuesto del Acta Constitutiva).
-- ============================================================

insert into public.universities (id, name, email_domain) values
  ('11111111-1111-1111-1111-111111111111', 'Universidad X', 'unix.ac.cr'),
  ('22222222-2222-2222-2222-222222222222', 'Universidad Y', 'uniy.ac.cr'),
  ('33333333-3333-3333-3333-333333333333', 'ULACIT (demo)', 'ulacit.ed.cr')
on conflict do nothing;

insert into public.services (id, university_id, name, description, specialty, modality, schedule, contact) values
  -- Cobertura general del consorcio
  ('aaaa1111-0000-0000-0000-000000000001', null, 'Línea de escucha RUBE-CR', 'Atención emocional telefónica para estudiantes de todo el consorcio.', 'Contención emocional', 'virtual', '24h', 'escucha@rube-cr.ac.cr'),
  ('aaaa1111-0000-0000-0000-000000000002', null, 'Talleres de manejo del estrés', 'Talleres virtuales quincenales abiertos a todo el consorcio.', 'Psicoeducación', 'virtual', 'vespertino', 'talleres@rube-cr.ac.cr'),
  -- Universidad X
  ('aaaa1111-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Consejería psicológica UX', 'Citas individuales con el equipo de psicología de la Universidad X.', 'Psicología clínica', 'presencial', 'diurno', 'consejeria@unix.ac.cr'),
  ('aaaa1111-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Consejería virtual nocturna UX', 'Sesiones virtuales para estudiantes que trabajan de día.', 'Psicología clínica', 'virtual', 'nocturno', 'consejeria@unix.ac.cr'),
  ('aaaa1111-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Grupo de apoyo académico UX', 'Acompañamiento entre pares para estrés académico.', 'Apoyo entre pares', 'mixta', 'vespertino', 'bienestar@unix.ac.cr'),
  -- Universidad Y (exclusivos: un estudiante de la X no debe verlos)
  ('aaaa1111-0000-0000-0000-000000000006', '22222222-2222-2222-2222-222222222222', 'Consejería psicológica UY', 'Citas individuales en el campus de la Universidad Y.', 'Psicología clínica', 'presencial', 'diurno', 'consejeria@uniy.ac.cr'),
  ('aaaa1111-0000-0000-0000-000000000007', '22222222-2222-2222-2222-222222222222', 'Orientación vocacional UY', 'Acompañamiento vocacional y académico.', 'Orientación', 'mixta', 'diurno', 'orientacion@uniy.ac.cr')
on conflict do nothing;

insert into public.emergency_lines (id, name, phone, description, is_backup, verified, active, priority) values
  ('bbbb2222-0000-0000-0000-000000000001', 'Sistema de Emergencias 9-1-1', '911', 'Emergencias con riesgo inmediato para la vida.', false, true, true, 1),
  ('bbbb2222-0000-0000-0000-000000000002', 'Línea de apoyo emocional RUBE-CR', '800-0000-001', 'Línea del consorcio atendida por profesionales. VERIFICAR NÚMERO ANTES DE PRODUCCIÓN.', false, false, true, 2),
  ('bbbb2222-0000-0000-0000-000000000003', 'Línea de respaldo de crisis', '800-0000-002', 'Canal alterno si la línea principal falla (HU-10). VERIFICAR NÚMERO ANTES DE PRODUCCIÓN.', true, false, true, 3)
on conflict do nothing;

-- Grupos de apoyo temáticos (EP-04)
insert into public.support_groups (id, university_id, name, topic, description, active) values
  ('cccc3333-0000-0000-0000-000000000001', null, 'Manejo del estrés académico', 'Estrés académico', 'Espacio del consorcio para compartir estrategias frente a la carga académica.', true),
  ('cccc3333-0000-0000-0000-000000000002', null, 'Ansiedad y vida universitaria', 'Ansiedad', 'Grupo de pares para hablar de la ansiedad en un entorno seguro y moderado.', true),
  ('cccc3333-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Primer ingreso UX', 'Adaptación', 'Acompañamiento entre pares para estudiantes de primer ingreso de la Universidad X.', true)
on conflict do nothing;

insert into public.group_sessions (id, group_id, title, starts_at, modality, location) values
  ('dddd4444-0000-0000-0000-000000000001', 'cccc3333-0000-0000-0000-000000000001', 'Círculo de escucha semanal', now() + interval '3 days', 'virtual', 'Enlace visible para miembros'),
  ('dddd4444-0000-0000-0000-000000000002', 'cccc3333-0000-0000-0000-000000000002', 'Técnicas de respiración y calma', now() + interval '5 days', 'virtual', 'Enlace visible para miembros'),
  ('dddd4444-0000-0000-0000-000000000003', 'cccc3333-0000-0000-0000-000000000003', 'Bienvenida y presentación', now() + interval '7 days', 'presencial', 'Campus UX, sala de bienestar')
on conflict do nothing;
