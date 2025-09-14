
# AVA — Dashboard (Vercel Ready)

- Vite + React + TS + Tailwind
- Supabase (Realtime) + Storage (upload de foto)
- Máscaras (CPF/CEP/Telefone)
- Roteamento por hash: `#/` (Dashboard), `#/alunos`, `#/alunos/novo`

## Como rodar
1. Copie `.env.example` para `.env` (já está pronto aqui no zip com seus valores).
2. `npm install`
3. `npm run dev`

## Deploy no Vercel
- Framework Preset: **Vite**
- Build Command: `npm run build`
- Output Directory: `dist`
- Em **Environment Variables**, adicione:
  - `VITE_SUPABASE_URL` = https://tbkmwmnxfzlsqnjgwsuo.supabase.co
  - `VITE_SUPABASE_ANON_KEY` = SUA ANON KEY
  (cole os mesmos valores do seu `.env`)

## Banco/Storage (Supabase)
Abra **SQL Editor** e rode `schema.sql` (idempotente). Ele cria as tabelas, ativa Realtime e:
- cria bucket `students` (público) se não existir
- cria policies de leitura pública e insert por `anon`

> ATENÇÃO: este `schema.sql` **não** usa `ALTER TABLE storage.objects`, evitando o erro de permissão.
