-- ============================================================
-- La Voz Silenciosa - Grupos de Apoyo y Panel Administrativo
-- Épicas: EP-04 (HU-12, HU-13, HU-14) y EP-05 (HU-15, HU-16, HU-17)
-- ============================================================

-- ------------------------------------------------------------
-- Grupos de apoyo temáticos (HU-12)
-- university_id null = abierto a todo el consorcio
-- ------------------------------------------------------------
create table public.support_groups (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities (id),
  name text not null,
  topic text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.support_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ------------------------------------------------------------
-- Calendario de sesiones del grupo (HU-14)
-- ------------------------------------------------------------
create table public.group_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.support_groups (id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  modality text not null default 'virtual' check (modality in ('presencial', 'virtual')),
  location text,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Foro confidencial en tiempo real (HU-13)
-- El seudónimo se copia al mensaje al insertarlo (trigger), para no
-- exponer la tabla de perfiles a otros usuarios.
-- ------------------------------------------------------------
create table public.group_messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.support_groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  author_pseudonym text not null default '',
  content text not null check (char_length(content) between 1 and 2000),
  flagged boolean not null default false,
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);

-- Reportes de la comunidad: un reporte marca el mensaje para revisión
create table public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.group_messages (id) on delete cascade,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, reporter_id)
);

-- ============================================================
-- Funciones auxiliares
-- ============================================================

create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- Moderación de contenido de riesgo (WBS 1.4.3.2)
-- No censura: marca el mensaje para revisión humana. La UI, además,
-- muestra apoyo inmediato a quien lo escribió.
-- ------------------------------------------------------------
create or replace function public.contains_risk_content(p_content text)
returns boolean
language sql
immutable
as $$
  select exists (
    select 1
    from unnest(array[
      'suicid', 'matarme', 'quitarme la vida', 'no quiero vivir',
      'no vale la pena vivir', 'hacerme daño', 'hacerme dano',
      'autolesion', 'autolesión', 'cortarme', 'lastimarme',
      'acabar con todo', 'mejor muerto', 'mejor muerta'
    ]) as kw
    where position(kw in lower(p_content)) > 0
  );
$$;

-- El servidor fija seudónimo y banderas: el cliente no decide moderación
create or replace function public.prepare_group_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pseudonym text;
begin
  select pseudonym into v_pseudonym
  from public.profiles
  where id = new.user_id;

  if v_pseudonym is null then
    raise exception 'Perfil no encontrado para el autor del mensaje';
  end if;

  new.author_pseudonym := v_pseudonym;
  new.flagged := public.contains_risk_content(new.content);
  new.hidden := false;
  return new;
end;
$$;

create trigger on_group_message_insert
  before insert on public.group_messages
  for each row execute function public.prepare_group_message();

-- Un reporte de la comunidad escala el mensaje a la cola de moderación
create or replace function public.escalate_reported_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.group_messages set flagged = true where id = new.message_id;
  return new;
end;
$$;

create trigger on_message_report
  after insert on public.message_reports
  for each row execute function public.escalate_reported_message();

-- ============================================================
-- Indicadores agregados y anónimos (HU-16)
-- Los administradores NUNCA leen evaluaciones individuales: estas
-- funciones (security definer) devuelven solo conteos agregados y
-- rechazan a quien no sea administrador.
-- ============================================================

create or replace function public.admin_overview()
returns table (
  students bigint,
  admins bigint,
  groups_active bigint,
  assessments_total bigint,
  crisis_total bigint,
  flagged_pending bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  return query select
    (select count(*) from public.profiles where role = 'student'),
    (select count(*) from public.profiles where role = 'admin'),
    (select count(*) from public.support_groups where active),
    (select count(*) from public.assessments),
    (select count(*) from public.assessments where crisis),
    (select count(*) from public.group_messages where flagged and not hidden);
end;
$$;

create or replace function public.admin_assessment_stats()
returns table (instrument text, level text, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  return query
    select a.instrument, a.level, count(*)::bigint
    from public.assessments a
    group by a.instrument, a.level;
end;
$$;

create or replace function public.admin_referral_stats()
returns table (resource text, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  return query
    select r.resource, count(*)::bigint
    from public.referrals r
    group by r.resource;
end;
$$;

create or replace function public.admin_help_stats()
returns table (day date, channel text, total bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo administradores';
  end if;
  return query
    select h.created_at::date, h.channel, count(*)::bigint
    from public.help_events h
    where h.created_at > now() - interval '30 days'
    group by h.created_at::date, h.channel
    order by 1;
end;
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.support_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_sessions enable row level security;
alter table public.group_messages enable row level security;
alter table public.message_reports enable row level security;

-- Grupos: visibles los del consorcio y los de la propia universidad
create policy "groups_select_scoped"
  on public.support_groups for select
  to authenticated
  using (
    active
    and (university_id is null or university_id = public.current_university())
  );

create policy "groups_admin_all"
  on public.support_groups for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Membresías: cada quien gestiona la suya; solo a grupos que puede ver
create policy "members_select_own"
  on public.group_members for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "members_join_visible_group"
  on public.group_members for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.support_groups g where g.id = group_id)
  );

create policy "members_leave_own"
  on public.group_members for delete
  to authenticated
  using (user_id = (select auth.uid()));

create policy "members_admin_select"
  on public.group_members for select
  to authenticated
  using (public.is_admin());

-- Sesiones: las ven los miembros; las gestiona administración
create policy "sessions_select_member"
  on public.group_sessions for select
  to authenticated
  using (public.is_group_member(group_id) or public.is_admin());

create policy "sessions_admin_all"
  on public.group_sessions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Mensajes: solo miembros del grupo; los ocultos no se sirven a
-- estudiantes; administración ve todo para moderar
create policy "messages_select_member"
  on public.group_messages for select
  to authenticated
  using (public.is_group_member(group_id) and not hidden);

create policy "messages_select_admin"
  on public.group_messages for select
  to authenticated
  using (public.is_admin());

create policy "messages_insert_member"
  on public.group_messages for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and public.is_group_member(group_id)
  );

create policy "messages_moderate_admin"
  on public.group_messages for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Reportes: cualquier miembro puede reportar un mensaje que ve
create policy "reports_insert_member"
  on public.message_reports for insert
  to authenticated
  with check (
    reporter_id = (select auth.uid())
    and exists (select 1 from public.group_messages m where m.id = message_id)
  );

create policy "reports_select_admin"
  on public.message_reports for select
  to authenticated
  using (public.is_admin());

-- Perfiles: administración lista usuarios y gestiona roles (HU-17).
-- Nota: profiles no contiene el correo; el anonimato se mantiene.
create policy "profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================
-- Realtime para el foro (Supabase Realtime respeta RLS)
-- ============================================================
alter publication supabase_realtime add table public.group_messages;
