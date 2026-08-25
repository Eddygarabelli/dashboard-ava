/* Sons do jogo gerados por Web Audio — nenhum arquivo externo, funciona
   offline e nunca começa sozinho (só depois de uma ação da criança).
   No perfil de baixo estímulo os sons são mais curtos e mais suaves. */

import { ajustes } from './acessibilidade.js';

let ctx = null;

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function nota(freq, inicio, duracao, volume, tipo = 'sine') {
  const c = contexto();
  if (!c) return;
  const osc = c.createOscillator();
  const ganho = c.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(freq, c.currentTime + inicio);
  ganho.gain.setValueAtTime(0.0001, c.currentTime + inicio);
  ganho.gain.exponentialRampToValueAtTime(volume, c.currentTime + inicio + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + inicio + duracao);
  osc.connect(ganho).connect(c.destination);
  osc.start(c.currentTime + inicio);
  osc.stop(c.currentTime + inicio + duracao + 0.05);
}

function volumeBase() {
  return ajustes.perfil === 'baixoEstimulo' ? 0.06 : 0.12;
}

export const som = {
  acerto() {
    if (!ajustes.som) return;
    const v = volumeBase();
    nota(523.25, 0, 0.18, v);
    nota(659.25, 0.10, 0.20, v);
    if (ajustes.perfil !== 'baixoEstimulo') nota(783.99, 0.20, 0.28, v);
  },
  /* Erro nunca soa punitivo: é um convite a tentar de novo. */
  tentarDeNovo() {
    if (!ajustes.som) return;
    nota(392, 0, 0.16, volumeBase() * 0.8, 'triangle');
  },
  passo() {
    if (!ajustes.som || ajustes.perfil === 'baixoEstimulo') return;
    nota(180, 0, 0.05, 0.03, 'triangle');
  },
  guardar() {
    if (!ajustes.som) return;
    nota(440, 0, 0.10, volumeBase(), 'triangle');
    nota(660, 0.08, 0.14, volumeBase(), 'triangle');
  },
  abrir() {
    if (!ajustes.som) return;
    nota(330, 0, 0.12, volumeBase() * 0.9, 'sine');
  },
  conquista() {
    if (!ajustes.som) return;
    const v = volumeBase();
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(f, i * 0.12, 0.3, v));
  }
};
