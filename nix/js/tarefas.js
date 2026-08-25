/* Tarefas pedagógicas do MVP (VASO, ÁGUA, FLOR).
   Regras adotadas:
   - sem tempo e sem pontuação punitiva;
   - o erro não bloqueia: abre a recuperação pedagógica;
   - o avanço só acontece quando a condição da tarefa é cumprida;
   - toda instrução aparece em texto, legenda, voz e Libras. */

import { PALAVRAS, ETAPAS, REGRAS } from './config.js';
import { estado, etapaConcluida, concluirEtapa, proximaEtapa, guardarNaMochila, registrar } from './estado.js';
import { anunciar, falar } from './acessibilidade.js';
import { som } from './som.js';
import { abrirPainel, fecharPainel, botao, legendar, libras, aviso } from './interface.js';
import { cartaoDaPalavra } from './midia.js';
import { figuraEmCanvas } from './desenho.js';

const DISTRATORES = ['sapato', 'bola', 'livro', 'janela', 'chave'];

function embaralhar(lista) {
  const c = [...lista];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

/* ---------- entrada ---------- */

export function abrirTarefa(palavraId, aoConcluir) {
  const palavra = PALAVRAS[palavraId];
  if (!palavra) return;
  registrar('abriu-tarefa', { palavra: palavraId });
  apresentar(palavra, aoConcluir);
}

function apresentar(palavra, aoConcluir) {
  const corpo = abrirPainel(`A palavra ${palavra.texto}`, { rotuloFechar: 'Sair da tarefa' });
  corpo.appendChild(cartaoDaPalavra(palavra));

  const acoes = document.createElement('div');
  acoes.className = 'acoes';
  const etapa = proximaEtapa(palavra.id);
  acoes.appendChild(botao(etapa ? 'Começar' : 'Continuar', () => {
    som.abrir();
    seguir(palavra, aoConcluir);
  }));
  corpo.appendChild(acoes);
  acoes.querySelector('button').focus();
}

function seguir(palavra, aoConcluir) {
  const etapa = proximaEtapa(palavra.id);
  if (!etapa) return finalizar(palavra, aoConcluir);
  if (etapa.id === 'reconhecer') etapaReconhecer(palavra, etapa, aoConcluir);
  else etapaCompor(palavra, etapa, aoConcluir);
}

/* ---------- cabeçalho comum das etapas ---------- */

function cabecalho(corpo, palavra, etapa) {
  const passo = ETAPAS.findIndex((e) => e.id === etapa.id) + 1;
  const barra = document.createElement('div');
  barra.className = 'passos';
  barra.setAttribute('aria-label', `Passo ${passo} de ${ETAPAS.length}`);
  ETAPAS.forEach((e, i) => {
    const ponto = document.createElement('span');
    ponto.className = 'passo' +
      (etapaConcluida(palavra.id, e.id) ? ' feito' : '') +
      (i === passo - 1 ? ' atual' : '');
    ponto.textContent = i + 1;
    barra.appendChild(ponto);
  });

  const instrucao = document.createElement('p');
  instrucao.className = 'instrucao';
  instrucao.textContent = etapa.instrucao(palavra);

  const ouvir = botao('🔊 Ouvir de novo',
    () => falar(etapa.instrucao(palavra), { forcar: true }), 'secundario pequeno');

  corpo.append(barra, instrucao, ouvir);
  legendar(etapa.instrucao(palavra));
  libras(palavra.midia?.libras, palavra.texto);
  anunciar(`${etapa.titulo}. ${etapa.instrucao(palavra)}`);
}

/* ---------- etapa 1: reconhecer a figura ---------- */

function etapaReconhecer(palavra, etapa, aoConcluir, apoio = false) {
  const corpo = abrirPainel(`${palavra.texto} · ${etapa.titulo}`, { rotuloFechar: 'Sair da tarefa' });
  cabecalho(corpo, palavra, etapa);

  const outras = Object.keys(PALAVRAS).filter((id) => id !== palavra.id);
  const opcoes = apoio
    ? [palavra.id, embaralhar(DISTRATORES)[0]]
    : [palavra.id, embaralhar(outras)[0], embaralhar(DISTRATORES)[0]];

  const grade = document.createElement('div');
  grade.className = 'cartoes';
  let tentativas = 0;

  embaralhar(opcoes).forEach((id) => {
    const cartao = document.createElement('button');
    cartao.className = 'cartao';
    cartao.setAttribute('aria-label', id === palavra.id ? palavra.texto : nomeFigura(id));
    cartao.appendChild(figuraEmCanvas(id, 120));
    const nome = document.createElement('span');
    nome.textContent = id === palavra.id ? palavra.texto : nomeFigura(id).toUpperCase();
    cartao.appendChild(nome);
    if (apoio && id === palavra.id) cartao.classList.add('apoio');

    cartao.addEventListener('click', () => {
      if (id === palavra.id) {
        cartao.classList.add('certo');
        acertou(palavra, etapa, aoConcluir);
      } else {
        tentativas++;
        cartao.classList.add('errado');
        cartao.disabled = true;
        errou(palavra, etapa, tentativas,
          () => etapaReconhecer(palavra, etapa, aoConcluir, true));
      }
    });
    grade.appendChild(cartao);
  });
  corpo.appendChild(grade);
  grade.querySelector('button').focus();
}

function nomeFigura(id) {
  const nomes = { sapato: 'sapato', bola: 'bola', livro: 'livro', janela: 'janela', chave: 'chave' };
  return nomes[id] || PALAVRAS[id]?.texto || id;
}

/* ---------- etapas 2 e 3: compor sílabas e letras ---------- */

function etapaCompor(palavra, etapa, aoConcluir, apoio = false) {
  const pecas = etapa.id === 'silabas' ? palavra.silabas : palavra.letras;

  /* palavra de uma sílaba só (FLOR): vira discriminação entre formas parecidas */
  if (etapa.id === 'silabas' && pecas.length === 1) {
    return etapaDiscriminar(palavra, etapa, aoConcluir, apoio);
  }

  const corpo = abrirPainel(`${palavra.texto} · ${etapa.titulo}`, { rotuloFechar: 'Sair da tarefa' });
  cabecalho(corpo, palavra, etapa);

  const linhaAlvo = document.createElement('div');
  linhaAlvo.className = 'trilho';
  const vagas = pecas.map((_, i) => {
    const vaga = document.createElement('span');
    vaga.className = 'vaga';
    vaga.textContent = '';
    vaga.setAttribute('aria-label', `Lugar ${i + 1} de ${pecas.length}`);
    linhaAlvo.appendChild(vaga);
    return vaga;
  });

  const linhaPecas = document.createElement('div');
  linhaPecas.className = 'pecas';

  let posicao = 0;
  let tentativas = 0;

  function marcarApoio() {
    linhaPecas.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('apoio', apoio && b.dataset.peca === pecas[posicao] && !b.disabled);
    });
  }

  embaralhar(pecas.map((p, i) => ({ p, i }))).forEach(({ p }) => {
    const b = document.createElement('button');
    b.className = 'peca';
    b.textContent = p;
    b.dataset.peca = p;
    b.addEventListener('click', () => {
      if (p === pecas[posicao]) {
        vagas[posicao].textContent = p;
        vagas[posicao].classList.add('preenchida');
        b.disabled = true;
        b.classList.add('usada');
        posicao++;
        falar(p);
        if (posicao === pecas.length) {
          acertou(palavra, etapa, aoConcluir);
        } else {
          som.guardar();
          marcarApoio();
        }
      } else {
        tentativas++;
        b.classList.add('errado');
        setTimeout(() => b.classList.remove('errado'), 500);
        errou(palavra, etapa, tentativas,
          () => etapaCompor(palavra, etapa, aoConcluir, true));
      }
    });
    linhaPecas.appendChild(b);
  });

  corpo.append(linhaAlvo, linhaPecas);
  marcarApoio();
  linhaPecas.querySelector('button').focus();
}

