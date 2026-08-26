/* Arte em pixel art, estilo RPG 16 bits.
   Tudo é gerado por código numa resolução baixa (16×16 por tile, 16×24 para o
   personagem) e depois ampliado sem suavização — é o que dá o aspecto de
   videogame antigo e mantém o jogo leve, offline e sem arquivos de imagem.

   Cada sprite é desenhado uma única vez e fica em cache. */

import { PERSONALIZACAO } from './config.js';
import { ajustes } from './acessibilidade.js';

export const TILE = 16;          // tamanho lógico do tile
export const ESCALA = 2;         // ampliação para a tela

/* ---------- base ---------- */

export function telaPixel(largura, altura) {
  const c = document.createElement('canvas');
  c.width = largura; c.height = altura;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  return { c, ctx };
}

/* Ruído estável: o mesmo cenário em toda partida. */
export function ruido(semente) {
  let s = semente >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* Contorno escuro em volta da silhueta — leitura clara sobre qualquer fundo. */
function contornar(ctx, largura, altura, cor = '#2a2118') {
  const img = ctx.getImageData(0, 0, largura, altura);
  const px = img.data;
  const opaco = (x, y) =>
    x >= 0 && y >= 0 && x < largura && y < altura && px[(y * largura + x) * 4 + 3] > 40;
  const marcados = [];
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (opaco(x, y)) continue;
      if (opaco(x - 1, y) || opaco(x + 1, y) || opaco(x, y - 1) || opaco(x, y + 1)) {
        marcados.push([x, y]);
      }
    }
  }
  ctx.fillStyle = cor;
  marcados.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
}

const cache = new Map();
function comCache(chave, largura, altura, desenhar, opcoes = {}) {
  const id = chave + '|' + (ajustes.contraste ? 'ac' : 'n');
  if (cache.has(id)) return cache.get(id);
  const { c, ctx } = telaPixel(largura, altura);
  desenhar(ctx);
  if (opcoes.contorno !== false) contornar(ctx, largura, altura, opcoes.cor);
  cache.set(id, c);
  return c;
}

export function limparCache() { cache.clear(); }

/* Amplia um sprite mantendo os pixels quadrados. */
export function escalar(origem, tamanho) {
  const fator = Math.max(1, Math.round(tamanho / Math.max(origem.width, origem.height)));
  const { c, ctx } = telaPixel(origem.width * fator, origem.height * fator);
  ctx.drawImage(origem, 0, 0, c.width, c.height);
  c.style.width = c.width + 'px';
  c.style.height = c.height + 'px';
  return c;
}

/* Desenha um sprite com o "pé" apoiado em (x, y). */
export function pousar(ctx, sprite, x, y, escala = 1) {
  ctx.drawImage(sprite,
    Math.round(x - (sprite.width * escala) / 2),
    Math.round(y - sprite.height * escala),
    sprite.width * escala, sprite.height * escala);
}

/* ---------- paleta ---------- */

export function cores() {
  const alto = ajustes.contraste;
  return {
    contorno: alto ? '#000000' : '#2a2118',
    grama: alto ? ['#0f7a33', '#0b6b2c', '#128a3b'] : ['#5c9440', '#6ba24a', '#528a38'],
    gramaAlta: alto ? '#17a04a' : '#7cb356',
    flor: ['#e8d44d', '#e06a9b', '#f2f2f2'],
    terra: alto ? ['#ffffff', '#eeeeee', '#dddddd'] : ['#d9c48f', '#cbb47c', '#e3d1a4'],
    rochaTopo: alto ? ['#f5f5f5', '#e4e4e4'] : ['#ded0ab', '#cfbf96'],
    rochaFace: alto ? ['#5a5a5a', '#3d3d3d', '#787878'] : ['#c0a273', '#a98a5c', '#8e7047'],
    madeira: ['#a9743f', '#8a5a2b', '#c99961'],
    folha: alto ? ['#0b6b2c', '#128a3b'] : ['#3f7a3a', '#4e9a45'],
    agua: alto ? ['#0047ab', '#0066dd'] : ['#3aa0e0', '#68c1ee'],
    pedra: ['#9aa3ab', '#7d868e', '#b6bec5']
  };
}

