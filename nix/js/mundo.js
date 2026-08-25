/* Ambiente 2D: mapa, movimentação, colisão, objetos interativos e o
   retorno visual de progresso (o jardim muda conforme as palavras voltam). */

import { estado, palavraLiberada, palavraAplicada, jogoCompleto } from './estado.js';
import { ajustes } from './acessibilidade.js';
import { som } from './som.js';
import * as arte from './desenho.js';

export const LARGURA = 960;
export const ALTURA = 576;
const TILE = 48;
const VELOCIDADE = 2.6;          // px por quadro a 60fps
const RAIO_INTERACAO = 96;

/* Objetos do jardim. `alvo` liga o objeto a uma palavra/ação. */
export const OBJETOS = [
  {
    id: 'prateleira', rotulo: 'Prateleira', x: 200, y: 170, alvo: 'vaso',
    solido: { l: 120, a: 70 }, acao: 'tarefa',
    dica: 'Aqui mora o vaso. Fale com a prateleira para começar.'
  },
  {
    id: 'torneira', rotulo: 'Torneira', x: 180, y: 420, alvo: 'agua',
    solido: { l: 100, a: 60 }, acao: 'tarefa',
    dica: 'A torneira guarda a água.'
  },
  {
    id: 'canteiro', rotulo: 'Canteiro', x: 760, y: 420, alvo: 'flor',
    solido: { l: 130, a: 60 }, acao: 'tarefa',
    dica: 'No canteiro nasce a flor.'
  },
  {
    id: 'mesa', rotulo: 'Mesa do jardim', x: 480, y: 300, alvo: null,
    solido: { l: 130, a: 60 }, acao: 'aplicar',
    dica: 'Leve o que está na mochila até a mesa do jardim.'
  },
  {
    id: 'nix', rotulo: 'Nix', x: 620, y: 200, alvo: null,
    solido: null, acao: 'falar',
    dica: 'Nix explica a próxima tarefa.'
  },
  {
    id: 'porta', rotulo: 'Portão do jardim', x: 480, y: 96, alvo: null,
    solido: { l: 90, a: 40 }, acao: 'sair',
    dica: 'O portão abre quando as três palavras voltarem.'
  },
  {
    id: 'placa', rotulo: 'Placa', x: 830, y: 190, alvo: null,
    solido: { l: 70, a: 30 }, acao: 'ler',
    dica: 'Uma placa de madeira com o nome do lugar.'
  }
];

export const jogador = {
  x: 480, y: 455, direcao: 'cima', passo: 0, andando: false,
  destino: null,  // ponto atual do trajeto
  rota: []        // pontos restantes até o alvo do "Ir até"
};

const teclas = new Set();
let ctx = null;
let canvas = null;
let tempo = 0;
let rodando = false;
let aoInteragir = () => {};
let aoAproximar = () => {};
let objetoProximo = null;
let bloqueado = false;   // durante diálogos/tarefas o jogador não anda

/* ---------- limites e colisão ---------- */

const MARGEM = { esq: TILE + 10, dir: LARGURA - TILE - 10, topo: TILE + 30, baixo: ALTURA - TILE - 6 };

function colide(x, y) {
  if (x < MARGEM.esq || x > MARGEM.dir || y < MARGEM.topo || y > MARGEM.baixo) return true;
  for (const o of OBJETOS) {
    if (!o.solido) continue;
    const meio = o.solido.a / 2;
    if (Math.abs(x - o.x) < o.solido.l / 2 + 12 && Math.abs(y - o.y) < meio + 10) return true;
  }
  return false;
}

/* ---------- caminho automático ----------
   O jogo caminha sozinho até o lugar escolhido, desviando dos móveis.
   É o que torna o "Ir até..." utilizável por quem não usa as setas. */

const CEL = 24;
const COLUNAS = Math.floor(LARGURA / CEL);
const LINHAS = Math.floor(ALTURA / CEL);
let malha = null;