function etapaDiscriminar(palavra, etapa, aoConcluir, apoio = false) {
  const corpo = abrirPainel(`${palavra.texto} · ${etapa.titulo}`, { rotuloFechar: 'Sair da tarefa' });
  cabecalho(corpo, palavra, etapa);

  const certo = palavra.texto;
  const trocadas = [
    certo.slice(1) + certo[0],
    certo[0] + certo.slice(2) + certo[1]
  ].filter((t) => t !== certo);
  const opcoes = apoio ? [certo, trocadas[0]] : [certo, ...trocadas.slice(0, 2)];

  const linha = document.createElement('div');
  linha.className = 'pecas grandes';
  let tentativas = 0;

  embaralhar(opcoes).forEach((op) => {
    const b = document.createElement('button');
    b.className = 'peca' + (apoio && op === certo ? ' apoio' : '');
    b.textContent = op;
    b.addEventListener('click', () => {
      if (op === certo) { b.classList.add('usada'); acertou(palavra, etapa, aoConcluir); }
      else {
        tentativas++;
        b.classList.add('errado'); b.disabled = true;
        errou(palavra, etapa, tentativas, () => etapaDiscriminar(palavra, etapa, aoConcluir, true));
      }
    });
    linha.appendChild(b);
  });
  corpo.appendChild(linha);
  linha.querySelector('button').focus();
}