/* ---------- personagem ---------- */

const LARG_P = 16, ALT_P = 24;

function spritePersonagem(personagem, direcao, quadro) {
  const chave = `p${personagem.pele}${personagem.cabelo}${personagem.penteado}` +
                `${personagem.roupa}${personagem.acessorio}|${direcao}|${quadro}`;
  return comCache(chave, LARG_P, ALT_P, (ctx) => {
    const pele = PERSONALIZACAO.pele[personagem.pele] || PERSONALIZACAO.pele[0];
    const cabelo = PERSONALIZACAO.cabelo[personagem.cabelo] || PERSONALIZACAO.cabelo[0];
    const roupa = PERSONALIZACAO.roupa[personagem.roupa] || PERSONALIZACAO.roupa[0];
    const penteado = PERSONALIZACAO.penteado[personagem.penteado] || 'curto';
    const acessorio = PERSONALIZACAO.acessorio[personagem.acessorio] || 'nenhum';
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    const sobe = quadro === 0 ? 0 : 0;      // o corpo fica firme; só as pernas andam
    const calca = '#3b4453';

    /* pernas (3 quadros de caminhada) */
    if (quadro === 0) {
      p(5, 19, 3, 4, calca); p(8, 19, 3, 4, calca);
      p(5, 23, 3, 1, '#2b2f38'); p(8, 23, 3, 1, '#2b2f38');
    } else if (quadro === 1) {
      p(4, 19, 3, 4, calca); p(9, 20, 3, 3, calca);
      p(4, 23, 3, 1, '#2b2f38'); p(9, 23, 3, 1, '#2b2f38');
    } else {
      p(9, 19, 3, 4, calca); p(4, 20, 3, 3, calca);
      p(9, 23, 3, 1, '#2b2f38'); p(4, 23, 3, 1, '#2b2f38');
    }

    /* tronco e braços */
    p(4, 12 + sobe, 8, 7, roupa);
    p(3, 13 + sobe, 1, 5, roupa);
    p(12, 13 + sobe, 1, 5, roupa);
    p(3, 18 + sobe, 1, 2, pele);
    p(12, 18 + sobe, 1, 2, pele);
    if (acessorio === 'lenco') p(4, 12 + sobe, 8, 2, '#e11d48');

    /* cabeça */
    p(4, 4 + sobe, 8, 8, pele);
    p(5, 12 + sobe, 6, 1, pele);

    /* cabelo */
    if (penteado === 'curto') {
      p(4, 3 + sobe, 8, 3, cabelo); p(3, 5 + sobe, 1, 3, cabelo); p(12, 5 + sobe, 1, 3, cabelo);
    } else if (penteado === 'cacheado') {
      p(3, 2 + sobe, 10, 4, cabelo); p(2, 4 + sobe, 2, 4, cabelo); p(12, 4 + sobe, 2, 4, cabelo);
      p(4, 1 + sobe, 2, 2, cabelo); p(10, 1 + sobe, 2, 2, cabelo);
    } else if (penteado === 'trancas') {
      p(4, 3 + sobe, 8, 3, cabelo);
      p(2, 5 + sobe, 2, 8, cabelo); p(12, 5 + sobe, 2, 8, cabelo);
      p(2, 13 + sobe, 2, 2, '#e8d44d'); p(12, 13 + sobe, 2, 2, '#e8d44d');
    } else {
      p(4, 3 + sobe, 8, 3, cabelo);
      p(3, 5 + sobe, 1, 10, cabelo); p(12, 5 + sobe, 1, 10, cabelo);
      p(4, 3 + sobe, 8, 2, cabelo);
    }

    /* rosto conforme a direção */
    const olho = '#2a2118';
    if (direcao === 'baixo') {
      p(6, 8 + sobe, 1, 2, olho); p(9, 8 + sobe, 1, 2, olho);
      p(7, 11 + sobe, 2, 1, '#c98c7a');
    } else if (direcao === 'esquerda') {
      p(5, 8 + sobe, 1, 2, olho);
      p(4, 8 + sobe, 1, 1, pele);
    } else if (direcao === 'direita') {
      p(10, 8 + sobe, 1, 2, olho);
    }

    /* acessórios */
    if (acessorio === 'oculos') {
      p(5, 8 + sobe, 2, 2, '#f2f2f2'); p(9, 8 + sobe, 2, 2, '#f2f2f2');
      p(7, 9 + sobe, 2, 1, '#2a2118');
      p(5, 8 + sobe, 2, 1, '#2a2118'); p(9, 8 + sobe, 2, 1, '#2a2118');
    } else if (acessorio === 'fone') {
      p(2, 4 + sobe, 2, 5, '#334155'); p(12, 4 + sobe, 2, 5, '#334155');
      p(4, 2 + sobe, 8, 1, '#334155');
    }
  });
}

