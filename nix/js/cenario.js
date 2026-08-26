/* Cenário: tiles em pixel art, mapa do jardim e a camada estática
   pré-renderizada. Desenhar o chão uma vez só (e depois apenas recortar a
   parte visível) é o que mantém a rolagem fluida em máquinas antigas. */

import { TILE, telaPixel, cores, spriteArvore, spriteArbusto, spritePedra, pousar } from './desenho.js';

export const COLUNAS = 44;
export const LINHAS = 28;
export const LARGURA_MAPA = COLUNAS * TILE;   // 704
export const ALTURA_MAPA = LINHAS * TILE;     // 448

export const GRAMA = 0, FLORES = 1, TERRA = 2, ROCHA = 3, ARBUSTO = 4, ARVORE = 5, PEDRA = 6;

export const mapa = new Uint8Array(COLUNAS * LINHAS);
const emb = (cx, cy) => cy * COLUNAS + cx;

export function tipo(cx, cy) {
  if (cx < 0 || cy < 0 || cx >= COLUNAS || cy >= LINHAS) return ROCHA;
  return mapa[emb(cx, cy)];
}

export function solido(cx, cy) {
  const t = tipo(cx, cy);
  return t === ROCHA || t === ARVORE || t === PEDRA;
}

/* Ruído estável por coordenada: o jardim é sempre o mesmo. */
function hash(x, y, sal = 0) {
  let h = (x * 374761393 + y * 668265263 + sal * 2246822519) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h, 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/* ---------- desenho do mapa ---------- */

function preencher(x1, y1, x2, y2, valor) {
  for (let cy = y1; cy <= y2; cy++) {
    for (let cx = x1; cx <= x2; cx++) {
      if (cx >= 0 && cy >= 0 && cx < COLUNAS && cy < LINHAS) mapa[emb(cx, cy)] = valor;
    }
  }
}

/* Faixas de terra com 2 tiles de largura. O desenho é um anel ligando os
   quatro pontos do jardim, com a entrada descendo até a mesa no centro:
   um traçado de jardim, fácil de seguir e sem cruzamentos confusos. */
function faixaH(x1, x2, y) {
  const [a, b] = x1 <= x2 ? [x1, x2] : [x2, x1];
  preencher(a, y, b, y + 1, TERRA);
}
function faixaV(x, y1, y2) {
  const [a, b] = y1 <= y2 ? [y1, y2] : [y2, y1];
  preencher(x, a, x + 1, b, TERRA);
}

export const LUGARES = {
  portao: { cx: 21, cy: 3 },
  estante: { cx: 9, cy: 8 },
  poco: { cx: 9, cy: 20 },
  canteiro: { cx: 34, cy: 20 },
  mesa: { cx: 21, cy: 14 },
  nix: { cx: 28, cy: 10 },
  placa: { cx: 31, cy: 8 }
};

function construir() {
  /* grama com manchas de flores */
  for (let cy = 0; cy < LINHAS; cy++) {
    for (let cx = 0; cx < COLUNAS; cx++) {
      mapa[emb(cx, cy)] = hash(cx, cy, 7) > 0.93 ? FLORES : GRAMA;
    }
  }

  /* muralha de rocha em volta do vale */
  preencher(0, 0, COLUNAS - 1, 3, ROCHA);
  preencher(0, LINHAS - 3, COLUNAS - 1, LINHAS - 1, ROCHA);
  preencher(0, 0, 2, LINHAS - 1, ROCHA);
  preencher(COLUNAS - 3, 0, COLUNAS - 1, LINHAS - 1, ROCHA);
  /* passagem do portão, ao norte */
  preencher(20, 2, 23, 3, GRAMA);

  /* anel do jardim ligando estante, poço, canteiro e o lado do Nix */
  faixaH(10, 34, 9);
  faixaH(10, 34, 21);
  faixaV(10, 9, 21);
  faixaV(34, 9, 21);
  /* entrada do portão até a mesa, no centro */
  faixaV(21, 4, 15);
  /* pequena praça em volta da mesa */
  preencher(19, 13, 24, 16, TERRA);

  /* clareiras em volta dos objetos, para nada nascer em cima deles */
  Object.values(LUGARES).forEach(({ cx, cy }) => {
    for (let y = cy - 2; y <= cy + 1; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        if (tipo(x, y) !== ROCHA && tipo(x, y) !== TERRA) mapa[emb(x, y)] = GRAMA;
      }
    }
  });

  /* vegetação: árvores encostadas na rocha, arbustos e pedras espalhados */
  for (let cy = 4; cy < LINHAS - 3; cy++) {
    for (let cx = 3; cx < COLUNAS - 3; cx++) {
      if (tipo(cx, cy) !== GRAMA) continue;
      const pertoDaRocha = tipo(cx - 1, cy) === ROCHA || tipo(cx + 1, cy) === ROCHA ||
                           tipo(cx, cy - 1) === ROCHA || tipo(cx, cy + 1) === ROCHA;
      const livreAoRedor = ![[-1, 0], [1, 0], [0, -1], [0, 1]]
        .some(([dx, dy]) => tipo(cx + dx, cy + dy) === TERRA);
      if (!livreAoRedor) continue;
      const r = hash(cx, cy, 21);
      /* bosques em grupos (ruído grosso) em vez de uma fileira contínua */
      const bosque = hash(Math.floor(cx / 4), Math.floor(cy / 4), 31);
      const vizinhaArvore = tipo(cx - 1, cy) === ARVORE || tipo(cx, cy - 1) === ARVORE;
      if (pertoDaRocha && bosque > 0.45 && !vizinhaArvore && r > 0.45) mapa[emb(cx, cy)] = ARVORE;
      else if (!pertoDaRocha && r > 0.985) mapa[emb(cx, cy)] = PEDRA;
      else if (r > 0.94) mapa[emb(cx, cy)] = ARBUSTO;
    }
  }

  /* nada de vegetação em cima dos lugares nem na frente deles */
  Object.values(LUGARES).forEach(({ cx, cy }) => {
    for (let y = cy - 2; y <= cy + 2; y++) {
      for (let x = cx - 2; x <= cx + 2; x++) {
        const t = tipo(x, y);
        if (t === ARVORE || t === PEDRA || t === ARBUSTO) mapa[emb(x, y)] = GRAMA;
      }
    }
  });
}

