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
    <canvas id="quadro-abertura" width="720" height="320" role="img" aria-label="Quadro da história"></canvas>
    <p class="cena-texto" id="texto-abertura"></p>
    <div class="acoes" id="acoes-abertura"></div>
    <p class="cena-passo" id="passo-abertura"></p>`;
  container.appendChild(cena);

  const tela = cena.querySelector('#quadro-abertura');
  const ctx = tela.getContext('2d');
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

function chao(ctx, l, a) {
  ctx.fillStyle = ajustes.contraste ? '#0b6b2e' : '#4b7a48';
  ctx.beginPath();
  ctx.ellipse(l / 2, a + 40, l * 0.75, 90, 0, 0, Math.PI * 2);
  ctx.fill();
}

function estrelas(ctx, l, a, t) {
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % l;
    const y = (i * 53) % (a * 0.6);
    const brilho = ajustes.movimento ? 0.4 + Math.abs(Math.sin((t + i * 300) / 900)) * 0.6 : 0.7;
    ctx.globalAlpha = brilho;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.globalAlpha = 1;
}

export function desenharQuadro(ctx, id, l, a, t) {
  ctx.clearRect(0, 0, l, a);
  if (id === 'noite') {
    ceu(ctx, l, a, '#0b1437', '#27407a');
    estrelas(ctx, l, a, t);
    chao(ctx, l, a);
    arte.desenharCanteiro(ctx, l * 0.28, a - 60, 110);
    arte.desenharMesa(ctx, l * 0.62, a - 70, 110);
    arte.desenharPorta(ctx, l * 0.85, a - 110, 90);
  } else if (id === 'vento') {
    ceu(ctx, l, a, '#26304f', '#5b6f8f');
    chao(ctx, l, a);
    /* letras levadas pelo vento */
    const letras = ['V', 'A', 'S', 'O', 'Á', 'G', 'U', 'A', 'F', 'L', 'O', 'R'];
    ctx.font = 'bold 30px system-ui, sans-serif';
    letras.forEach((c, i) => {
      const desloc = ajustes.movimento ? Math.sin((t + i * 400) / 700) * 18 : 0;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + (i % 4) * 0.15})`;
      ctx.fillText(c, 60 + i * 50, 120 + desloc + (i % 3) * 26);
    });
    arte.desenharCanteiro(ctx, l * 0.3, a - 60, 110);
    arte.desenharMesa(ctx, l * 0.7, a - 70, 110);
  } else if (id === 'nix') {
    ceu(ctx, l, a, '#0b1437', '#1d3f6e');
    estrelas(ctx, l, a, t);
    chao(ctx, l, a);
    arte.desenharNix(ctx, l / 2, a * 0.45, 150, t);
  } else {
    ceu(ctx, l, a, '#123b6b', '#3b7fb5');
    chao(ctx, l, a);
    arte.desenharNix(ctx, l * 0.34, a * 0.45, 110, t);
    arte.desenharPersonagem(ctx, l * 0.62, a * 0.72, 120, estado.personagem, { direcao: 'esquerda' });
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ['VASO', 'ÁGUA', 'FLOR'].forEach((p, i) => {
      ctx.fillStyle = 'rgba(255,255,255,.92)';
      ctx.fillText(p, l * 0.5 + (i - 1) * 130, 56);
    });
    ctx.textAlign = 'start';
  }
}