export function desenharPersonagem(ctx, x, y, tam, personagem, opcoes = {}) {
  const { direcao = 'baixo', passo = 0, escala = null, semSombra = false } = opcoes;
  const quadro = passo ? (Math.floor(passo) % 2 === 0 ? 1 : 2) : 0;
  const sprite = spritePersonagem(personagem, direcao, quadro);
  const fator = escala || Math.max(1, Math.round(tam / ALT_P));
  if (!semSombra) sombra(ctx, x, y, LARG_P * fator * 0.55);
  pousar(ctx, sprite, x, y, fator);
}

export function personagemEmCanvas(personagem, tamanho = 140) {
  return escalar(spritePersonagem(personagem, 'baixo', 0), tamanho);
}

export function sombra(ctx, x, y, largura) {
  ctx.save();
  ctx.fillStyle = 'rgba(20,30,15,.28)';
  ctx.beginPath();
  ctx.ellipse(Math.round(x), Math.round(y) - 1, largura / 2, Math.max(2, largura / 5), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- Nix ---------- */

function spriteNix(quadro) {
  return comCache('nix' + quadro, 16, 18, (ctx) => {
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    const corpo = ajustes.contraste ? '#0b3d91' : '#2f6fd0';
    const claro = ajustes.contraste ? '#1e5fd0' : '#57a0ee';
    const y0 = quadro;
    p(6, 1 + y0, 4, 2, claro);
    p(4, 3 + y0, 8, 3, corpo);
    p(3, 6 + y0, 10, 6, corpo);
    p(4, 12 + y0, 8, 3, corpo);
    p(5, 15 + y0, 6, 1, corpo);
    p(4, 6 + y0, 3, 3, '#ffffff'); p(9, 6 + y0, 3, 3, '#ffffff');
    p(5, 7 + y0, 1, 2, '#12203a'); p(10, 7 + y0, 1, 2, '#12203a');
    p(6, 11 + y0, 1, 1, '#ffe066'); p(9, 11 + y0, 1, 1, '#ffe066');
    p(7, 12 + y0, 2, 1, '#ffe066');
    p(3, 8 + y0, 1, 3, claro); p(12, 8 + y0, 1, 3, claro);
  });
}

export function desenharNix(ctx, x, y, tam, tempo = 0) {
  const fator = Math.max(1, Math.round(tam / 18));
  const quadro = ajustes.movimento ? Math.round(Math.sin(tempo / 420) * 1.5) + 1 : 1;
  sombra(ctx, x, y, 10 * fator);
  if (!ajustes.contraste) {
    const raio = 14 * fator;
    const brilho = ajustes.movimento ? 0.30 + Math.sin(tempo / 300) * 0.08 : 0.30;
    const halo = ctx.createRadialGradient(x, y - 8 * fator, 2, x, y - 8 * fator, raio);
    halo.addColorStop(0, `rgba(130,215,255,${brilho})`);
    halo.addColorStop(1, 'rgba(130,215,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(x, y - 8 * fator, raio, 0, Math.PI * 2); ctx.fill();
  }
  pousar(ctx, spriteNix(quadro), x, y, fator);
}

/* ---------- objetos do jardim ---------- */

function spriteVaso({ comAgua = false, comFlor = false } = {}) {
  return comCache(`vaso${comAgua ? 'a' : ''}${comFlor ? 'f' : ''}`, 16, 20, (ctx) => {
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    if (comFlor) {
      p(7, 0, 2, 8, '#3f7a3a');
      p(4, 1, 2, 2, '#e05c8a'); p(10, 1, 2, 2, '#e05c8a');
      p(6, 0, 4, 1, '#e05c8a'); p(6, 4, 4, 1, '#e05c8a');
      p(6, 1, 4, 3, '#ee85ab'); p(7, 2, 2, 1, '#ffd166');
      p(9, 6, 3, 2, '#4e9a45');
    }
    p(2, 8, 12, 3, '#a55c30');
    p(3, 11, 10, 8, '#c2703d');
    p(4, 11, 8, 1, '#5b4130');
    p(5, 13, 1, 5, '#d98a5c');
    if (comAgua) { p(4, 11, 8, 1, '#3aa0e0'); p(5, 10, 2, 1, '#68c1ee'); }
  });
}

export function desenharVaso(ctx, x, y, tam, opcoes = {}) {
  const fator = Math.max(1, Math.round(tam / 20));
  sombra(ctx, x, y, 12 * fator);
  pousar(ctx, spriteVaso(opcoes), x, y, fator);
}

function spriteFlor() {
  return comCache('flor', 16, 16, (ctx) => {
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(7, 6, 2, 10, '#3f7a3a');
    p(4, 9, 3, 2, '#4e9a45'); p(9, 11, 3, 2, '#4e9a45');
    p(6, 1, 4, 2, '#e05c8a'); p(4, 3, 8, 4, '#ee85ab');
    p(3, 4, 2, 2, '#e05c8a'); p(11, 4, 2, 2, '#e05c8a');
    p(6, 7, 4, 1, '#e05c8a');
    p(6, 3, 4, 3, '#ffd166'); p(7, 4, 2, 1, '#e0a020');
  });
}

export function desenharFlor(ctx, x, y, tam, opcoes = {}) {
  const fator = Math.max(1, Math.round(tam / 16));
  if (!opcoes.semSombra) sombra(ctx, x, y, 9 * fator);
  pousar(ctx, spriteFlor(), x, y, fator);
}

function spriteGota() {
  return comCache('gota', 16, 16, (ctx) => {
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(7, 1, 2, 3, '#68c1ee');
    p(6, 4, 4, 2, '#3aa0e0'); p(5, 6, 6, 4, '#3aa0e0');
    p(4, 8, 8, 5, '#2f8fd8'); p(5, 13, 6, 2, '#2f8fd8');
    p(6, 9, 2, 3, '#a5dcf5');
  });
}

function spritePoco() {
  return comCache('poco', 32, 32, (ctx) => {
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    const c = cores();
    p(4, 18, 24, 12, c.pedra[1]);
    p(4, 16, 24, 3, c.pedra[2]);
    p(6, 19, 20, 8, '#2f8fd8');
    p(7, 20, 18, 2, '#68c1ee');
    for (let i = 0; i < 5; i++) p(5 + i * 5, 22, 3, 5, c.pedra[0]);
    p(6, 4, 3, 14, c.madeira[1]); p(23, 4, 3, 14, c.madeira[1]);
    p(4, 1, 24, 4, c.madeira[0]);
    p(4, 0, 24, 2, c.madeira[2]);
    p(15, 5, 2, 7, '#6b7280');
    p(12, 11, 8, 5, c.pedra[0]);
    p(13, 12, 6, 3, '#3aa0e0');
  });
}

export function desenharTorneira(ctx, x, y, tam, opcoes = {}) {
  const fator = Math.max(1, Math.round(tam / 32));
  sombra(ctx, x, y, 24 * fator);
  pousar(ctx, spritePoco(), x, y, fator);
}

function spriteMesa() {
  return comCache('mesa', 32, 22, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(6, 12, 4, 10, c.madeira[1]); p(22, 12, 4, 10, c.madeira[1]);
    p(2, 6, 28, 6, c.madeira[0]);
    p(2, 5, 28, 2, c.madeira[2]);
    for (let i = 0; i < 4; i++) p(5 + i * 7, 8, 5, 1, c.madeira[1]);
  });
}

export function desenharMesa(ctx, x, y, tam) {
  const fator = Math.max(1, Math.round(tam / 22));
  sombra(ctx, x, y, 28 * fator);
  pousar(ctx, spriteMesa(), x, y, fator);
}

function spriteEstante() {
  return comCache('estante', 32, 34, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(2, 2, 28, 32, c.madeira[1]);
    p(4, 4, 24, 12, '#7a5230'); p(4, 18, 24, 12, '#7a5230');
    p(2, 15, 28, 3, c.madeira[0]); p(2, 29, 28, 3, c.madeira[0]);
    p(2, 0, 28, 3, c.madeira[2]);
    p(6, 6, 5, 9, '#8a6a45'); p(12, 8, 4, 7, '#9c7a52');
    p(19, 20, 6, 9, '#8a6a45');
  });
}

export function desenharPrateleira(ctx, x, y, tam) {
  const fator = Math.max(1, Math.round(tam / 34));
  sombra(ctx, x, y, 28 * fator);
  pousar(ctx, spriteEstante(), x, y, fator);
}

function spriteCanteiro(florido) {
  return comCache('canteiro' + (florido ? 'f' : ''), 34, 22, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(1, 6, 32, 16, c.madeira[1]);
    p(1, 5, 32, 3, c.madeira[2]);
    p(3, 9, 28, 11, '#6b4f36');
    p(4, 10, 26, 2, '#5b4130');
    if (florido) {
      [4, 12, 20, 26].forEach((x, i) => {
        p(x + 2, 12, 1, 6, '#3f7a3a');
        p(x, 9, 5, 4, i % 2 ? '#e05c8a' : '#e8d44d');
        p(x + 1, 10, 3, 2, '#ffd166');
      });
    } else {
      [5, 13, 21, 27].forEach((x) => { p(x, 14, 4, 2, '#4e7a3a'); p(x + 1, 12, 2, 2, '#4e7a3a'); });
    }
  });
}

