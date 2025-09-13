# Dashboard AVA — Página separada para Adicionar Aluno (Supabase Realtime)

## Rodar local
1) Copie `.env.example` para `.env` e preencha sua anon key do Supabase.
2) `npm install`
3) `npm run dev`

## Vercel
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Vars: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

## Rotas
- Dashboard: `#/`
- Alunos: `#/alunos`
- Novo aluno: `#/alunos/novo` (também abre clicando no botão **Adicionar Aluno**)

## Banco
Rode `schema.sql` no SQL Editor do Supabase (não recria policies).
