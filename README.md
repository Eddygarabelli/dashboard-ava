
# AVA · Escola da Barra (v4)

## O que tem de novo
- **Matrícula por Disciplina** (várias disciplinas por aluno, por Ano) – matriz Alunos × Disciplinas.
- **Upload de Foto** do aluno (bucket Storage `avatars`), salvando a URL em `alunos.foto_url`.
- **CSS separado** (`assets/app.css`) e layout com as cores da sua logo.
- Código organizado em módulos ES: `js/students.js`, `js/courses.js`, `js/app.js`.
- **Tudo estático** (sem build). Perfeito para GitHub + Vercel.

## Como publicar
1. Rode `schema.sql` no Supabase (SQL Editor). Também crie um bucket público `avatars` no Storage.
2. Edite `js/supabaseClient.js` caso mude URL/Anon Key.
3. Publique os arquivos no GitHub.
4. No Vercel:
   - Framework: **Other**
   - Build Command: *(vazio)*
   - Output Directory: **.**
   - Redeploy com **Clear build cache**.

## Fluxo
- **Alunos** → cards → clique abre **Detalhes** com **Editar** e **Editar foto**.
- **Novo Aluno** (card verde) → Cadastro → grava em `alunos`.
- **Cursos** → **Novo Curso** → crie Anos > Componentes > Disciplinas → Salvar.
- Após salvar → **Matrículas por Disciplina**: escolha o **Ano**, marque checkboxes e **Salvar**.
