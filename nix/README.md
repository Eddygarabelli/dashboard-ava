# Nix: O Código das Palavras — MVP jogável

Implementação do MVP descrito no *Pacote de Avaliação Técnica Preliminar*:
jogo educacional 2D de apoio à alfabetização, com acessibilidade, para uso em
computadores de escolas públicas.

**Como abrir:** `nix/index.html` (jogo) e `nix/professor.html` (painel do professor).
Não há build, servidor ou instalação: é HTML + CSS + JavaScript (módulos ES).
Publica junto com o AVA no Vercel/GitHub Pages.

> Em desenvolvimento local, abra por um servidor estático
> (`python3 -m http.server`), porque módulos ES não carregam via `file://`.

**Versão em arquivo único:** `nix/nix-arquivo-unico.html` reúne HTML, CSS e todo
o código num só arquivo. Serve para levar em pendrive e abrir com dois cliques
no computador da escola, sem servidor e sem internet. Para regerá-lo depois de
mexer no código: `node nix/build-arquivo-unico.mjs`. (Essa versão não inclui o
painel do professor.)

## O que está implementado (escopo do MVP)

| Item do documento | Onde está |
|---|---|
| Abertura narrativa visual | `js/cenas/abertura.js` — 4 quadros com texto, legenda, narração e Libras |
| Personalização do personagem | `js/cenas/personalizar.js` — pele, cabelo, penteado, roupa, acessório e nome |
| Exploração de ambiente 2D | `js/mundo.js` — jardim 960×576, movimento livre, colisão, profundidade |
| Interação com objetos e itens | prateleira, torneira, canteiro, mesa, portão, placa e o Nix |
| Mochila / inventário simples | `js/estado.js` + HUD em `index.html` |
| Imagens, vídeos, áudio e microanimações | `js/desenho.js` (arte procedural), `js/midia.js`, `js/som.js` |
| Tarefas centrais: VASO, ÁGUA, FLOR | `js/tarefas.js` + `js/config.js` |
| Feedback visual de progresso no ambiente | o vaso aparece na mesa, enche de água e floresce; o canteiro floresce; o portão acende |
| Encerramento previsto para o MVP | `js/cenas/encerramento.js` |

## Lógica pedagógica

Cada palavra tem **3 etapas**, sempre na mesma ordem (previsibilidade):

1. **Encontre a figura** — associação figura ↔ palavra;
2. **Monte as sílabas** — VA+SO, Á+GUA (FLOR, monossílaba, vira discriminação
   entre formas parecidas: FLOR / LORF / FROL);
3. **Monte as letras** — escrita da palavra letra a letra.

Concluídas as 3 etapas, o item vai para a **mochila**; a criança precisa
**levá-lo até a mesa do jardim** e aplicá-lo — é aí que o ambiente muda.

**Regras de bloqueio/avanço:** ÁGUA só abre depois de VASO aplicado;
FLOR só depois de VASO e ÁGUA. O portão só abre com as três palavras.

**Recuperação pedagógica:** não existe perder. Após 2 tentativas na mesma
etapa, o Nix retoma a palavra por partes (figura + sílabas + dica + áudio +
Libras) e devolve a criança à tarefa com **menos alternativas** e a peça certa
destacada. Sem tempo, sem placar, sem penalidade.

Os parâmetros ficam em `js/config.js` → `REGRAS`
(`tentativasAteApoio`, `alternativasApoio`, `tempoLimite`, `bloqueiaAvanco`).

## Acessibilidade

Perfis de um clique (⚙️ Acessibilidade): **Padrão**, **Visual/Libras**,
**Baixo estímulo** e **Baixa visão**. Cada recurso também é ajustável
separadamente e fica salvo no computador.

- **Surdos:** legendas em todas as falas, janela de Libras sempre visível
  (acima de qualquer painel), retorno visual reforçado, som dispensável.
- **Autistas / baixo estímulo:** animações reduzidas, cores suaves, sons
  curtos e discretos, sem tempo, sem surpresa sonora, objetivo sempre escrito
  na tela e uma única pista visual por vez.
- **Baixa visão:** alto contraste, texto grande, narração por voz do navegador.
- **Motora / sem uso de setas:** botão **Ir até…** leva o personagem sozinho
  até qualquer lugar do jardim (com desvio de obstáculos), além do D-pad na
  tela e do clique direto no cenário.
- **Leitor de tela:** região `aria-live`, rótulos em todos os controles,
  diálogos e painéis com `role`/`aria-modal`, navegação completa por teclado
  (setas/WASD, Enter, Esc).
- Respeita `prefers-reduced-motion` do sistema na primeira abertura.

## Painel do professor (`professor.html`)

- Prepara a sessão vinculando o **aluno do AVA** (lista carregada do Supabase
  quando disponível; se não, aceita o nome digitado).
- Mostra as sessões registradas: data, duração, palavras concluídas, acertos,
  erros e quantas vezes foi preciso apoio.
- Exporta **CSV** e imprime.
- Os dados ficam **apenas no navegador do computador** (localStorage); nada é
  enviado para fora.

## Arte, vídeo e áudio

Toda a arte do MVP é **desenhada por código** (`js/desenho.js`): o jogo roda
offline, sem baixar nada, e é leve em máquinas antigas.

Quando os materiais definitivos existirem, coloque-os em
`nix/assets/midia/` e `nix/assets/libras/` com os nomes já previstos em
`js/config.js` (`vaso.mp4`, `agua.mp4`, `flor.mp4`, …) e mude
`export const MIDIA_EXTERNA = false;` para `true`. O jogo passa a usar os
arquivos reais e mantém a figura desenhada como reserva se algum faltar.

## Mapa dos arquivos

```
nix/
  index.html          jogo
  professor.html      painel do professor
  css/nix.css         estilos + temas de acessibilidade
  js/
    config.js         conteúdo pedagógico e parâmetros das regras
    estado.js         progresso, salvamento e registro pedagógico
    acessibilidade.js perfis, legendas, narração, avisos
    som.js            sons sintetizados (Web Audio)
    desenho.js        arte procedural (personagens, objetos, figuras)
    mundo.js          mapa 2D, colisão, caminho automático, objetos
    interface.js      diálogos, painéis, legenda, janela de Libras
    midia.js          exibição integrada de figura/vídeo/áudio
    tarefas.js        as 3 etapas, acerto/erro e recuperação pedagógica
    jogo.js           montagem geral e HUD
    cenas/            abertura, personalização e encerramento
  assets/             espaço para vídeos, Libras e áudios definitivos
```

## O que este MVP ainda não inclui

Segue o item 7 do documento: não estão aqui o manual integral, os fluxos e
wireframes completos, o caderno de assets, os roteiros cena a cena nem os
vídeos/imagens finais. A estrutura está pronta para recebê-los sem reescrita
de lógica — o conteúdo pedagógico está isolado em `js/config.js`.