export function desenharCanteiro(ctx, x, y, tam, opcoes = {}) {
  const fator = Math.max(1, Math.round(tam / 22));
  sombra(ctx, x, y, 30 * fator);
  pousar(ctx, spriteCanteiro(opcoes.florido), x, y, fator);
}

function spritePortao(aberta) {
  return comCache('portao' + (aberta ? 'a' : ''), 32, 36, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(0, 4, 4, 32, c.pedra[1]); p(28, 4, 4, 32, c.pedra[1]);
    p(0, 2, 4, 3, c.pedra[2]); p(28, 2, 4, 3, c.pedra[2]);
    p(2, 0, 28, 4, c.madeira[1]);
    if (aberta) {
      p(4, 6, 24, 30, '#f6e39a');
      p(6, 8, 20, 26, '#ffe066');
      p(10, 12, 12, 18, '#fff4c2');
    } else {
      p(4, 6, 24, 30, c.madeira[1]);
      for (let i = 0; i < 4; i++) p(5 + i * 6, 7, 4, 28, c.madeira[0]);
      p(4, 18, 24, 3, c.madeira[2]);
      p(20, 22, 3, 3, '#6b7280');
    }
  });
}

export function desenharPorta(ctx, x, y, tam, opcoes = {}) {
  const fator = Math.max(1, Math.round(tam / 36));
  pousar(ctx, spritePortao(opcoes.aberta), x, y, fator);
}

