/* Ambiente 2D com câmera que acompanha o personagem.
   O laço usa passo fixo (60 atualizações por segundo) com interpolação no
   desenho: o movimento fica igual em qualquer computador, rápido ou lento. */

import { estado, palavraLiberada, palavraAplicada, jogoCompleto } from './estado.js';
import { ajustes } from './acessibilidade.js';
import { som } from './som.js';
import * as arte from './desenho.js';
import { TILE } from './desenho.js';
import {
  LARGURA_MAPA, ALTURA_MAPA, COLUNAS, LINHAS,
  camadaEstatica, solido, LUGARES, refazerCamada
} from './cenario.js';

/* resolução interna do jogo; o CSS amplia sem borrar */
export const LARGURA = 480;
export const ALTURA = 288;

const PASSO = 1 / 60;                 // passo fixo da simulação
const VELOCIDADE = 58;                // pixels por segundo
const VELOCIDADE_AUTO = 78;           // um pouco mais rápido no "Ir até..."
const RAIO_INTERACAO = 30;
const SUAVIDADE_CAMERA = 0.14;

const base = (cx, cy) => ({ x: cx * TILE + TILE / 2, y: cy * TILE + TILE });

export const OBJETOS = [
  {
    id: 'prateleira', rotulo: 'Estante', artigo: 'na', alvo: 'vaso',
    ...base(LUGARES.estante.cx, LUGARES.estante.cy),
    solido: { l: 32, a: 14 }, acao: 'tarefa',
    dica: 'Aqui mora o vaso. Fale com a estante para começar.'
  },
  {
    id: 'torneira', rotulo: 'Poço', artigo: 'no', alvo: 'agua',
    ...base(LUGARES.poco.cx, LUGARES.poco.cy),
    solido: { l: 32, a: 16 }, acao: 'tarefa',
    dica: 'O poço guarda a água.'
  },
  {
    id: 'canteiro', rotulo: 'Canteiro', artigo: 'no', alvo: 'flor',
    ...base(LUGARES.canteiro.cx, LUGARES.canteiro.cy),
    solido: { l: 34, a: 12 }, acao: 'tarefa',
    dica: 'No canteiro nasce a flor.'
  },
  {
    id: 'mesa', rotulo: 'Mesa do jardim', artigo: 'na', alvo: null,
    ...base(LUGARES.mesa.cx, LUGARES.mesa.cy),
    solido: { l: 32, a: 12 }, acao: 'aplicar',
    dica: 'Leve o que está na mochila até a mesa do jardim.'
  },
  {
    id: 'nix', rotulo: 'Nix', artigo: 'com o', alvo: null,
    ...base(LUGARES.nix.cx, LUGARES.nix.cy),
    solido: null, acao: 'falar',
    dica: 'Nix explica a próxima tarefa.'
  },
  {
    id: 'porta', rotulo: 'Portão do jardim', artigo: 'no', alvo: null,
    ...base(LUGARES.portao.cx, LUGARES.portao.cy),
    solido: { l: 32, a: 10 }, acao: 'sair',
    dica: 'O portão abre quando as três palavras voltarem.'
  },
  {
    id: 'placa', rotulo: 'Placa', artigo: 'na', alvo: null,
    ...base(LUGARES.placa.cx, LUGARES.placa.cy),
    solido: { l: 16, a: 8 }, acao: 'ler',
    dica: 'Uma placa de madeira com o nome do lugar.'
  }
];

export const jogador = {
  x: 21 * TILE + 8, y: 19 * TILE,
  anteriorX: 21 * TILE + 8, anteriorY: 19 * TILE,
  direcao: 'baixo', passo: 0, andando: false,
  destino: null, rota: []
};

export const camera = { x: 0, y: 0 };

const teclas = new Set();
let ctx = null, canvas = null;
let rodando = false, bloqueado = false;
let aoInteragir = () => {}, aoAproximar = () => {};
let objetoProximo = null;
let relogio = 0, acumulado = 0, ultimoQuadro = 0;

/* ---------- colisão ---------- */

/* A caixa de colisão é só os pés: dá a sensação de profundidade dos RPGs. */
const PES = { l: 10, a: 6 };

