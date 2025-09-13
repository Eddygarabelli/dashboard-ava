# Dashboard AVA — Hash Router + Supabase Realtime

## Passos
1) `.env.example` -> `.env` (local) e preencha:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
2) `npm install` e `npm run dev`
3) Rode `schema.sql` no Supabase (idempotente; não cria policies para evitar conflitos).
4) Deploy no Vercel:
   - Preset: Vite
   - Build: npm run build
   - Output: dist
   - Vars: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY

## Rotas
- Dashboard: `#/`
- Alunos: `#/alunos`
- Adicionar Aluno: `#/alunos/novo`
