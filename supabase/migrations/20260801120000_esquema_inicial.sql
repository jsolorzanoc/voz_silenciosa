-- ============================================================
-- La Voz Silenciosa - Esquema inicial
-- Épicas: EP-02 (MVP), EP-03 (Recursos de Emergencia)
-- Seguridad: RLS en todas las tablas (Ley 8968, HU-08, HU-17)
-- ============================================================

-- ------------------------------------------------------------
-- Universidades del consorcio RUBE-CR
-- El dominio de correo valida el registro institucional (HU-08)
-- ------------------------------------------------------------
create table public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email_domain text not null unique,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Perfiles: 1:1 con auth.users. El seudónimo es lo único
-- visible para otros usuarios; el correo real vive solo en auth.
-- ------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  pseudonym text not null unique check (char_length(pseudonym) between 3 and 30),
  university_id uuid not null references public.universities (id),
  role text not null default 'student' check (role in ('student', 'admin')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Directorio de servicios RUBE-CR (HU-06)
-- university_id null = cobertura general del consorcio
-- ------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities (id),
  name text not null,
  description text,
  specialty text,
  modality text not null check (modality in ('presencial', 'virtual', 'mixta')),
  schedule text not null check (schedule in ('diurno', 'vespertino', 'nocturno', '24h')),
  contact text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Autoevaluaciones (HU-04, HU-05)
-- Solo la Edge Function (service role) inserta: el total nunca
-- lo decide el navegador. Sin nombre ni correo: user_id -> seudónimo.
-- ------------------------------------------------------------
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  instrument text not null check (instrument in ('phq9', 'gad7')),
  answers smallint[] not null,
  total smallint not null,
  level text not null check (
    level in ('minimo', 'leve', 'moderado', 'moderadamente_severo', 'severo')
  ),
  crisis boolean not null default false,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Derivaciones (HU-07): queda registrada para seguimiento anónimo
-- ------------------------------------------------------------
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  level text not null,
  resource text not null check (resource in ('autoayuda', 'consejeria', 'crisis')),
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Líneas de emergencia verificadas (HU-09, HU-11)
-- Lectura pública: el acceso a ayuda en crisis no exige sesión.
-- ------------------------------------------------------------
create table public.emergency_lines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  description text,
  is_backup boolean not null default false,
  verified boolean not null default false,
  active boolean not null default true,
  priority int not null default 1
);

-- ------------------------------------------------------------
-- Uso del botón de ayuda (HU-09): marca de tiempo y canal,
-- deliberadamente SIN user_id ni datos sensibles.
-- ------------------------------------------------------------
create table public.help_events (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('principal', 'respaldo')),
  outcome text not null default 'ok' check (outcome in ('ok', 'fallo_canal')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- Funciones auxiliares
-- ============================================================

-- Universidad del usuario autenticado (para el alcance del directorio)
create or replace function public.current_university()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select university_id from public.profiles where id = auth.uid();
$$;

-- ¿El usuario autenticado es administrador?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- Alta de usuario: valida dominio institucional y crea el perfil
-- con seudónimo (HU-08). Un dominio público (gmail.com) falla.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_domain text;
  v_university uuid;
  v_pseudonym text;
begin
  v_domain := lower(split_part(new.email, '@', 2));

  select id into v_university
  from public.universities
  where email_domain = v_domain;

  if v_university is null then
    raise exception 'Solo se aceptan correos institucionales del consorcio RUBE-CR (dominio recibido: %)', v_domain;
  end if;

  v_pseudonym := nullif(trim(new.raw_user_meta_data ->> 'pseudonym'), '');

  if v_pseudonym is null or char_length(v_pseudonym) < 3 then
    raise exception 'Se requiere un seudónimo de al menos 3 caracteres';
  end if;

  insert into public.profiles (id, pseudonym, university_id)
  values (new.id, v_pseudonym, v_university);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- Principio: cada usuario solo lee y escribe lo suyo (HU-17).
-- Las tablas sensibles solo se escriben desde la Edge Function
-- (service role), nunca desde el cliente.
-- ============================================================

alter table public.universities enable row level security;
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.assessments enable row level security;
alter table public.referrals enable row level security;
alter table public.emergency_lines enable row level security;
alter table public.help_events enable row level security;

-- Universidades: lectura pública (necesaria para el formulario de registro)
create policy "universities_select_all"
  on public.universities for select
  to anon, authenticated
  using (true);

-- Perfiles: cada quien ve y edita solo el suyo
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = 'student');

-- Servicios: visibles los de la propia universidad y los generales
-- del consorcio; nunca los exclusivos de otra universidad (HU-06)
create policy "services_select_scoped"
  on public.services for select
  to authenticated
  using (
    active
    and (university_id is null or university_id = public.current_university())
  );

create policy "services_admin_all"
  on public.services for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Autoevaluaciones: solo lectura de lo propio; sin política de
-- insert/update/delete para authenticated -> solo la Edge Function
-- (service role) escribe (HU-04)
create policy "assessments_select_own"
  on public.assessments for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Derivaciones: solo lectura de lo propio; escribe la Edge Function
create policy "referrals_select_own"
  on public.referrals for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Líneas de emergencia: lectura pública (la ayuda no exige sesión)
create policy "emergency_lines_select_all"
  on public.emergency_lines for select
  to anon, authenticated
  using (active);

create policy "emergency_lines_admin_all"
  on public.emergency_lines for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Uso del botón de ayuda: cualquiera puede registrar el evento
-- (sin datos personales); solo administración lo lee agregado
create policy "help_events_insert_all"
  on public.help_events for insert
  to anon, authenticated
  with check (true);

create policy "help_events_select_admin"
  on public.help_events for select
  to authenticated
  using (public.is_admin());
