# Projeto PSS — Processo Seletivo Simplificado SEED/PR

Repositório de documentos e anotações do **PSS da Secretaria de Estado da Educação do Paraná (SEED/PR)**,
regido pelo **Edital n.º 52/2026 – GS/SEED**, de 21 de julho de 2026 (protocolo n.º 26.163.559-3),
para contratação temporária de Professor e Professor Pedagogo no ano letivo de 2027.

## Documentos arquivados

| Documento | Assunto | Assinatura | Arquivo |
|---|---|---|---|
| Edital n.º 55/2026 – GS/SEED | Retifica o Edital 52/2026: quadros de títulos (8.6.1 e 8.6.2), Anexo 1.1 (Descrição de Ofertas – Grupo 3, escolas bilíngues para surdos), Anexo 1.2 (Locais de Ofertas – Educação Profissional, Grupo 13) e Anexo 1.3 (Escolaridade Obrigatória) | 24/07/2026 | [PDF](editais/edital-55-2026-gsseed-retificacao.pdf) · [texto](editais/txt/edital-55-2026-gsseed-retificacao.txt) |
| Edital n.º 64/2026 – GS/SEED | Retifica o Edital 52/2026: Grupo 4 do Anexo 1.1 (Descrição de Ofertas) e Grupo 4 do Anexo 1.3 (Escolaridade Obrigatória) — escolas das ilhas, assentamentos, itinerantes e Casa Familiar Rural | 17/08/2026 | [PDF](editais/edital-64-2026-gsseed-retificacao.pdf) · [texto](editais/txt/edital-64-2026-gsseed-retificacao.txt) |

Os arquivos `.txt` em `editais/txt/` são a extração de texto dos PDFs (feita com `pypdf`), para permitir
busca por palavra-chave via `grep`. O PDF assinado é sempre a fonte oficial.

Autenticidade dos documentos: https://www.eprotocolo.pr.gov.br/spiweb/validarDocumento
- Edital 55/2026 — código `d0b1bbacdc41b45ab01bbffc96564a00`
- Edital 64/2026 — código `3b54b05d7434bbc5e8f8a81c42d43281`

## Etapas do PSS 52/2026

Organização: **NC/UFPR** em conjunto com a SEED/PR.

1. **Prova objetiva** — classificatória e eliminatória, 40 questões / 40 pontos. Aplicação prevista para 18/10/2026.
2. **Prova de títulos** — classificatória, até 20 pontos (quadro retificado pelo Edital 55/2026, incluindo
   4,0 pontos pela Prova Nacional Docente e 2,0 pela formação em Magistério).
3. **Prova prática** — classificatória, até 30 pontos: **plano de aula escrito + vídeo** da própria aula simulada.
4. **Tempo de serviço** — até 10 pontos.

## Prova prática — plano de aula

- O tema **deve** ser escolhido entre os listados no **Anexo XIV** do Edital 52/2026 (o mesmo anexo traz os
  conteúdos da prova objetiva e da prova prática), na seção do componente curricular da inscrição.
- O plano deve ser preenchido no **modelo do Anexo XV**: objeto de conhecimento, conteúdo, objetivo de
  aprendizagem, encaminhamentos metodológicos e recursos.
- Objeto de conhecimento e conteúdo saem do documento curricular da etapa
  (Currículo da Rede Estadual Paranaense / Referencial Curricular do Paraná).
- **Vídeo:** formato MP4, até 200 MB. Vídeo com menos de 10 minutos **zera** a prova prática.
- Critérios de avaliação: domínio do conteúdo, organização didática, clareza, gestão do tempo,
  comunicação verbal e coerência entre o documento escrito e a aula simulada.

> O **Anexo XIV ainda não está arquivado aqui**. Ele está no PDF completo do Edital 52/2026 (329 páginas).
> Ao baixá-lo, salvar em `editais/` e registrar os temas do componente de interesse em `temas/`.

## Prazos (conferir sempre no edital e nas retificações)

| Etapa | Prazo |
|---|---|
| Inscrições | 27/07 a 27/08/2026 (prorrogado) |
| Envio de títulos e da prova prática (plano de aula + vídeo) | até 02/09/2026 (prorrogado) |
| Prova objetiva | 18/10/2026 |

## Links oficiais

- Edital n.º 52/2026 – GS/SEED (íntegra, PDF): https://www.parana.pr.gov.br/sites/novo-parana/arquivos_restritos/files/documento/2026-07/edital52026_gsseed_prot261635593_pss_contratacao_temporaria_0.pdf
- Portal do PSS: https://pss.pr.gov.br
- NC/UFPR: https://www.nc.ufpr.br
- Currículo da Rede Estadual Paranaense — Língua Inglesa (Anos Finais): https://www.educacao.pr.gov.br/sites/default/arquivos_restritos/files/documento/2021-05/crep_lingua_inglesa_2021_anosfinais.pdf
- Referencial Curricular do Paraná — Língua Inglesa: https://www.referencialcurriculardoparana.pr.gov.br/Lingua-Inglesa-6o-Ano

## Estrutura

```
pss/
├── README.md
└── editais/
    ├── edital-55-2026-gsseed-retificacao.pdf
    ├── edital-64-2026-gsseed-retificacao.pdf
    └── txt/
        ├── edital-55-2026-gsseed-retificacao.txt
        └── edital-64-2026-gsseed-retificacao.txt
```
