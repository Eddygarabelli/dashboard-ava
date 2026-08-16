
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

## Simulador de Anatomia e Química (`simulador-bio.html`)
Laboratório virtual em **HTML Canvas + JavaScript puro** (sem bibliotecas, sem build), para aulas de
Ciências/Biologia e Química. Acesso pelo botão **⚗ Simulador de Ciências** no painel inicial.

Roteiro de uso em 3 passos:
1. **Bancada de química** – ajuste os reagentes (análogo de GLP-1 como veículo, opsonina, bloqueador de
   CD47, pH e temperatura) e clique em *Misturar composto*. A ficha mostra estabilidade, potência,
   seletividade e toxicidade.
2. **Local da aplicação** – escolha abdômen, braço ou coxa no desenho do corpo; cada via tem absorção e
   latência diferentes.
3. **Microambiente tumoral** – carregue a seringa e clique no tecido (ou use a via IV). O composto é
   absorvido, cai na circulação, sai pelo leito capilar, marca as células tumorais e ativa os macrófagos,
   que fazem a fagocitose. Clicar numa célula sem a seringa carregada mostra os dados dela.

Conceitos trabalhados: difusão, pH e estabilidade de fármacos, farmacocinética (absorção, pico,
meia-vida), janela terapêutica, dose x efeito adverso, fagocitose, opsonização, sinal CD47 e
recrutamento de monócitos.

> **Aviso pedagógico:** o modelo é fictício e simplificado. Análogos de GLP-1 são medicamentos para
> diabetes e obesidade e **não** são tratamento contra o câncer; a fagocitose e o bloqueio de CD47
> existem em pesquisa, mas aqui aparecem de forma bem simplificada, só para fins didáticos.

## Fluxo
- **Alunos** → cards → clique abre **Detalhes** com **Editar** e **Editar foto**.
- **Novo Aluno** (card verde) → Cadastro → grava em `alunos`.
- **Cursos** → **Novo Curso** → crie Anos > Componentes > Disciplinas → Salvar.
- Após salvar → **Matrículas por Disciplina**: escolha o **Ano**, marque checkboxes e **Salvar**.