function construirMalha() {
  malha = new Uint8Array(COLUNAS * LINHAS);
  for (let cy = 0; cy < LINHAS; cy++) {
    for (let cx = 0; cx < COLUNAS; cx++) {
      malha[cy * COLUNAS + cx] = colide(cx * CEL + CEL / 2, cy * CEL + CEL / 2) ? 1 : 0;
    }
  }
}

function livre(cx, cy) {
  return cx >= 0 && cy >= 0 && cx < COLUNAS && cy < LINHAS && malha[cy * COLUNAS + cx] === 0;
}

function celulaMaisProxima(cx, cy) {
  if (livre(cx, cy)) return { cx, cy };
  for (let raio = 1; raio < 12; raio++) {
    for (let dy = -raio; dy <= raio; dy++) {
      for (let dx = -raio; dx <= raio; dx++) {
        if (Math.abs(dx) !== raio && Math.abs(dy) !== raio) continue;
        if (livre(cx + dx, cy + dy)) return { cx: cx + dx, cy: cy + dy };
      }
    }
  }
  return null;
}

/* Busca em largura: caminho curto e previsível, sem custo perceptível
   num mapa deste tamanho. */
function rotaAte(destinoX, destinoY) {
  if (!malha) construirMalha();
  const inicio = celulaMaisProxima(Math.floor(jogador.x / CEL), Math.floor(jogador.y / CEL));
  const fim = celulaMaisProxima(Math.floor(destinoX / CEL), Math.floor(destinoY / CEL));
  if (!inicio || !fim) return null;

  const anterior = new Int32Array(COLUNAS * LINHAS).fill(-1);
  const visitado = new Uint8Array(COLUNAS * LINHAS);
  const fila = [inicio.cy * COLUNAS + inicio.cx];
  visitado[fila[0]] = 1;
  const alvo = fim.cy * COLUNAS + fim.cx;

  for (let i = 0; i < fila.length; i++) {
    const atual = fila[i];
    if (atual === alvo) break;
    const cx = atual % COLUNAS, cy = (atual - cx) / COLUNAS;
    const vizinhos = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
    for (const [vx, vy] of vizinhos) {
      if (!livre(vx, vy)) continue;
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
    pontos.unshift({ x: cx * CEL + CEL / 2, y: cy * CEL + CEL / 2 });
    if (no === inicio.cy * COLUNAS + inicio.cx) break;
  }
  return enxugar(pontos);
}

/* Mantém só os pontos onde o trajeto muda de direção. */
function enxugar(pontos) {
  if (pontos.length < 3) return pontos;
  const limpo = [pontos[0]];
  for (let i = 1; i < pontos.length - 1; i++) {
    const a = pontos[i - 1], b = pontos[i], c = pontos[i + 1];
    const mesmaDirecao = (a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y);
    if (!mesmaDirecao) limpo.push(b);
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
  const ultimo = pontos[pontos.length - 1];
  ultimo.interagir = aoChegar;
  jogador.rota = pontos.slice(1);
  jogador.destino = jogador.rota.shift() || ultimo;
}

/* ---------- ciclo principal ---------- */

export function iniciarMundo(elCanvas, manipuladores = {}) {
  canvas = elCanvas;
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  ctx = canvas.getContext('2d');
  aoInteragir = manipuladores.aoInteragir || (() => {});
  aoAproximar = manipuladores.aoAproximar || (() => {});

  window.addEventListener('keydown', teclaBaixo);
  window.addEventListener('keyup', teclaCima);
  canvas.addEventListener('pointerdown', cliqueNoMapa);

  construirMalha();
  if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
}

export function pararMundo() {
  rodando = false;
  window.removeEventListener('keydown', teclaBaixo);
  window.removeEventListener('keyup', teclaCima);
  canvas?.removeEventListener('pointerdown', cliqueNoMapa);
}

export function objetoEmFoco() {
  return objetoProximo;
}

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
  const x = (e.clientX - r.left) * (LARGURA / r.width);
  const y = (e.clientY - r.top) * (ALTURA / r.height);
  const alvo = OBJETOS.find((o) => Math.hypot(o.x - x, o.y - y) < 70);
  if (alvo) irAte(alvo.id, true);
  else seguirRota(x, y);
}

/* Caminho acessível: leva o personagem até o objeto sem exigir precisão
   motora nem uso do teclado direcional. */
export function irAte(idObjeto, interagirAoChegar = false) {
  const o = OBJETOS.find((obj) => obj.id === idObjeto);
  if (!o || bloqueado) return;
  const abaixo = o.y + (o.solido ? o.solido.a / 2 + 46 : 60);
  seguirRota(o.x, Math.min(abaixo, MARGEM.baixo), interagirAoChegar ? o : null);
}

export function moverPorBotao(direcao, ativo) {
  const mapa = { cima: 'arrowup', baixo: 'arrowdown', esquerda: 'arrowleft', direita: 'arrowright' };
  if (bloqueado) return;
  jogador.destino = null; jogador.rota = [];
  if (ativo) teclas.add(mapa[direcao]); else teclas.delete(mapa[direcao]);
}

function quadro(t) {
  if (!rodando) return;
  tempo = t;
  atualizar();
  desenhar();
  requestAnimationFrame(quadro);
}

let contadorPasso = 0;

function atualizar() {
  let dx = 0, dy = 0;
  if (teclas.has('arrowup') || teclas.has('w')) dy -= 1;
  if (teclas.has('arrowdown') || teclas.has('s')) dy += 1;
  if (teclas.has('arrowleft') || teclas.has('a')) dx -= 1;
  if (teclas.has('arrowright') || teclas.has('d')) dx += 1;

  if (!dx && !dy && jogador.destino) {
    const d = jogador.destino;
    const distX = d.x - jogador.x, distY = d.y - jogador.y;
    const dist = Math.hypot(distX, distY);
    if (dist < 6) {
      const alvo = d.interagir;
      jogador.destino = jogador.rota.length ? jogador.rota.shift() : null;
      if (!jogador.destino && alvo) aoInteragir(alvo);
    } else {
      dx = distX / dist; dy = distY / dist;
    }
  }

  jogador.andando = !!(dx || dy);
  if (jogador.andando) {
    const n = Math.hypot(dx, dy) || 1;
    const passoX = (dx / n) * VELOCIDADE;
    const passoY = (dy / n) * VELOCIDADE;
    if (!colide(jogador.x + passoX, jogador.y)) jogador.x += passoX;
    if (!colide(jogador.x, jogador.y + passoY)) jogador.y += passoY;
    if (Math.abs(dx) > Math.abs(dy)) jogador.direcao = dx > 0 ? 'direita' : 'esquerda';
    else jogador.direcao = dy > 0 ? 'baixo' : 'cima';
    jogador.passo += 0.22;
    if (++contadorPasso % 26 === 0) som.passo();
  } else {
    jogador.passo = 0;
  }

  /* objeto mais próximo dentro do raio de interação */
  let melhor = null, melhorDist = RAIO_INTERACAO;
  for (const o of OBJETOS) {
    const d = Math.hypot(o.x - jogador.x, o.y - jogador.y);
    if (d < melhorDist) { melhor = o; melhorDist = d; }
  }
  if (melhor !== objetoProximo) {
    objetoProximo = melhor;
    aoAproximar(melhor);
  }
}

/* ---------- desenho do cenário ---------- */

function desenharPiso() {
  const p = arte.paleta();
  for (let cy = 0; cy < ALTURA / TILE; cy++) {
    for (let cx = 0; cx < LARGURA / TILE; cx++) {
      const jardim = cy > 4;
      const alterna = (cx + cy) % 2 === 0;
      ctx.fillStyle = jardim ? (alterna ? p.grama : p.gramaAlt) : (alterna ? p.piso : p.pisoAlt);
      ctx.fillRect(cx * TILE, cy * TILE, TILE, TILE);
    }
  }
  /* caminho de pedras ligando o portão à mesa — orienta o percurso */
  ctx.fillStyle = ajustes.contraste ? '#d4d4d8' : 'rgba(214,205,186,.85)';
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(480, 150 + i * 46, 26, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function desenharParedes() {
  const p = arte.paleta();
  ctx.fillStyle = p.parede;
  ctx.fillRect(0, 0, LARGURA, TILE);
  ctx.fillRect(0, ALTURA - TILE, LARGURA, TILE);
  ctx.fillRect(0, 0, TILE, ALTURA);
  ctx.fillRect(LARGURA - TILE, 0, TILE, ALTURA);
  ctx.fillStyle = p.paredeTopo;
  ctx.fillRect(0, TILE - 8, LARGURA, 8);
  ctx.fillRect(0, ALTURA - TILE, LARGURA, 8);
}

function destaque(o) {
  /* Uma única pista visual por vez: só o próximo objetivo pulsa. */
  const pulso = ajustes.movimento ? 0.55 + Math.sin(tempo / 320) * 0.25 : 0.7;
  ctx.save();
  ctx.strokeStyle = `rgba(255,214,10,${pulso})`;
  ctx.lineWidth = ajustes.contraste ? 7 : 5;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.ellipse(o.x, o.y + 18, 68, 42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

export function objetivoAtual() {
  /* 1) tem item na mochila → levar à mesa; 2) senão, a próxima palavra liberada */
  if (estado.mochila.length) return OBJETOS.find((o) => o.id === 'mesa');
  if (jogoCompleto()) return OBJETOS.find((o) => o.id === 'porta');
  for (const id of ['vaso', 'agua', 'flor']) {
    if (!palavraAplicada(id) && palavraLiberada(id)) {
      return OBJETOS.find((o) => o.alvo === id);
    }
  }
  return null;
}

function desenharObjeto(o) {
  const amb = estado.ambiente;
  switch (o.id) {
    case 'prateleira':
      arte.desenharPrateleira(ctx, o.x, o.y, 100);
      if (!palavraAplicada('vaso') && !estado.mochila.includes('vaso')) {
        arte.desenharVaso(ctx, o.x, o.y - 14, 52);
      }
      break;
    case 'torneira':
      arte.desenharTorneira(ctx, o.x, o.y, 96, { pingando: !palavraAplicada('agua') });
      break;
    case 'canteiro':
      arte.desenharCanteiro(ctx, o.x, o.y, 110, { florido: amb.flor });
      break;
    case 'mesa':
      arte.desenharMesa(ctx, o.x, o.y, 110);
      if (amb.vaso) arte.desenharVaso(ctx, o.x, o.y - 34, 66, { comAgua: amb.agua, comFlor: amb.flor });
      break;
    case 'nix':
      arte.desenharNix(ctx, o.x, o.y, 66, tempo);
      break;
    case 'porta':
      arte.desenharPorta(ctx, o.x, o.y, 92, { aberta: jogoCompleto() });
      break;
    case 'placa':
      arte.desenharPlaca(ctx, o.x, o.y, 80, 'JARDIM');
      break;
  }
}

function desenhar() {
  desenharPiso();
  desenharParedes();

  const alvo = objetivoAtual();
  if (alvo) destaque(alvo);

  /* profundidade simples: quem está mais abaixo é desenhado por último */
  const lista = [...OBJETOS.map((o) => ({ tipo: 'obj', o, y: o.y })), { tipo: 'jogador', y: jogador.y }];
  lista.sort((a, b) => a.y - b.y);
  for (const item of lista) {
    if (item.tipo === 'obj') desenharObjeto(item.o);
    else arte.desenharPersonagem(ctx, jogador.x, jogador.y, 62, estado.personagem,
      { direcao: jogador.direcao, passo: jogador.passo });
  }

  /* marca de interação sobre o objeto próximo */
  if (objetoProximo && !bloqueado) {
    const o = objetoProximo;
    const sobe = ajustes.movimento ? Math.sin(tempo / 260) * 4 : 0;
    ctx.save();
    ctx.fillStyle = '#111827';
    ctx.strokeStyle = '#ffd60a';
    ctx.lineWidth = 3;
    const y = o.y - (o.solido ? o.solido.a : 40) - 40 + sobe;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(o.x - 22, y - 20, 44, 34, 8)
                  : ctx.rect(o.x - 22, y - 20, 44, 34);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffd60a';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', o.x, y + 5);
    ctx.restore();
  }
}
