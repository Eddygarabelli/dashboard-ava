/* Exibição integrada de mídia: figura, vídeo, áudio, legenda e Libras.
   Quando o arquivo definitivo ainda não existe, entra a figura desenhada por
   código e um espaço reservado — a tarefa continua funcionando. */

import { MIDIA_EXTERNA } from './config.js';
import { ajustes, falar } from './acessibilidade.js';
import { figuraEmCanvas } from './desenho.js';
import { libras, legendar } from './interface.js';

export function cartaoDaPalavra(palavra, { comVideo = true } = {}) {
  const caixa = document.createElement('div');
  caixa.className = 'midia';

  const visual = document.createElement('div');
  visual.className = 'midia-visual';

  if (comVideo && MIDIA_EXTERNA && palavra.midia?.video) {
    const video = document.createElement('video');
    video.src = palavra.midia.video;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', 'Vídeo sobre ' + palavra.texto);
    /* sem arquivo publicado ainda → cai para a figura desenhada */
    video.addEventListener('error', () => video.replaceWith(figuraEmCanvas(palavra.id, 160)));
    visual.appendChild(video);
  } else {
    visual.appendChild(figuraEmCanvas(palavra.id, 160));
  }

  const texto = document.createElement('div');
  texto.className = 'midia-texto';
  texto.innerHTML = `<p class="palavra-grande">${palavra.texto}</p>
                     <p class="palavra-frase">${palavra.frase}</p>`;

  const ouvir = document.createElement('button');
  ouvir.className = 'botao secundario';
  ouvir.innerHTML = '<span aria-hidden="true">🔊</span> Ouvir a palavra';
  ouvir.addEventListener('click', () => falar(`${palavra.texto}. ${palavra.frase}`, { forcar: true }));
  texto.appendChild(ouvir);

  caixa.append(visual, texto);

  legendar(palavra.midia?.legenda || palavra.frase);
  libras(palavra.midia?.libras, palavra.texto);
  if (ajustes.voz) falar(`${palavra.texto}. ${palavra.frase}`);
  return caixa;
}

export function tocarAudio(caminho) {
  if (!ajustes.som || !caminho || !MIDIA_EXTERNA) return;
  const a = new Audio(caminho);
  a.play().catch(() => { /* arquivo ainda não publicado: silencia */ });
}
