-- ============================================================
-- Datos semilla para desarrollo y pruebas.
-- ADVERTENCIA: los teléfonos de líneas de ayuda distintos del
-- 9-1-1 son de ejemplo y deben verificarse con la Dirección de
-- Bienestar Estudiantil antes de cualquier despliegue real
-- (supuesto del Acta Constitutiva).
-- ============================================================

insert into public.universities (id, name, email_domain) values
  ('11111111-1111-1111-1111-111111111111', 'Universidad X', 'unix.ac.cr'),
  ('22222222-2222-2222-2222-222222222222', 'Universidad Y', 'uniy.ac.cr'),
  ('33333333-3333-3333-3333-333333333333', 'ULACIT (demo)', 'ulacit.ed.cr');

insert into public.services (university_id, name, description, specialty, modality, schedule, contact) values
  -- Cobertura general del consorcio
  (null, 'Línea de escucha RUBE-CR', 'Atención emocional telefónica para estudiantes de todo el consorcio.', 'Contención emocional', 'virtual', '24h', 'escucha@rube-cr.ac.cr'),
  (null, 'Talleres de manejo del estrés', 'Talleres virtuales quincenales abiertos a todo el consorcio.', 'Psicoeducación', 'virtual', 'vespertino', 'talleres@rube-cr.ac.cr'),
  -- Universidad X
  ('11111111-1111-1111-1111-111111111111', 'Consejería psicológica UX', 'Citas individuales con el equipo de psicología de la Universidad X.', 'Psicología clínica', 'presencial', 'diurno', 'consejeria@unix.ac.cr'),
  ('11111111-1111-1111-1111-111111111111', 'Consejería virtual nocturna UX', 'Sesiones virtuales para estudiantes que trabajan de día.', 'Psicología clínica', 'virtual', 'nocturno', 'consejeria@unix.ac.cr'),
  ('11111111-1111-1111-1111-111111111111', 'Grupo de apoyo académico UX', 'Acompañamiento entre pares para estrés académico.', 'Apoyo entre pares', 'mixta', 'vespertino', 'bienestar@unix.ac.cr'),
  -- Universidad Y (exclusivos: un estudiante de la X no debe verlos)
  ('22222222-2222-2222-2222-222222222222', 'Consejería psicológica UY', 'Citas individuales en el campus de la Universidad Y.', 'Psicología clínica', 'presencial', 'diurno', 'consejeria@uniy.ac.cr'),
  ('22222222-2222-2222-2222-222222222222', 'Orientación vocacional UY', 'Acompañamiento vocacional y académico.', 'Orientación', 'mixta', 'diurno', 'orientacion@uniy.ac.cr');

insert into public.emergency_lines (name, phone, description, is_backup, verified, active, priority) values
  ('Sistema de Emergencias 9-1-1', '911', 'Emergencias con riesgo inmediato para la vida.', false, true, true, 1),
  ('Línea de apoyo emocional RUBE-CR', '800-0000-001', 'Línea del consorcio atendida por profesionales. VERIFICAR NÚMERO ANTES DE PRODUCCIÓN.', false, false, true, 2),
  ('Línea de respaldo de crisis', '800-0000-002', 'Canal alterno si la línea principal falla (HU-10). VERIFICAR NÚMERO ANTES DE PRODUCCIÓN.', true, false, true, 3);
