/* Recursos de acessibilidade do Nix.
   Princípios adotados: previsibilidade, redundância de canais (visual + som +
   texto + Libras), ausência de tempo e nenhuma penalização por erro. */

import { CHAVES, PERFIS } from './config.js';

const padrao = {
  perfil: 'padrao',
  som: true,
  voz: true,
  legenda: true,
  libras: false,
  movimento: true,     // false = reduzir animações
  contraste: false,
  textoGrande: false
};

export const ajustes = carregar();

function carregar() {
  let salvo = {};
  try {
    salvo = JSON.parse(localStorage.getItem(CHAVES.ajustes) || '{}');
  } catch { salvo = {}; }
  const base = Object.assign({}, padrao, salvo);
  /* respeita a preferência do sistema operacional na primeira abertura */
  if (salvo.movimento === undefined &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    base.movimento = false;
  }
  return base;
}

export function salvarAjustes() {
  try { localStorage.setItem(CHAVES.ajustes, JSON.stringify(ajustes)); } catch {}
  aplicar();
}

export function definirAjuste(chave, valor) {
  ajustes[chave] = valor;
  salvarAjustes();
}

export function aplicarPerfil(id) {
  const perfil = PERFIS[id];
  if (!perfil) return;
  Object.assign(ajustes, perfil.ajustes, { perfil: id });
  salvarAjustes();
}

/* Reflete os ajustes no documento — o CSS reage aos atributos data-*. */
export function aplicar() {
  const raiz = document.documentElement;
  raiz.dataset.contraste = ajustes.contraste ? 'alto' : 'normal';
  raiz.dataset.movimento = ajustes.movimento ? 'normal' : 'reduzido';
  raiz.dataset.texto = ajustes.textoGrande ? 'grande' : 'normal';
  raiz.dataset.libras = ajustes.libras ? 'sim' : 'nao';
  raiz.dataset.legenda = ajustes.legenda ? 'sim' : 'nao';
}

/* ---------- narração (voz sintetizada do navegador, sem arquivos) ---------- */

let vozPtBr = null;
function escolherVoz() {
  const vozes = window.speechSynthesis?.getVoices?.() || [];
  vozPtBr = vozes.find((v) => /pt[-_]BR/i.test(v.lang)) ||
            vozes.find((v) => /^pt/i.test(v.lang)) || null;
}
if (window.speechSynthesis) {
  escolherVoz();
  window.speechSynthesis.onvoiceschanged = escolherVoz;
}

export function falar(texto, { forcar = false } = {}) {
  if (!texto) return;
  if (!ajustes.voz && !forcar) return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = 'pt-BR';
  if (vozPtBr) fala.voice = vozPtBr;
  fala.rate = ajustes.perfil === 'baixoEstimulo' ? 0.85 : 0.95;
  fala.pitch = 1;
  window.speechSynthesis.speak(fala);
}

export function calarVoz() {
  window.speechSynthesis?.cancel();
}

/* ---------- avisos para leitor de tela e para a faixa de legendas ---------- */

let regiaoViva = null;
export function regiao(el) { regiaoViva = el; }

export function anunciar(texto, { narrar = true } = {}) {
  if (regiaoViva) {
    regiaoViva.textContent = '';
    // reatribuir no próximo quadro garante releitura de textos repetidos
    requestAnimationFrame(() => { regiaoViva.textContent = texto; });
  }
  if (narrar) falar(texto);
}