/* ---------- tiles ---------- */

function pintarGrama(ctx, ox, oy, cx, cy, c) {
  ctx.fillStyle = c.grama[0];
  ctx.fillRect(ox, oy, TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = hash(cx * TILE + x, cy * TILE + y, 3);
      if (r > 0.86) { ctx.fillStyle = c.grama[1]; ctx.fillRect(ox + x, oy + y, 1, 1); }
      else if (r < 0.10) { ctx.fillStyle = c.grama[2]; ctx.fillRect(ox + x, oy + y, 1, 1); }
    }
  }
  /* tufos de capim */
  for (let i = 0; i < 3; i++) {
    const x = Math.floor(hash(cx, cy, 40 + i) * (TILE - 3));
    const y = Math.floor(hash(cx, cy, 60 + i) * (TILE - 4));
    ctx.fillStyle = c.gramaAlta;
    ctx.fillRect(ox + x, oy + y + 1, 1, 2);
    ctx.fillRect(ox + x + 2, oy + y, 1, 3);
  }
}

function pintarFlores(ctx, ox, oy, cx, cy, c) {
  pintarGrama(ctx, ox, oy, cx, cy, c);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(hash(cx, cy, 80 + i) * (TILE - 2));
    const y = Math.floor(hash(cx, cy, 90 + i) * (TILE - 2));
    ctx.fillStyle = c.flor[i % c.flor.length];
    ctx.fillRect(ox + x, oy + y, 2, 2);
    ctx.fillStyle = '#3f7a3a';
    ctx.fillRect(ox + x, oy + y + 2, 1, 2);
  }
}

function pintarTerra(ctx, ox, oy, cx, cy, c) {
  ctx.fillStyle = c.terra[0];
  ctx.fillRect(ox, oy, TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = hash(cx * TILE + x, cy * TILE + y, 11);
      if (r > 0.88) { ctx.fillStyle = c.terra[2]; ctx.fillRect(ox + x, oy + y, 1, 1); }
      else if (r < 0.14) { ctx.fillStyle = c.terra[1]; ctx.fillRect(ox + x, oy + y, 1, 1); }
    }
  }
  /* borda pontilhada onde a terra encosta na grama */
  const vizinhos = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  vizinhos.forEach(([dx, dy], i) => {
    if (tipo(cx + dx, cy + dy) === TERRA) return;
    for (let k = 0; k < TILE; k++) {
      const px = dx === 0 ? k : (dx < 0 ? 0 : TILE - 1);
      const py = dy === 0 ? k : (dy < 0 ? 0 : TILE - 1);
      const r = hash(cx * TILE + px, cy * TILE + py, 13 + i);
      if (r > 0.35) { ctx.fillStyle = c.grama[0]; ctx.fillRect(ox + px, oy + py, 1, 1); }
      if (r > 0.75) {
        ctx.fillStyle = c.grama[1];
        ctx.fillRect(ox + px + (dx === 0 ? 0 : -dx), oy + py + (dy === 0 ? 0 : -dy), 1, 1);
      }
    }
  });
}