function livrePara(x, y, margem = 0) {
  const meio = PES.l / 2 + margem;
  const cantos = [
    [x - meio, y - PES.a], [x + meio, y - PES.a],
    [x - meio, y - 1], [x + meio, y - 1]
  ];
  for (const [px, py] of cantos) {
    if (px < 4 || py < 4 || px > LARGURA_MAPA - 4 || py > ALTURA_MAPA - 4) return false;
    if (solido(Math.floor(px / TILE), Math.floor(py / TILE))) return false;
  }
  for (const o of OBJETOS) {
    if (!o.solido) continue;
    if (Math.abs(x - o.x) < o.solido.l / 2 + meio &&
        y > o.y - o.solido.a - PES.a - margem && y < o.y + 4 + margem) return false;
  }
  return true;
}

/* ---------- caminho automático (BFS na grade de tiles) ---------- */

let malha = null;

function construirMalha() {
  malha = new Uint8Array(COLUNAS * LINHAS);
  for (let cy = 0; cy < LINHAS; cy++) {
    for (let cx = 0; cx < COLUNAS; cx++) {
      malha[cy * COLUNAS + cx] = livrePara(cx * TILE + TILE / 2, cy * TILE + TILE - 4, 3) ? 0 : 1;
    }
  }
}

const livreNaMalha = (cx, cy) =>
  cx >= 0 && cy >= 0 && cx < COLUNAS && cy < LINHAS && malha[cy * COLUNAS + cx] === 0;

function celulaMaisProxima(cx, cy) {
  if (livreNaMalha(cx, cy)) return { cx, cy };
  for (let raio = 1; raio < 14; raio++) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        if (Math.abs(dx) !== raio && Math.abs(dy) !== raio) continue;
        if (livreNaMalha(cx + dx, cy + dy)) return { cx: cx + dx, cy: cy + dy };
      }
    }
  }
  return null;
}

function rotaAte(destinoX, destinoY) {
  if (!malha) construirMalha();
  const inicio = celulaMaisProxima(Math.floor(jogador.x / TILE), Math.floor((jogador.y - 4) / TILE));
  const fim = celulaMaisProxima(Math.floor(destinoX / TILE), Math.floor((destinoY - 4) / TILE));
  if (!inicio || !fim) return null;

  const anterior = new Int32Array(COLUNAS * LINHAS).fill(-1);
  const visitado = new Uint8Array(COLUNAS * LINHAS);
  const partida = inicio.cy * COLUNAS + inicio.cx;
  const alvo = fim.cy * COLUNAS + fim.cx;
  const fila = [partida];
  visitado[partida] = 1;

  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i];
    if (atual === alvo) break;
    const cx = atual % COLUNAS, cy = (atual - cx) / COLUNAS;
    for (const [vx, vy] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
      if (!livreNaMalha(vx, vy)) continue;
      const idx = vy * COLUNAS + vx;
      if (visitado[idx]) continue;
      visitado[idx] = 1;
      anterior[idx] = atual;
      fila.push(idx);
    }
  }
  if (!visitado[alvo]) return null;

  const pontos = [];
  for (let no = alvo; no !== -1; no = anterior[no]) {
    const cx = no % COLUNAS, cy = (no - cx) / COLUNAS;
    pontos.unshift({ x: cx * TILE + TILE / 2, y: cy * TILE + TILE - 4 });
    if (no === partida) break;
  }
  return enxugar(pontos);
}

function enxugar(pontos) {
  if (pontos.length < 3) return pontos;
  const limpo = [pontos[0]];
  for (let i = 1; i < pontos.length - 1; i++) {
    const a = pontos[i - 1], b = pontos[i], c = pontos[i + 1];
    const reto = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!reto) limpo.push(b);
  }
  limpo.push(pontos[pontos.length - 1]);
  return limpo;
}

function seguirRota(destinoX, destinoY, aoChegar = null) {
  const pontos = rotaAte(destinoX, destinoY);
  if (!pontos || !pontos.length) {
    jogador.rota = [];
    jogador.destino = { x: destinoX, y: destinoY, interagir: aoChegar };
    return;
  }
  pontos[pontos.length - 1].interagir = aoChegar;
  jogador.rota = pontos.slice(1);
  jogador.destino = jogador.rota.shift() || pontos[pontos.length - 1];
}

