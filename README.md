# AVA — Dashboard com Supabase (Vercel Ready)

- Vite + React + TS + Tailwind
- Supabase (Realtime) + Storage (upload de foto)
- Máscaras (CPF/CEP/Telefone)
- Roteamento por hash: `#/` (Dashboard), `#/alunos`, `#/alunos/novo`

## Rodar
1) Copie `.env.example` para `.env` e preencha:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
2) `npm install`
3) `npm run dev`

## Deploy Vercel
- Framework Preset: **Vite**
- Build: `npm run build`
- Output: `dist`
- Environment Variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

## Banco/Storage
- No Supabase → SQL Editor, rode `schema.sql` (idempotente). Cria tabelas e bucket `students` com policies.
