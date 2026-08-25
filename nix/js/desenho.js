/* Desenho procedural (Canvas 2D).
   O MVP não depende de arquivos de imagem: cenário, personagens e objetos são
   desenhados por código. Isso mantém o jogo leve, offline e estável nos
   computadores da escola, e permite trocar por arte definitiva depois. */

import { PERSONALIZACAO } from './config.js';
import { ajustes } from './acessibilidade.js';

export function paleta() {
  const alto = ajustes.contraste;
  const suave = ajustes.perfil === 'baixoEstimulo';
  return {
    contorno: alto ? '#000000' : 'rgba(15,23,42,.35)',
    linha: alto ? 3 : 1.5,
    piso: alto ? '#ffffff' : (suave ? '#efeae1' : '#f3e9d8'),
    pisoAlt: alto ? '#e6e6e6' : (suave ? '#e7e1d6' : '#ecdfc9'),
    parede: alto ? '#111827' : (suave ? '#9aa7b4' : '#7f93a8'),
    paredeTopo: alto ? '#374151' : (suave ? '#b6c1cc' : '#9fb2c4'),
    grama: alto ? '#0b6b2e' : (suave ? '#8fae86' : '#7fb069'),
    gramaAlt: alto ? '#0e8038' : (suave ? '#9cb994' : '#8fc07a'),
    madeira: alto ? '#4a2c12' : '#a9743f',
    madeiraClara: alto ? '#6b421d' : '#c99961',
    agua: alto ? '#0047ab' : '#3aa0e0',
    sombra: alto ? 'rgba(0,0,0,.45)' : 'rgba(15,23,42,.16)'
  };
}

function traco(ctx, cor) {
  const p = paleta();
  ctx.lineWidth = p.linha;
  ctx.strokeStyle = cor || p.contorno;
  ctx.stroke();
}

function retanguloArredondado(ctx, x, y, l, a, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + a, r);
  ctx.arcTo(x + l, y + a, x, y + a, r);
  ctx.arcTo(x, y + a, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
}

