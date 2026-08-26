/* Abertura narrativa visual: quadros com desenho, texto, legenda,
   narração e Libras. A criança avança no próprio ritmo — nada corre sozinho. */

import { ABERTURA, JOGO } from '../config.js';
import { ajustes, anunciar } from '../acessibilidade.js';
import { som } from '../som.js';
import { legendar, libras, botao } from '../interface.js';
import * as arte from '../desenho.js';
import { estado } from '../estado.js';

export function abrirAbertura(container, aoTerminar) {
  let indice = 0;
  container.innerHTML = '';
  container.hidden = false;

  const cena = document.createElement('section');
  cena.className = 'cena cena-abertura';
  cena.innerHTML = `
    <h1 class="cena-titulo">${JOGO.titulo}</h1>
    <p class="cena-subtitulo">${JOGO.subtitulo}</p>
    <canvas id="quadro-abertura" width="240" height="108" role="img" aria-label="Quadro da história"></canvas>
    <p class="cena-texto" id="texto-abertura"></p>
    <div class="acoes" id="acoes-abertura"></div>
    <p class="cena-passo" id="passo-abertura"></p>`;
  container.appendChild(cena);

  const tela = cena.querySelector('#quadro-abertura');
  const ctx = tela.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const texto = cena.querySelector('#texto-abertura');
  const acoes = cena.querySelector('#acoes-abertura');
  const passo = cena.querySelector('#passo-abertura');

  let animacao = 0;
  function laco(t) {
    if (container.hidden) return;
    desenharQuadro(ctx, ABERTURA[indice].cena, tela.width, tela.height, t);
    animacao = requestAnimationFrame(laco);
  }
  animacao = requestAnimationFrame(laco);

  function mostrar() {
    const q = ABERTURA[indice];
    texto.textContent = q.texto;
    passo.textContent = `Parte ${indice + 1} de ${ABERTURA.length}`;
    legendar(q.legenda);
    libras(q.libras, q.legenda);
    anunciar(q.texto);

    acoes.innerHTML = '';
    if (indice > 0) {
      acoes.appendChild(botao('Voltar', () => { indice--; som.abrir(); mostrar(); }, 'secundario'));
    }
    const ultimo = indice === ABERTURA.length - 1;
    acoes.appendChild(botao(ultimo ? 'Vamos lá!' : 'Continuar', () => {
      som.abrir();
      if (ultimo) { cancelAnimationFrame(animacao); container.hidden = true; legendar(''); aoTerminar(); }
      else { indice++; mostrar(); }
    }));
    acoes.appendChild(botao('Pular história', () => {
      cancelAnimationFrame(animacao); container.hidden = true; legendar(''); aoTerminar();
    }, 'secundario pequeno'));
    acoes.querySelector('.botao.principal').focus();
  }
  mostrar();
}

/* ---------- desenho dos quadros ---------- */

function ceu(ctx, l, a, de, para) {
  const g = ctx.createLinearGradient(0, 0, 0, a);
  g.addColorStop(0, de); g.addColorStop(1, para);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, l, a);
}

/* faixa de grama em pixels, no mesmo estilo do jardim */
function chao(ctx, l, a, noturno) {
  const altura = 22;
  const base = noturno ? ['#2f5a2c', '#3a6b36', '#274d25'] : ['#5c9440', '#6ba24a', '#528a38'];
  ctx.fillStyle = base[0];
  ctx.fillRect(0, a - altura, l, altura);
  for (let x = 0; x < l; x++) {
    for (let y = a - altura; y < a; y++) {
      const r = ((x * 37 + y * 91) % 17) / 17;
      if (r > 0.82) { ctx.fillStyle = base[1]; ctx.fillRect(x, y, 1, 1); }
      else if (r < 0.12) { ctx.fillStyle = base[2]; ctx.fillRect(x, y, 1, 1); }
    }
  }
  ctx.fillStyle = noturno ? '#4a7a44' : '#7cb356';
  ctx.fillRect(0, a - altura, l, 1);
}

function estrelas(ctx, l, a, t) {
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 34; i++) {
    /* posições embaralhadas: em progressão simples as estrelas viram riscos */
    const h = Math.imul(i + 1, 2654435761) >>> 0;
    const x = h % l;
    const y = (h >>> 9) % Math.floor(a * 0.55);
    const brilho = ajustes.movimento ? 0.35 + Math.abs(Math.sin((t + i * 300) / 900)) * 0.65 : 0.7;
    ctx.globalAlpha = brilho;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.globalAlpha = 1;
}

export function desenharQuadro(ctx, id, l, a, t) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, l, a);
  const chaoY = a - 6;
  if (id === 'noite') {
    ceu(ctx, l, a, '#0b1437', '#27407a');
    estrelas(ctx, l, a, t);
    chao(ctx, l, a, true);
    arte.desenharCanteiro(ctx, l * 0.24, chaoY, 22);
    arte.desenharMesa(ctx, l * 0.52, chaoY, 22);
    arte.desenharPorta(ctx, l * 0.82, chaoY, 36, { aberta: false });
  } else if (id === 'vento') {
    ceu(ctx, l, a, '#26304f', '#5b6f8f');
    chao(ctx, l, a, true);
    const letras = ['V', 'A', 'S', 'O', 'Á', 'G', 'U', 'A', 'F', 'L', 'O', 'R'];
    ctx.font = 'bold 10px monospace';
    letras.forEach((c, i) => {
      const desloc = ajustes.movimento ? Math.round(Math.sin((t + i * 400) / 700) * 5) : 0;
      ctx.fillStyle = `rgba(255,255,255,${0.4 + (i % 4) * 0.15})`;
      ctx.fillText(c, 14 + i * 18, 34 + desloc + (i % 3) * 9);
    });
    arte.desenharCanteiro(ctx, l * 0.28, chaoY, 22);
    arte.desenharMesa(ctx, l * 0.68, chaoY, 22);
  } else if (id === 'nix') {
    ceu(ctx, l, a, '#0b1437', '#1d3f6e');
    estrelas(ctx, l, a, t);
    chao(ctx, l, a, true);
    arte.desenharNix(ctx, l / 2, chaoY - 6, 54, t);
  } else {
    ceu(ctx, l, a, '#123b6b', '#3b7fb5');
    chao(ctx, l, a, false);
    arte.desenharNix(ctx, l * 0.32, chaoY - 4, 36, t);
    arte.desenharPersonagem(ctx, l * 0.62, chaoY, 48, estado.personagem, { direcao: 'esquerda' });
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ['VASO', 'ÁGUA', 'FLOR'].forEach((p, i) => {
      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.fillText(p, l * 0.5 + (i - 1) * 74, 20);
    });
    ctx.textAlign = 'start';
  }
}
