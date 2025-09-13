# Dashboard AVA — Supabase Realtime (Vite + React + TS + Tailwind)

## Configurar local
1) Copie `.env.example` para `.env` e cole sua anon key do Supabase.
2) npm install
3) npm run dev

## Deploy Vercel
- Framework: Vite
- Install: npm install
- Build: npm run build
- Output: dist
- Em Settings > Environment Variables adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
- Faça Redeploy

## SQL para criar tabelas (SQL Editor do Supabase)
Veja no arquivo SQL abaixo (e na conversa).

## Realtime
Database > Replication > Publication `supabase_realtime` > adicione as tabelas students, courses, enrollments (se não estiverem).
