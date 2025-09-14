
# AVA Clean V3 – Cursos + Matrículas (Supabase)

## Novidades
- **Botão "Novo Curso"** na aba Cursos.
- **Criação de cursos** com: *nome*, *descrição*, *label* (exibida no card), e estrutura **Ano → Componentes → Disciplinas**.
- **Cursos salvos no Supabase** (`courses.structure` em JSONB).
- **Página final de matrículas** por **Ano**: selecione alunos (da tabela `alunos`) e salve em `enrollments`.
- **Cursos** agora carregam do **Supabase**; lápis para editar **nome/descrição/label** rapidamente (prompts).

## Como usar
1. Rode o `schema.sql` no Supabase (SQL Editor) **uma vez**.
2. Publique os arquivos no GitHub/Vercel (Framework: *Other*, Build Command: vazio, Output: `.`).
3. No site:
   - Abra a aba **Cursos** → **Novo Curso**;
   - Preencha **Nome/Descrição/Label**;
   - Clique **+ Ano**, **+ Componente**, **+ Disciplina** (adicione o que precisar);
   - **Salvar Curso** → você será levado à página de **Matrículas**;
   - Escolha o **Ano**, filtre por nome e marque os alunos; clique **Salvar Matrículas**.

## Requisitos de banco
- Tabela `alunos` já existente (conforme sua instância).
- Novas tabelas:
  - `courses(id, name, label, description, structure, created_at)`
  - `enrollments(id, course_id, aluno_id, year, subject, created_at, unique(course_id, aluno_id, year, subject))`
- RLS habilitada com políticas de acesso liberadas (ajuste conforme segurança do seu projeto).

## Env de Supabase
As credenciais foram embutidas em `supabaseClient.js` para facilitar; você pode mover para variáveis de ambiente depois.

- URL: https://tbkmwmnxfzlsqnjgwsuo.supabase.co
- ANON KEY: eyJhbGciOiJI... (truncada)