/* ---------- entrada ---------- */

export function iniciarMundo(elCanvas, manipuladores = {}) {
  canvas = elCanvas;
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  aoInteragir = manipuladores.aoInteragir || (() => {});
  aoAproximar = manipuladores.aoAproximar || (() => {});

  camadaEstatica();
  construirMalha();
  centralizarCamera(true);

  window.addEventListener('keydown', teclaBaixo);
  window.addEventListener('keyup', teclaCima);
  canvas.addEventListener('pointerdown', cliqueNoMapa);

  if (!rodando) { rodando = true; ultimoQuadro = performance.now(); requestAnimationFrame(quadro); }
}

export function pararMundo() {
  rodando = false;
  window.removeEventListener('keydown', teclaBaixo);
  window.removeEventListener('keyup', teclaCima);
  canvas?.removeEventListener('pointerdown', cliqueNoMapa);
}

export function objetoEmFoco() { return objetoProximo; }

export function bloquearJogador(v) {
  bloqueado = v;
  if (v) { teclas.clear(); jogador.destino = null; jogador.rota = []; jogador.andando = false; }
}

function teclaBaixo(e) {
  if (bloqueado) return;
  const k = e.key.toLowerCase();
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(k)) {
    teclas.add(k); jogador.destino = null; jogador.rota = []; e.preventDefault();
  }
  if (k === 'enter' || k === ' ' || k === 'e') {
    e.preventDefault();
    if (objetoProximo) aoInteragir(objetoProximo);
  }
}

function teclaCima(e) { teclas.delete(e.key.toLowerCase()); }

function cliqueNoMapa(e) {
  if (bloqueado) return;
  const r = canvas.getBoundingClientRect();
  const x = (e.clientX - r.left) * (LARGURA / r.width) + camera.x;
  const y = (e.clientY - r.top) * (ALTURA / r.height) + camera.y;
  const alvo = OBJETOS.find((o) => Math.abs(o.x - x) < 24 && y > o.y - 40 && y < o.y + 12);
  if (alvo) irAte(alvo.id, true);
  else seguirRota(x, y);
}

export function irAte(idObjeto, interagirAoChegar = false) {
  const o = OBJETOS.find((obj) => obj.id === idObjeto);
  if (!o || bloqueado) return;
  seguirRota(o.x, o.y + (o.solido ? o.solido.a + 14 : 20), interagirAoChegar ? o : null);
}

export function moverPorBotao(direcao, ativo) {
  const mapaTeclas = { cima: 'arrowup', baixo: 'arrowdown', esquerda: 'arrowleft', direita: 'arrowright' };
  if (bloqueado) return;
  jogador.destino = null; jogador.rota = [];
  if (ativo) teclas.add(mapaTeclas[direcao]); else teclas.delete(mapaTeclas[direcao]);
}

/* ---------- laço com passo fixo ---------- */

function quadro(agora) {
  if (!rodando) return;
  let dt = (agora - ultimoQuadro) / 1000;
  ultimoQuadro = agora;
  if (dt > 0.25) dt = 0.25;            // volta de uma aba em segundo plano
  acumulado += dt;
  let passos = 0;
  while (acumulado >= PASSO && passos < 5) {
    atualizar(PASSO);
    acumulado -= PASSO;
    passos++;
  }
  relogio = agora;
  desenhar(acumulado / PASSO);
  requestAnimationFrame(quadro);
}

let contadorPasso = 0;
let paradoHa = 0;
let recalculou = false;

/* Se o personagem encostar em algo e parar de avançar, o trajeto é refeito uma
   vez; persistindo, ele conclui a ida ali mesmo. A criança nunca fica presa. */
function destravar() {
  const alvo = jogador.destino?.interagir ||
               jogador.rota[jogador.rota.length - 1]?.interagir || null;
  const fim = jogador.rota.length ? jogador.rota[jogador.rota.length - 1] : jogador.destino;
  jogador.rota = [];
  jogador.destino = null;
  paradoHa = 0;
  if (!recalculou && fim) {
    recalculou = true;
    seguirRota(fim.x, fim.y, alvo);
    return;
  }
  recalculou = false;
  if (alvo) aoInteragir(alvo);
}

