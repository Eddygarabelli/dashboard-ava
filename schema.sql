-- Extensão
create extension if not exists "pgcrypto";

-- Tabelas base + campos extras
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  photo_url text,
  created_at timestamptz default now(),
  -- extras do formulário
  first_name text,
  last_name  text,
  rg         text,
  cpf        text,
  birth_date date,
  birth_place text,
  phone      text,
  street     text,
  number     text,
  neighborhood text,
  zip_code   text,
  city       text,
  state      text,
  levels     text[]
);
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  created_at timestamptz default now()
);
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  created_at timestamptz default now(),
  unique (student_id, course_id)
);

-- RLS
alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

-- Realtime
do $$ begin alter publication supabase_realtime add table public.students;   exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.courses;    exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.enrollments; exception when duplicate_object then null; end $$;

-- Storage: bucket e políticas
insert into storage.buckets (id, name, public)
values ('students','students', true)
on conflict (id) do nothing;

alter table storage.objects enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'students_public_read'
  ) then
    create policy students_public_read on storage.objects
      for select using (bucket_id = 'students');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'students_anon_insert'
  ) then
    create policy students_anon_insert on storage.objects
      for insert to anon with check (bucket_id = 'students');
  end if;
end $$;