function spritePlaca(texto) {
  return comCache('placa' + texto, 26, 24, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(11, 12, 4, 12, c.madeira[1]);
    p(1, 2, 24, 11, c.madeira[0]);
    p(1, 1, 24, 2, c.madeira[2]);
    ctx.fillStyle = '#4a3116';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(texto, 13, 10);
  });
}

export function desenharPlaca(ctx, x, y, tam, texto) {
  const fator = Math.max(1, Math.round(tam / 24));
  pousar(ctx, spritePlaca(texto), x, y, fator);
}

/* ---------- vegetação e pedras do cenário ---------- */

export function spriteArvore() {
  return comCache('arvore', 32, 40, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(13, 26, 6, 14, '#7a5230');
    p(13, 26, 2, 14, '#96683f');
    p(4, 6, 24, 20, c.folha[0]);
    p(2, 12, 28, 10, c.folha[0]);
    p(8, 2, 16, 8, c.folha[0]);
    p(7, 8, 14, 10, c.folha[1]);
    p(10, 5, 8, 5, c.folha[1]);
    p(6, 20, 8, 4, c.folha[1]);
  });
}

export function spriteArbusto() {
  return comCache('arbusto', 16, 14, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(2, 4, 12, 10, c.folha[0]);
    p(4, 2, 8, 4, c.folha[1]);
    p(5, 5, 5, 4, c.folha[1]);
  });
}