function pintarRocha(ctx, ox, oy, cx, cy, c) {
  const livreAbaixo = tipo(cx, cy + 1) !== ROCHA;
  const livreAcima = tipo(cx, cy - 1) !== ROCHA;
  const livreEsq = tipo(cx - 1, cy) !== ROCHA;
  const livreDir = tipo(cx + 1, cy) !== ROCHA;

  /* Tile encostado no vale = parede inteira, com estrias verticais e o topo
     iluminado. Tile no meio do maciço = platô. É o que dá altura à muralha. */
  if (livreAbaixo || livreEsq || livreDir) {
    ctx.fillStyle = c.rochaFace[0];
    ctx.fillRect(ox, oy, TILE, TILE);
    for (let x = 0; x < TILE; x++) {
      const r = hash(cx * TILE + x, cy, 17);
      if (r > 0.60) { ctx.fillStyle = c.rochaFace[1]; ctx.fillRect(ox + x, oy, 1, TILE); }
      else if (r < 0.20) { ctx.fillStyle = c.rochaFace[2]; ctx.fillRect(ox + x, oy, 1, TILE); }
    }
    /* fendas horizontais quebram a listra contínua */
    for (let y = 2; y < TILE; y += 5) {
      if (hash(cx, cy * TILE + y, 27) > 0.5) {
        ctx.fillStyle = 'rgba(80,58,30,.30)';
        ctx.fillRect(ox + Math.floor(hash(cx, y, 29) * 6), oy + y, 6, 1);
      }
    }
    /* borda superior clara: a "quina" do platô */
    ctx.fillStyle = c.rochaTopo[0];
    ctx.fillRect(ox, oy, TILE, livreAcima ? 2 : 4);
    ctx.fillStyle = c.rochaTopo[1];
    ctx.fillRect(ox, oy + (livreAcima ? 2 : 4), TILE, 1);
    if (livreAbaixo) {
      ctx.fillStyle = 'rgba(50,35,18,.35)';
      ctx.fillRect(ox, oy + TILE - 2, TILE, 2);
    }
    if (livreEsq) { ctx.fillStyle = 'rgba(50,35,18,.28)'; ctx.fillRect(ox, oy, 2, TILE); }
    if (livreDir) { ctx.fillStyle = 'rgba(50,35,18,.28)'; ctx.fillRect(ox + TILE - 2, oy, 2, TILE); }
    return;
  }

  ctx.fillStyle = c.rochaTopo[0];
  ctx.fillRect(ox, oy, TILE, TILE);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const r = hash(cx * TILE + x, cy * TILE + y, 19);
      if (r > 0.90) { ctx.fillStyle = c.rochaTopo[1]; ctx.fillRect(ox + x, oy + y, 1, 1); }
      else if (r < 0.04) { ctx.fillStyle = c.rochaFace[0]; ctx.fillRect(ox + x, oy + y, 1, 1); }
    }
  }
  if (livreAcima) {
    ctx.fillStyle = 'rgba(70,50,25,.40)';
    ctx.fillRect(ox, oy, TILE, 2);
  }
}

/* ---------- camada estática ---------- */

let camada = null;

export function camadaEstatica() {
  if (camada) return camada;
  construir();
  const { c, ctx } = telaPixel(LARGURA_MAPA, ALTURA_MAPA);
  const cor = cores();

  for (let cy = 0; cy < LINHAS; cy++) {
    for (let cx = 0; cx < COLUNAS; cx++) {
      const ox = cx * TILE, oy = cy * TILE;
      const t = tipo(cx, cy);
      if (t === ROCHA) pintarRocha(ctx, ox, oy, cx, cy, cor);
      else if (t === TERRA) pintarTerra(ctx, ox, oy, cx, cy, cor);
      else if (t === FLORES) pintarFlores(ctx, ox, oy, cx, cy, cor);
      else pintarGrama(ctx, ox, oy, cx, cy, cor);
    }
  }

  /* vegetação por cima do chão, apoiada na base do tile */
  for (let cy = 0; cy < LINHAS; cy++) {
    for (let cx = 0; cx < COLUNAS; cx++) {
      const t = tipo(cx, cy);
      const x = cx * TILE + TILE / 2, y = cy * TILE + TILE;
      if (t === ARVORE) pousar(ctx, spriteArvore(), x, y + 4);
      else if (t === ARBUSTO) pousar(ctx, spriteArbusto(), x, y);
      else if (t === PEDRA) pousar(ctx, spritePedra(), x, y);
    }
  }

  camada = c;
  return camada;
}

export function refazerCamada() { camada = null; }

/* posição em pixels do centro de um tile */
export function emPixels(cx, cy) {
  return { x: cx * TILE + TILE / 2, y: cy * TILE + TILE };
}
