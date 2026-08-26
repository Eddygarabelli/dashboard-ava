/* Encerramento previsto para o MVP: fecha a narrativa, mostra o que a criança
   conquistou e oferece um caminho claro de saída (recomeçar ou encerrar). */

import { PALAVRAS, TRILHA } from '../config.js';
import { estado, resumoPedagogico, definirCena, reiniciar } from '../estado.js';
import { anunciar } from '../acessibilidade.js';
import { som } from '../som.js';
import { legendar, libras, botao } from '../interface.js';
import { figuraEmCanvas, desenharVaso, desenharNix, desenharPersonagem } from '../desenho.js';

export function abrirEncerramento(container, aoReiniciar) {
  definirCena('encerramento');
  som.conquista();
  container.innerHTML = '';
  container.hidden = false;

  const nome = estado.aluno.nome ? `, ${estado.aluno.nome}` : '';
  const cena = document.createElement('section');
  cena.className = 'cena cena-encerramento';
  cena.innerHTML = `
    <h1 class="cena-titulo">O jardim voltou a ter nomes!</h1>
    <canvas id="quadro-final" width="240" height="100" role="img"
            aria-label="O jardim com o vaso, a água e a flor"></canvas>
    <p class="cena-texto">Você trouxe de volta VASO, ÁGUA e FLOR${nome}.</p>
    <div class="palavras-finais" id="palavras-finais"></div>
    <div class="acoes" id="acoes-final"></div>`;
  container.appendChild(cena);

  const tela = cena.querySelector('#quadro-final');
  const ctx = tela.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  let animacao = 0;
  (function laco(t) {
    if (container.hidden) return cancelAnimationFrame(animacao);
    ctx.clearRect(0, 0, tela.width, tela.height);
    const g = ctx.createLinearGradient(0, 0, 0, tela.height);
    g.addColorStop(0, '#8ec5e8'); g.addColorStop(1, '#cfe8b6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, tela.width, tela.height);
    ctx.fillStyle = '#5c9440';
    ctx.fillRect(0, tela.height - 20, tela.width, 20);
    ctx.fillStyle = '#7cb356';
    ctx.fillRect(0, tela.height - 20, tela.width, 1);
    desenharNix(ctx, 70, tela.height - 26, 36, t);
    desenharVaso(ctx, 122, tela.height - 8, 40, { comAgua: true, comFlor: true });
    desenharPersonagem(ctx, 176, tela.height - 8, 48, estado.personagem, { direcao: 'esquerda' });
    animacao = requestAnimationFrame(laco);
  })(0);

  const lista = cena.querySelector('#palavras-finais');
  const resumo = resumoPedagogico();
  TRILHA.forEach(({ palavra }) => {
    const p = PALAVRAS[palavra];
    const item = document.createElement('div');
    item.className = 'palavra-final';
    item.appendChild(figuraEmCanvas(p.id, 90));
    const t = document.createElement('span');
    t.textContent = p.texto;
    item.appendChild(t);
    const dados = resumo.porPalavra[p.id];
    const nota = document.createElement('small');
    nota.textContent = dados.apoios > 0 ? 'com apoio do Nix' : 'sozinho(a)';
    item.appendChild(nota);
    lista.appendChild(item);
  });

  const acoes = cena.querySelector('#acoes-final');
  acoes.appendChild(botao('Jogar de novo', () => {
    cancelAnimationFrame(animacao);
    reiniciar();
    container.hidden = true;
    aoReiniciar();
  }));
  acoes.appendChild(botao('Encerrar', () => {
    anunciar('Você pode fechar a janela ou chamar a professora.');
    acoes.querySelectorAll('button').forEach((b) => { b.disabled = true; });
    const fim = document.createElement('p');
    fim.className = 'cena-texto';
    fim.textContent = 'Até a próxima! Chame a professora ou o professor.';
    acoes.after(fim);
  }, 'secundario'));

  legendar('O jardim voltou a ter nomes. Você trouxe vaso, água e flor.');
  libras(null, 'encerramento');
  anunciar(`Parabéns${nome}! Você trouxe de volta as palavras vaso, água e flor.`);
  acoes.querySelector('.botao.principal').focus();
}