function atualizar(dt) {
  jogador.anteriorX = jogador.x;
  jogador.anteriorY = jogador.y;

  let dx = 0, dy = 0, velocidade = VELOCIDADE;
  if (teclas.has('arrowup') || teclas.has('w')) dy -= 1;
  if (teclas.has('arrowdown') || teclas.has('s')) dy += 1;
  if (teclas.has('arrowleft') || teclas.has('a')) dx -= 1;
  if (teclas.has('arrowright') || teclas.has('d')) dx += 1;

  if (!dx && !dy && jogador.destino) {
    const d = jogador.destino;
    const distX = d.x - jogador.x, distY = d.y - jogador.y;
    const dist = Math.hypot(distX, distY);
    if (dist < 2.5) {
      const alvo = d.interagir;
      jogador.destino = jogador.rota.length ? jogador.rota.shift() : null;
      if (!jogador.destino && alvo) aoInteragir(alvo);
    } else {
      dx = distX / dist; dy = distY / dist;
      velocidade = VELOCIDADE_AUTO;
    }
  }

  jogador.andando = !!(dx || dy);
  if (jogador.andando) {
    const n = Math.hypot(dx, dy) || 1;
    const avX = (dx / n) * velocidade * dt;
    const avY = (dy / n) * velocidade * dt;
    if (livrePara(jogador.x + avX, jogador.y)) jogador.x += avX;
    if (livrePara(jogador.x, jogador.y + avY)) jogador.y += avY;
    jogador.direcao = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'direita' : 'esquerda')
      : (dy > 0 ? 'baixo' : 'cima');
    jogador.passo += dt * 7;
    if (++contadorPasso % 26 === 0) som.passo();

    if (jogador.destino) {
      const avancou = Math.hypot(jogador.x - jogador.anteriorX, jogador.y - jogador.anteriorY);
      paradoHa = avancou < 0.05 ? paradoHa + dt : 0;
      if (paradoHa > 0.5) destravar();
    }
  } else {
    jogador.passo = 0;
    paradoHa = 0;
    if (!jogador.destino) recalculou = false;
  }

  let melhor = null, melhorDist = RAIO_INTERACAO;
  for (const o of OBJETOS) {
    const d = Math.hypot(o.x - jogador.x, o.y - jogador.y);
    if (d < melhorDist) { melhor = o; melhorDist = d; }
  }
  if (melhor !== objetoProximo) {
    objetoProximo = melhor;
    aoAproximar(melhor);
  }

  seguirCamera();
}

function centralizarCamera(imediato = false) {
  const alvoX = jogador.x - LARGURA / 2;
  const alvoY = jogador.y - ALTURA / 2 - 8;
  const limite = (v, max) => Math.max(0, Math.min(v, max));
  const cx = limite(alvoX, LARGURA_MAPA - LARGURA);
  const cy = limite(alvoY, ALTURA_MAPA - ALTURA);
  if (imediato) { camera.x = cx; camera.y = cy; }
  return { cx, cy };
}

function seguirCamera() {
  const { cx, cy } = centralizarCamera();
  /* a câmera alcança o personagem com uma leve folga; sem folga no perfil de
     baixo estímulo, onde o movimento extra atrapalha */
  const fator = ajustes.movimento ? SUAVIDADE_CAMERA : 1;
  camera.x += (cx - camera.x) * fator;
  camera.y += (cy - camera.y) * fator;
}

/* ---------- desenho ---------- */

export function objetivoAtual() {
  if (estado.mochila.length) return OBJETOS.find((o) => o.id === 'mesa');
  if (jogoCompleto()) return OBJETOS.find((o) => o.id === 'porta');
  for (const id of ['vaso', 'agua', 'flor']) {
    if (!palavraAplicada(id) && palavraLiberada(id)) return OBJETOS.find((o) => o.alvo === id);
  }
  return null;
}

