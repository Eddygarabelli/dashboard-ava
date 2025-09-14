
# AVA Clean V2 (Single Page)

## O que tem de novo
1. **Edição de aluno**: clique em um aluno na lista para abrir a página de detalhes, com **Editar / Salvar / Cancelar**. Atualiza no Supabase.
2. **Botões de navegação**: 
   - **Home (casinha)** fixo no cabeçalho (leva para o dashboard/aba Alunos).
   - **Voltar** em todas as páginas (retorna à anterior).
3. **Cursos**: aba **Cursos** funcional, cards limpos com **lápis** para editar título e descrição (persistidos em `localStorage`).

## Deploy no Vercel
- Framework: **Other**
- Build command: *(vazio)*
- Output directory: `.`

## Banco esperado (tabela `public.alunos`)
Colunas: `id uuid default gen_random_uuid() primary key`, `matricula text not null`, `nome text not null`,
`rg text`, `cpf text`, `email text`, `telefone text`, `datanascimento date`, `localnascimento text`,
`endereco text`, `datacadastro timestamptz not null default now()` com RLS para select/insert/update liberadas.
