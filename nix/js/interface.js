/* Elementos de interface reutilizados por todas as cenas:
   diálogo do Nix, painel de tarefa, faixa de legenda e janela de Libras.
   Toda fala aparece em três canais: texto, legenda e (se ligada) voz. */

import { MIDIA_EXTERNA } from './config.js';
import { ajustes, anunciar, falar, calarVoz } from './acessibilidade.js';
import { som } from './som.js';

const el = (sel) => document.querySelector(sel);

export const elementos = {};

export function prepararInterface() {
  elementos.dialogo = el('#dialogo');
  elementos.dialogoTexto = el('#dialogo-texto');
  elementos.dialogoBotoes = el('#dialogo-botoes');
  elementos.painel = el('#painel');
  elementos.painelCorpo = el('#painel-corpo');
  elementos.painelTitulo = el('#painel-titulo');
  elementos.legenda = el('#legenda');
  elementos.libras = el('#libras');
  elementos.cenas = el('#camada-cenas');
}

/* ---------- legendas ---------- */

export function legendar(texto) {
  if (!elementos.legenda) return;
  elementos.legenda.textContent = texto || '';
  elementos.legenda.hidden = !texto || !ajustes.legenda;
}

/* ---------- janela de Libras ---------- */
/* Enquanto os vídeos definitivos não são produzidos, a janela mostra um
   espaço reservado identificado — o recurso já está no lugar certo da tela. */
export function libras(arquivo, descricao) {
  const alvo = elementos.libras;
  if (!alvo) return;
  alvo.hidden = !ajustes.libras;
  if (!ajustes.libras) return;
  alvo.innerHTML = '';
  const titulo = document.createElement('p');
  titulo.className = 'libras-titulo';
  titulo.textContent = 'Libras';
  alvo.appendChild(titulo);

  if (arquivo && MIDIA_EXTERNA) {
    const video = document.createElement('video');
    video.src = arquivo;
    video.autoplay = true; video.loop = true; video.muted = true;
    video.playsInline = true;
    video.setAttribute('aria-label', 'Vídeo em Libras: ' + (descricao || ''));
    video.addEventListener('error', () => { video.replaceWith(reservado(descricao)); });
    alvo.appendChild(video);
  } else {
    alvo.appendChild(reservado(descricao));
  }
}

function reservado(descricao) {
  const caixa = document.createElement('div');
  caixa.className = 'reservado';
  caixa.innerHTML = `<span aria-hidden="true">🤟</span>
    <small>Espaço reservado para o vídeo em Libras${descricao ? ': ' + descricao : ''}</small>`;
  return caixa;
}

/* ---------- diálogo ---------- */

export function dialogo(texto, botoes = [{ rotulo: 'Continuar' }], opcoes = {}) {
  return new Promise((resolve) => {
    const d = elementos.dialogo;
    d.hidden = false;
    elementos.dialogoTexto.textContent = texto;
    /* o próprio diálogo já mostra o texto em tamanho grande: repetir na
       faixa de legenda só duplicaria a leitura */
    legendar('');
    libras(opcoes.libras, opcoes.descricaoLibras || texto);
    anunciar(texto);

    elementos.dialogoBotoes.innerHTML = '';
    botoes.forEach((b, i) => {
      const btn = document.createElement('button');
      btn.className = 'botao ' + (b.estilo || (i === 0 ? 'principal' : 'secundario'));
      btn.textContent = b.rotulo;
      btn.addEventListener('click', () => {
        som.abrir();
        fecharDialogo();
        resolve(b.valor ?? i);
      });
      elementos.dialogoBotoes.appendChild(btn);
    });
    elementos.dialogoBotoes.querySelector('button')?.focus();
  });
}

export function fecharDialogo() {
  calarVoz();
  elementos.dialogo.hidden = true;
  legendar('');
}

/* ---------- painel de tarefa ---------- */

let aoFecharPainel = null;

export function abrirPainel(titulo, { aoFechar = null, rotuloFechar = 'Voltar ao jardim' } = {}) {
  elementos.painel.hidden = false;
  elementos.painelTitulo.textContent = titulo;
  elementos.painelCorpo.innerHTML = '';
  aoFecharPainel = aoFechar;
  const btn = document.querySelector('#painel-fechar');
  btn.textContent = rotuloFechar;
  elementos.painel.querySelector('#painel-corpo').setAttribute('tabindex', '-1');
  elementos.painelTitulo.focus?.();
  return elementos.painelCorpo;
}

export function fecharPainel() {
  elementos.painel.hidden = true;
  elementos.painelCorpo.innerHTML = '';
  legendar('');
  calarVoz();
  const fn = aoFecharPainel;
  aoFecharPainel = null;
  fn?.();
}

export function painelAberto() {
  return !elementos.painel.hidden;
}

/* ---------- avisos curtos sobre o palco ---------- */

export function aviso(texto, tipo = 'ok') {
  const caixa = document.createElement('div');
  caixa.className = 'aviso aviso-' + tipo;
  caixa.setAttribute('role', 'status');
  caixa.textContent = texto;
  document.querySelector('#palco').appendChild(caixa);
  anunciar(texto, { narrar: false });
  falar(texto);
  const some = () => caixa.remove();
  if (ajustes.movimento) {
    setTimeout(() => { caixa.classList.add('saindo'); setTimeout(some, 400); }, 2600);
  } else {
    setTimeout(some, 3200);
  }
}

/* Botão padrão do jogo. */
export function botao(rotulo, aoClicar, estilo = 'principal') {
  const b = document.createElement('button');
  b.className = 'botao ' + estilo;
  b.textContent = rotulo;
  b.addEventListener('click', aoClicar);
  return b;
}
