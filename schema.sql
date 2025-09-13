-- Rode no SQL Editor do Supabase
create extension if not exists "pgcrypto";

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

alter table public.students enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

create policy "read_all_students" on public.students for select using (true);
create policy "read_all_courses"  on public.courses  for select using (true);
create policy "read_all_enrolls"  on public.enrollments for select using (true);

create policy "insert_students" on public.students for insert with check (true);
create policy "insert_courses"  on public.courses  for insert with check (true);
create policy "insert_enrolls"  on public.enrollments for insert with check (true);