export function spritePedra() {
  return comCache('pedra', 16, 14, (ctx) => {
    const c = cores();
    const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
    p(2, 6, 12, 8, c.pedra[1]);
    p(4, 3, 8, 5, c.pedra[0]);
    p(5, 4, 4, 3, c.pedra[2]);
  });
}

/* ---------- figuras usadas nas tarefas ---------- */

function spriteSimples(id) {
  const desenhos = {
    sapato: (ctx) => {
      const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
      p(2, 8, 12, 5, '#7c3aed'); p(3, 5, 6, 4, '#8b5cf6');
      p(2, 12, 12, 2, '#4c1d95'); p(4, 6, 4, 1, '#c4b5fd');
    },
    bola: (ctx) => {
      const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
      p(4, 2, 8, 12, '#f59e0b'); p(2, 4, 12, 8, '#f59e0b');
      p(2, 7, 12, 2, '#b45309'); p(7, 4, 2, 8, '#b45309');
      p(5, 3, 3, 2, '#fcd34d');
    },
    livro: (ctx) => {
      const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
      p(2, 2, 12, 12, '#16a34a'); p(7, 2, 2, 12, '#14532d');
      p(3, 4, 4, 8, '#f8fafc'); p(9, 4, 4, 8, '#f8fafc');
    },
    janela: (ctx) => {
      const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
      p(1, 2, 14, 12, '#8a5a2b'); p(3, 4, 10, 8, '#9fd8f5');
      p(7, 4, 2, 8, '#8a5a2b'); p(3, 7, 10, 2, '#8a5a2b');
      p(4, 5, 2, 2, '#e0f2fe');
    },
    chave: (ctx) => {
      const p = (x, y, l, a, cor) => { ctx.fillStyle = cor; ctx.fillRect(x, y, l, a); };
      p(2, 5, 5, 5, '#eab308'); p(3, 6, 3, 3, '#8a5a2b');
      p(7, 7, 7, 2, '#eab308'); p(11, 9, 2, 3, '#eab308');
    }
  };
  return comCache('fig' + id, 16, 16, desenhos[id] || (() => {}));
}

export const FIGURAS = {
  vaso: () => spriteVaso(),
  agua: () => spriteGota(),
  flor: () => spriteFlor(),
  sapato: () => spriteSimples('sapato'),
  bola: () => spriteSimples('bola'),
  livro: () => spriteSimples('livro'),
  janela: () => spriteSimples('janela'),
  chave: () => spriteSimples('chave')
};

export function figuraEmCanvas(id, tamanho = 120) {
  const fabrica = FIGURAS[id];
  if (!fabrica) return telaPixel(tamanho, tamanho).c;
  return escalar(fabrica(), tamanho);
}
