-- Extensão
create extension if not exists "pgcrypto";

-- Tabelas (idempotente)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  photo_url text,
  created_at timestamptz default now()
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

-- Colunas extras do formulário
alter table public.students
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists rg         text,
  add column if not exists cpf        text,
  add column if not exists birth_date date,
  add column if not exists birth_place text,
  add column if not exists phone      text,
  add column if not exists street     text,
  add column if not exists number     text,
  add column if not exists neighborhood text,
  add column if not exists zip_code   text,
  add column if not exists city       text,
  add column if not exists state      text,
  add column if not exists levels     text[];

-- RLS ativado (policies ficam a seu critério)
alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

-- Realtime publish
do $$ begin alter publication supabase_realtime add table public.students;   exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.courses;    exception when duplicate_object then null; end $$;
do $$ begin alter publication supabase_realtime add table public.enrollments; exception when duplicate_object then null; end $$;