export function sombraChao(ctx, x, y, l) {
  const p = paleta();
  ctx.save();
  ctx.fillStyle = p.sombra;
  ctx.beginPath();
  ctx.ellipse(x, y, l * 0.36, l * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ---------- personagem da criança ---------- */

export function desenharPersonagem(ctx, x, y, tam, personagem, opcoes = {}) {
  const { direcao = 'baixo', passo = 0 } = opcoes;
  const pele = PERSONALIZACAO.pele[personagem.pele] || PERSONALIZACAO.pele[0];
  const cabelo = PERSONALIZACAO.cabelo[personagem.cabelo] || PERSONALIZACAO.cabelo[0];
  const roupa = PERSONALIZACAO.roupa[personagem.roupa] || PERSONALIZACAO.roupa[0];
  const penteado = PERSONALIZACAO.penteado[personagem.penteado] || 'curto';
  const acessorio = PERSONALIZACAO.acessorio[personagem.acessorio] || 'nenhum';
  const u = tam / 32;                       // unidade de desenho
  const balanco = Math.sin(passo) * 1.5 * u;

  ctx.save();
  ctx.translate(x, y);
  sombraChao(ctx, 0, tam * 0.46, tam);

  /* pernas */
  ctx.fillStyle = '#3b4453';
  ctx.fillRect(-5 * u, 8 * u + balanco * 0.4, 4 * u, 8 * u);
  ctx.fillRect(1 * u, 8 * u - balanco * 0.4, 4 * u, 8 * u);

  /* corpo */
  ctx.fillStyle = roupa;
  retanguloArredondado(ctx, -7 * u, -2 * u, 14 * u, 12 * u, 4 * u);
  ctx.fill(); traco(ctx);

  /* braços */
  ctx.fillStyle = pele;
  ctx.fillRect(-9.5 * u, 0, 3 * u, 8 * u);
  ctx.fillRect(6.5 * u, 0, 3 * u, 8 * u);

  /* cabeça */
  ctx.fillStyle = pele;
  ctx.beginPath();
  ctx.arc(0, -9 * u, 7 * u, 0, Math.PI * 2);
  ctx.fill(); traco(ctx);

  /* cabelo por penteado */
  ctx.fillStyle = cabelo;
  if (penteado === 'curto') {
    ctx.beginPath();
    ctx.arc(0, -10 * u, 7.2 * u, Math.PI, 0);
    ctx.fill();
  } else if (penteado === 'cacheado') {
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(i * 2.4 * u, -14 * u + Math.abs(i) * 0.9 * u, 2.8 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (penteado === 'trancas') {
    ctx.beginPath();
    ctx.arc(0, -10 * u, 7.2 * u, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-9.5 * u, -10 * u, 2.6 * u, 12 * u);
    ctx.fillRect(6.9 * u, -10 * u, 2.6 * u, 12 * u);
  } else { /* longo */
    ctx.beginPath();
    ctx.arc(0, -10 * u, 7.4 * u, Math.PI, 0);
    ctx.fill();
    ctx.fillRect(-7.6 * u, -10 * u, 15.2 * u, 10 * u);
    ctx.fillStyle = pele;
    ctx.beginPath();
    ctx.arc(0, -9 * u, 6 * u, 0, Math.PI * 2);
    ctx.fill();
  }

  /* rosto (só de frente e de lado — de costas fica sem rosto) */
  if (direcao !== 'cima') {
    const dx = direcao === 'esquerda' ? -1.6 * u : direcao === 'direita' ? 1.6 * u : 0;
    ctx.fillStyle = '#1f2937';
    ctx.beginPath(); ctx.arc(dx - 2.4 * u, -9.5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(dx + 2.4 * u, -9.5 * u, 1 * u, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1.2 * u;
    ctx.beginPath(); ctx.arc(dx, -6.5 * u, 2.2 * u, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }

  /* acessórios */
  if (acessorio === 'oculos') {
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 1.2 * u;
    ctx.beginPath(); ctx.arc(-2.4 * u, -9.5 * u, 2.4 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(2.4 * u, -9.5 * u, 2.4 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.2 * u, -9.5 * u); ctx.lineTo(0.2 * u, -9.5 * u); ctx.stroke();
  } else if (acessorio === 'fone') {
    ctx.fillStyle = '#334155';
    ctx.fillRect(-9 * u, -12 * u, 2.4 * u, 5 * u);
    ctx.fillRect(6.6 * u, -12 * u, 2.4 * u, 5 * u);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.arc(0, -11 * u, 8 * u, Math.PI, 0); ctx.stroke();
  } else if (acessorio === 'lenco') {
    ctx.fillStyle = '#e11d48';
    ctx.fillRect(-7 * u, -3 * u, 14 * u, 2.6 * u);
  }
  ctx.restore();
}

/* ---------- Nix, o guia luminoso ---------- */

export function desenharNix(ctx, x, y, tam, tempo = 0) {
  const u = tam / 32;
  const flutua = ajustes.movimento ? Math.sin(tempo / 420) * 3 * u : 0;
  const brilho = ajustes.movimento ? 0.5 + Math.sin(tempo / 300) * 0.12 : 0.5;
  ctx.save();
  ctx.translate(x, y + flutua);
  sombraChao(ctx, 0, tam * 0.5 - flutua, tam * 0.9);

  if (!ajustes.contraste) {
    const halo = ctx.createRadialGradient(0, 0, tam * 0.15, 0, 0, tam * 0.85);
    halo.addColorStop(0, `rgba(120,220,255,${brilho * 0.55})`);
    halo.addColorStop(1, 'rgba(120,220,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, tam * 0.85, 0, Math.PI * 2); ctx.fill();
  }

  /* corpo em gota */
  ctx.fillStyle = ajustes.contraste ? '#0b3d91' : '#2f6fd0';
  ctx.beginPath();
  ctx.moveTo(0, -12 * u);
  ctx.bezierCurveTo(9 * u, -8 * u, 9 * u, 8 * u, 0, 11 * u);
  ctx.bezierCurveTo(-9 * u, 8 * u, -9 * u, -8 * u, 0, -12 * u);
  ctx.closePath();
  ctx.fill(); traco(ctx, '#0b3d91');

  /* olhos grandes e amigáveis */
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-3 * u, -2 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3 * u, -2 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath(); ctx.arc(-3 * u, -2 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3 * u, -2 * u, 1.4 * u, 0, Math.PI * 2); ctx.fill();

  /* faísca de "código" */
  ctx.fillStyle = '#ffe066';
  ctx.font = `bold ${5 * u}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText('{ }', 0, 7 * u);
  ctx.restore();
}

/* ---------- objetos do jardim ---------- */

export function desenharVaso(ctx, x, y, tam, opcoes = {}) {
  const { comAgua = false, comFlor = false, vazio = false } = opcoes;
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  sombraChao(ctx, 0, 12 * u, tam);

  if (!vazio) {
    ctx.fillStyle = '#c2703d';
    ctx.beginPath();
    ctx.moveTo(-9 * u, -4 * u);
    ctx.lineTo(9 * u, -4 * u);
    ctx.lineTo(6 * u, 11 * u);
    ctx.lineTo(-6 * u, 11 * u);
    ctx.closePath();
    ctx.fill(); traco(ctx, '#8a4b24');
    ctx.fillStyle = '#a55c30';
    ctx.fillRect(-10 * u, -6.5 * u, 20 * u, 3.5 * u);
    traco(ctx, '#8a4b24');

    /* terra */
    ctx.fillStyle = '#5b4130';
    ctx.fillRect(-8.4 * u, -4 * u, 16.8 * u, 2.4 * u);
  }

  if (comAgua) {
    ctx.fillStyle = 'rgba(58,160,224,.75)';
    ctx.fillRect(-8 * u, -3.4 * u, 16 * u, 1.6 * u);
    ctx.fillStyle = '#3aa0e0';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(-4 * u + i * 4 * u, -5.6 * u, 1.1 * u, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (comFlor) desenharFlor(ctx, 0, -6 * u, tam * 0.95, { semVaso: true });
  ctx.restore();
}

export function desenharFlor(ctx, x, y, tam, opcoes = {}) {
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  if (!opcoes.semVaso) sombraChao(ctx, 0, 12 * u, tam * 0.7);

  ctx.strokeStyle = '#3f7d3a';
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -12 * u);
  ctx.stroke();

  ctx.fillStyle = '#4e9a45';
  ctx.beginPath();
  ctx.ellipse(-4 * u, -6 * u, 4 * u, 2 * u, -0.5, 0, Math.PI * 2);
  ctx.fill();

  const petalas = 6;
  ctx.fillStyle = '#e05c8a';
  for (let i = 0; i < petalas; i++) {
    const a = (i / petalas) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(Math.cos(a) * 4.4 * u, -12 * u + Math.sin(a) * 4.4 * u, 3.2 * u, 2.2 * u, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd166';
  ctx.beginPath(); ctx.arc(0, -12 * u, 3 * u, 0, Math.PI * 2); ctx.fill(); traco(ctx, '#c99a2e');
  ctx.restore();
}

export function desenharTorneira(ctx, x, y, tam, opcoes = {}) {
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(-2 * u, -14 * u, 4 * u, 10 * u);
  ctx.fillRect(-2 * u, -14 * u, 12 * u, 3.4 * u);
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.arc(-4 * u, -13 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
  traco(ctx, '#475569');
  if (opcoes.pingando) {
    ctx.fillStyle = '#3aa0e0';
    ctx.beginPath(); ctx.arc(9 * u, -6 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
  }
  /* balde/poça */
  ctx.fillStyle = '#a1a1aa';
  retanguloArredondado(ctx, -8 * u, -4 * u, 16 * u, 12 * u, 2 * u);
  ctx.fill(); traco(ctx, '#71717a');
  ctx.fillStyle = 'rgba(58,160,224,.85)';
  ctx.fillRect(-6.6 * u, -2 * u, 13.2 * u, 3 * u);
  ctx.restore();
}

export function desenharMesa(ctx, x, y, tam) {
  const p = paleta();
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  sombraChao(ctx, 0, 12 * u, tam * 1.3);
  ctx.fillStyle = p.madeira;
  ctx.fillRect(-5 * u, 0, 3 * u, 12 * u);
  ctx.fillRect(2 * u, 0, 3 * u, 12 * u);
  ctx.fillStyle = p.madeiraClara;
  retanguloArredondado(ctx, -16 * u, -6 * u, 32 * u, 7 * u, 2 * u);
  ctx.fill(); traco(ctx, '#7a4f22');
  ctx.restore();
}

export function desenharPrateleira(ctx, x, y, tam) {
  const p = paleta();
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = p.madeira;
  retanguloArredondado(ctx, -18 * u, -16 * u, 36 * u, 24 * u, 2 * u);
  ctx.fill(); traco(ctx, '#7a4f22');
  ctx.fillStyle = p.madeiraClara;
  ctx.fillRect(-16 * u, -8 * u, 32 * u, 2.4 * u);
  ctx.fillRect(-16 * u, 1 * u, 32 * u, 2.4 * u);
  ctx.restore();
}

export function desenharCanteiro(ctx, x, y, tam, opcoes = {}) {
  const p = paleta();
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = p.madeira;
  retanguloArredondado(ctx, -18 * u, -8 * u, 36 * u, 18 * u, 3 * u);
  ctx.fill(); traco(ctx, '#7a4f22');
  ctx.fillStyle = '#5b4130';
  ctx.fillRect(-15 * u, -5 * u, 30 * u, 12 * u);
  if (opcoes.florido) {
    desenharFlor(ctx, -8 * u, 4 * u, tam * 0.7, { semVaso: true });
    desenharFlor(ctx, 8 * u, 4 * u, tam * 0.7, { semVaso: true });
  } else {
    ctx.fillStyle = '#6b7f5a';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.ellipse(-10 * u + i * 7 * u, 2 * u, 2.4 * u, 1.4 * u, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export function desenharPorta(ctx, x, y, tam, opcoes = {}) {
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  if (opcoes.aberta && !ajustes.contraste) {
    const halo = ctx.createRadialGradient(0, 0, 2 * u, 0, 0, 22 * u);
    halo.addColorStop(0, 'rgba(255,224,102,.55)');
    halo.addColorStop(1, 'rgba(255,224,102,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, 0, 22 * u, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = opcoes.aberta ? '#ffe066' : '#6b7280';
  retanguloArredondado(ctx, -11 * u, -18 * u, 22 * u, 30 * u, 3 * u);
  ctx.fill(); traco(ctx, '#374151');
  ctx.fillStyle = '#374151';
  ctx.beginPath(); ctx.arc(6 * u, -2 * u, 1.6 * u, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function desenharPlaca(ctx, x, y, tam, texto) {
  const u = tam / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#c99961';
  retanguloArredondado(ctx, -16 * u, -12 * u, 32 * u, 14 * u, 2 * u);
  ctx.fill(); traco(ctx, '#7a4f22');
  ctx.fillStyle = '#3b2712';
  ctx.font = `bold ${6 * u}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(texto, 0, -3 * u);
  ctx.fillStyle = '#8a5a2b';
  ctx.fillRect(-2 * u, 2 * u, 4 * u, 10 * u);
  ctx.restore();
}

/* Mapa id → função de desenho, usado nas tarefas e na mochila. */
export const FIGURAS = {
  vaso: (ctx, x, y, t) => desenharVaso(ctx, x, y, t),
  agua: (ctx, x, y, t) => {
    const u = t / 32;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#3aa0e0';
    ctx.beginPath();
    ctx.moveTo(0, -13 * u);
    ctx.bezierCurveTo(10 * u, -1 * u, 7 * u, 11 * u, 0, 11 * u);
    ctx.bezierCurveTo(-7 * u, 11 * u, -10 * u, -1 * u, 0, -13 * u);
    ctx.closePath(); ctx.fill(); traco(ctx, '#1d6ea8');
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.ellipse(-3 * u, 3 * u, 2 * u, 3 * u, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  },
  flor: (ctx, x, y, t) => desenharFlor(ctx, x, y + 6 * (t / 32), t),
  sapato: (ctx, x, y, t) => {
    const u = t / 32;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#7c3aed';
    retanguloArredondado(ctx, -12 * u, -2 * u, 24 * u, 9 * u, 3 * u);
    ctx.fill(); traco(ctx, '#4c1d95');
    ctx.fillStyle = '#4c1d95'; ctx.fillRect(-12 * u, 5 * u, 24 * u, 2.4 * u);
    ctx.restore();
  },
  bola: (ctx, x, y, t) => {
    const u = t / 32;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(0, 0, 11 * u, 0, Math.PI * 2); ctx.fill(); traco(ctx, '#b45309');
    ctx.strokeStyle = '#b45309'; ctx.lineWidth = 1.6 * u;
    ctx.beginPath(); ctx.moveTo(-11 * u, 0); ctx.lineTo(11 * u, 0); ctx.stroke();
    ctx.restore();
  },
  livro: (ctx, x, y, t) => {
    const u = t / 32;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#16a34a';
    retanguloArredondado(ctx, -11 * u, -9 * u, 22 * u, 18 * u, 2 * u);
    ctx.fill(); traco(ctx, '#14532d');
    ctx.fillStyle = '#f8fafc'; ctx.fillRect(-1 * u, -9 * u, 2 * u, 18 * u);
    ctx.restore();
  },
  janela: (ctx, x, y, t) => {
    const u = t / 32;
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#bfdbfe';
    retanguloArredondado(ctx, -11 * u, -10 * u, 22 * u, 20 * u, 2 * u);
    ctx.fill(); traco(ctx, '#1e3a8a');
    ctx.strokeStyle = '#1e3a8a'; ctx.lineWidth = 2 * u;
    ctx.beginPath(); ctx.moveTo(0, -10 * u); ctx.lineTo(0, 10 * u);
    ctx.moveTo(-11 * u, 0); ctx.lineTo(11 * u, 0); ctx.stroke();
    ctx.restore();
  },
  chave: (ctx, x, y, t) => {
    const u = t / 32;
    ctx.save(); ctx.translate(x, y);
    ctx.strokeStyle = '#ca8a04'; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.arc(-5 * u, 0, 5 * u, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11 * u, 0);
    ctx.moveTo(8 * u, 0); ctx.lineTo(8 * u, 5 * u); ctx.stroke();
    ctx.restore();
  }
};

/* Devolve um <canvas> pronto com a figura pedida (usado nos cartões). */
export function figuraEmCanvas(id, tamanho = 120) {
  const c = document.createElement('canvas');
  const escala = window.devicePixelRatio || 1;
  c.width = tamanho * escala;
  c.height = tamanho * escala;
  c.style.width = tamanho + 'px';
  c.style.height = tamanho + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(escala, escala);
  const desenhar = FIGURAS[id];
  if (desenhar) desenhar(ctx, tamanho / 2, tamanho / 2, tamanho * 0.9);
  return c;
}

export function personagemEmCanvas(personagem, tamanho = 140) {
  const c = document.createElement('canvas');
  const escala = window.devicePixelRatio || 1;
  c.width = tamanho * escala;
  c.height = tamanho * escala;
  c.style.width = tamanho + 'px';
  c.style.height = tamanho + 'px';
  const ctx = c.getContext('2d');
  ctx.scale(escala, escala);
  desenharPersonagem(ctx, tamanho / 2, tamanho * 0.66, tamanho * 0.78, personagem, { direcao: 'baixo' });
  return c;
}