/* ---------- acerto, erro e recuperação ---------- */

function acertou(palavra, etapa, aoConcluir) {
  som.acerto();
  registrar('acerto', { palavra: palavra.id, etapa: etapa.id });
  concluirEtapa(palavra.id, etapa.id);
  const texto = 'Muito bem! ' + palavra.texto;
  legendar(texto);
  anunciar(texto);
  setTimeout(() => seguir(palavra, aoConcluir), 900);
}

function errou(palavra, etapa, tentativas, abrirComApoio) {
  som.tentarDeNovo();
  registrar('erro', { palavra: palavra.id, etapa: etapa.id, tentativa: tentativas });
  const texto = 'Quase! Tente outra vez.';
  legendar(texto);
  anunciar(texto);

  if (REGRAS.tentativasAteApoio && tentativas >= REGRAS.tentativasAteApoio) {
    registrar('recuperacao', { palavra: palavra.id, etapa: etapa.id });
    setTimeout(() => recuperacao(palavra, etapa, abrirComApoio), 700);
  }
}

/* Recuperação pedagógica: retoma a palavra devagar, por partes,
   e devolve a criança à tarefa com menos alternativas. */
function recuperacao(palavra, etapa, abrirComApoio) {
  const corpo = abrirPainel('Vamos juntos', { rotuloFechar: 'Sair da tarefa' });

  const linha = document.createElement('div');
  linha.className = 'apoio-linha';
  linha.appendChild(figuraEmCanvas(palavra.id, 120));

  const partes = document.createElement('div');
  partes.className = 'apoio-partes';
  const alvo = etapa.id === 'letras' ? palavra.letras : palavra.silabas;
  alvo.forEach((p, i) => {
    const s = document.createElement('span');
    s.className = 'parte';
    s.textContent = p;
    s.style.animationDelay = (i * 0.35) + 's';
    partes.appendChild(s);
  });

  const explicacao = document.createElement('p');
  explicacao.className = 'instrucao';
  explicacao.textContent = `${palavra.texto}. ${palavra.dica}`;

  linha.appendChild(partes);
  corpo.append(linha, explicacao);

  const acoes = document.createElement('div');
  acoes.className = 'acoes';
  acoes.appendChild(botao('🔊 Ouvir por partes', () => {
    falar(alvo.join(', ') + '. ' + palavra.texto, { forcar: true });
  }, 'secundario'));
  acoes.appendChild(botao('Tentar de novo', () => { som.abrir(); abrirComApoio(); }));
  corpo.appendChild(acoes);

  libras(palavra.midia?.libras, palavra.texto);
  legendar(`${palavra.texto}. ${palavra.dica}`);
  falar(`${palavra.texto}. ${alvo.join('. ')}. ${palavra.dica}`);
  acoes.querySelector('.botao.principal')?.focus();
}

/* ---------- fim da tarefa: o item vai para a mochila ---------- */

function finalizar(palavra, aoConcluir) {
  const corpo = abrirPainel('Palavra encontrada!', { rotuloFechar: 'Voltar ao jardim' });
  som.conquista();
  registrar('palavra-concluida', { palavra: palavra.id });
  guardarNaMochila(palavra.id);

  const caixa = document.createElement('div');
  caixa.className = 'conquista';
  caixa.appendChild(figuraEmCanvas(palavra.id, 150));
  const p = document.createElement('p');
  p.className = 'palavra-grande';
  p.textContent = palavra.texto;
  const aviso2 = document.createElement('p');
  aviso2.className = 'instrucao';
  aviso2.textContent = `${palavra.texto} está na sua mochila. Leve até a mesa do jardim.`;
  caixa.append(p, aviso2);
  corpo.appendChild(caixa);

  const acoes = document.createElement('div');
  acoes.className = 'acoes';
  acoes.appendChild(botao('Voltar ao jardim', () => {
    fecharPainel();
    aviso(`${palavra.texto} guardado na mochila.`);
    aoConcluir?.(palavra.id);
  }));
  corpo.appendChild(acoes);

  legendar(`${palavra.texto} está na sua mochila.`);
  anunciar(`Você encontrou a palavra ${palavra.texto}. Leve até a mesa do jardim.`);
  acoes.querySelector('button').focus();
}
