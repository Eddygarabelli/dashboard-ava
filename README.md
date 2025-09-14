
# AVA Clean (Single Page)

- Layout único (index.html) com abas internas e sem injeções de fallback.
- Integração Supabase via `supabaseClient.js` com URL/key já configuradas.
- Campos do formulário: **nome, rg, cpf, email, telefone, datanascimento, localnascimento, endereco**.
- `matricula` é gerada automaticamente no envio.
- Contador e lista carregam do Supabase.

## Deploy Vercel
- Framework: **Other**
- Build Command: *(vazio)*
- Output Directory: `.`

## Banco esperado
Tabela `public.alunos` com colunas:
`id uuid default gen_random_uuid() primary key`,
`matricula text not null`,
`nome text not null`,
`rg text`, `cpf text`, `email text`, `telefone text`,
`datanascimento date`, `localnascimento text`, `endereco text`,
`datacadastro timestamptz not null default now()`
e RLS liberada para `select`/`insert`.

