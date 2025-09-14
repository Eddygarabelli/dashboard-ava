
-- Tabelas para cursos e matrículas (compatível com colunas já existentes em 'alunos')

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  label text,
  description text,
  structure jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  aluno_id uuid not null references public.alunos(id) on delete cascade,
  year text not null,
  subject text,
  created_at timestamptz not null default now(),
  unique(course_id, aluno_id, year, subject)
);

-- RLS
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

-- Policies: liberando anon para CRUD básico (ajuste conforme necessidade)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='courses_select_all') then
    create policy courses_select_all on public.courses for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='courses_insert_all') then
    create policy courses_insert_all on public.courses for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='courses_update_all') then
    create policy courses_update_all on public.courses for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='courses' and policyname='courses_delete_all') then
    create policy courses_delete_all on public.courses for delete using (true);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='enrollments' and policyname='enrollments_select_all') then
    create policy enrollments_select_all on public.enrollments for select using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='enrollments' and policyname='enrollments_insert_all') then
    create policy enrollments_insert_all on public.enrollments for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='enrollments' and policyname='enrollments_update_all') then
    create policy enrollments_update_all on public.enrollments for update using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='enrollments' and policyname='enrollments_delete_all') then
    create policy enrollments_delete_all on public.enrollments for delete using (true);
  end if;
end $$;