function desenharObjeto(o) {
  const amb = estado.ambiente;
  switch (o.id) {
    case 'prateleira':
      arte.desenharPrateleira(ctx, o.x, o.y, 34);
      if (!palavraAplicada('vaso') && !estado.mochila.includes('vaso')) {
        arte.desenharVaso(ctx, o.x - 6, o.y - 20, 12);
      }
      break;
    case 'torneira': arte.desenharTorneira(ctx, o.x, o.y, 32); break;
    case 'canteiro': arte.desenharCanteiro(ctx, o.x, o.y, 22, { florido: amb.flor }); break;
    case 'mesa':
      arte.desenharMesa(ctx, o.x, o.y, 22);
      if (amb.vaso) arte.desenharVaso(ctx, o.x, o.y - 14, 20, { comAgua: amb.agua, comFlor: amb.flor });
      break;
    case 'nix': arte.desenharNix(ctx, o.x, o.y, 18, relogio); break;
    case 'porta': arte.desenharPorta(ctx, o.x, o.y, 36, { aberta: jogoCompleto() }); break;
    case 'placa': arte.desenharPlaca(ctx, o.x, o.y, 24, 'JARDIM'); break;
  }
}

function setaObjetivo(o) {
  const salto = ajustes.movimento ? Math.round(Math.sin(relogio / 300) * 2) : 0;
  const topo = o.y - (o.solido ? o.solido.a + 26 : 26) + salto;
  ctx.fillStyle = '#ffd60a';
  ctx.fillRect(o.x - 3, topo, 6, 4);
  ctx.fillRect(o.x - 2, topo + 4, 4, 2);
  ctx.fillRect(o.x - 1, topo + 6, 2, 2);
  ctx.fillStyle = '#8a6b00';
  ctx.fillRect(o.x - 3, topo, 1, 4);
}

function marcaInteracao(o) {
  const salto = ajustes.movimento ? Math.round(Math.sin(relogio / 220) * 1.5) : 0;
  const topo = o.y - (o.solido ? o.solido.a + 40 : 40) + salto;
  ctx.fillStyle = '#1b2430';
  ctx.fillRect(o.x - 6, topo, 12, 12);
  ctx.fillStyle = '#ffd60a';
  ctx.fillRect(o.x - 7, topo + 1, 14, 10);
  ctx.fillRect(o.x - 6, topo, 12, 12);
  ctx.fillStyle = '#1b2430';
  ctx.fillRect(o.x - 1, topo + 2, 2, 5);
  ctx.fillRect(o.x - 1, topo + 8, 2, 2);
}

function desenhar(alfa) {
  const camX = Math.round(camera.x);
  const camY = Math.round(camera.y);

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(camadaEstatica(), camX, camY, LARGURA, ALTURA, 0, 0, LARGURA, ALTURA);

  ctx.save();
  ctx.translate(-camX, -camY);

  /* posição interpolada: movimento suave mesmo com passo fixo */
  const px = jogador.anteriorX + (jogador.x - jogador.anteriorX) * alfa;
  const py = jogador.anteriorY + (jogador.y - jogador.anteriorY) * alfa;

  const alvo = objetivoAtual();
  if (alvo) setaObjetivo(alvo);

  const lista = OBJETOS
    .filter((o) => o.x > camX - 60 && o.x < camX + LARGURA + 60 &&
                   o.y > camY - 80 && o.y < camY + ALTURA + 80)
    .map((o) => ({ tipo: 'obj', o, y: o.y }));
  lista.push({ tipo: 'jogador', y: py });
  lista.sort((a, b) => a.y - b.y);

  for (const item of lista) {
    if (item.tipo === 'obj') desenharObjeto(item.o);
    else arte.desenharPersonagem(ctx, px, py, 24, estado.personagem,
      { direcao: jogador.direcao, passo: jogador.passo, escala: 1 });
  }

  if (objetoProximo && !bloqueado) marcaInteracao(objetoProximo);
  ctx.restore();
}

/* o alto contraste troca a paleta: refaz os desenhos guardados */
export function atualizarVisual() {
  arte.limparCache();
  refazerCamada();
  camadaEstatica();
}
