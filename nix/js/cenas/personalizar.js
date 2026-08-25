/* Personalização do personagem: poucas escolhas, sempre visíveis,
   com pré-visualização imediata. Nada é obrigatório — dá para pular. */

import { PERSONALIZACAO } from '../config.js';
import { estado, salvar, definirCena } from '../estado.js';
import { anunciar } from '../acessibilidade.js';
import { som } from '../som.js';
import { legendar, botao } from '../interface.js';
import { desenharPersonagem } from '../desenho.js';

const GRUPOS = [
  { chave: 'pele', rotulo: 'Cor da pele', tipo: 'cor', opcoes: PERSONALIZACAO.pele },
  { chave: 'cabelo', rotulo: 'Cor do cabelo', tipo: 'cor', opcoes: PERSONALIZACAO.cabelo },
  { chave: 'penteado', rotulo: 'Cabelo', tipo: 'texto', opcoes: PERSONALIZACAO.penteado,
    nomes: { curto: 'Curto', cacheado: 'Cacheado', trancas: 'Tranças', longo: 'Longo' } },
  { chave: 'roupa', rotulo: 'Cor da roupa', tipo: 'cor', opcoes: PERSONALIZACAO.roupa },
  { chave: 'acessorio', rotulo: 'Acessório', tipo: 'texto', opcoes: PERSONALIZACAO.acessorio,
    nomes: { nenhum: 'Nenhum', oculos: 'Óculos', fone: 'Fone', lenco: 'Lenço' } }
];

export function abrirPersonalizacao(container, aoTerminar) {
  container.innerHTML = '';
  container.hidden = false;

  const cena = document.createElement('section');
  cena.className = 'cena cena-personalizar';
  cena.innerHTML = `
    <h1 class="cena-titulo">Quem vai entrar no jardim?</h1>
    <div class="personalizar-grade">
      <div class="previa">
        <canvas id="previa-personagem" width="260" height="300" role="img"
                aria-label="Prévia do seu personagem"></canvas>
        <label class="campo">
          <span>Seu nome (opcional)</span>
          <input id="nome-jogador" class="entrada" maxlength="${PERSONALIZACAO.nome.maximo}"
                 autocomplete="off" placeholder="Digite seu nome">
        </label>
      </div>
      <div class="opcoes" id="opcoes-personagem"></div>
    </div>
    <div class="acoes" id="acoes-personalizar"></div>`;
  container.appendChild(cena);

  const tela = cena.querySelector('#previa-personagem');
  const ctx = tela.getContext('2d');
  const campoNome = cena.querySelector('#nome-jogador');
  campoNome.value = estado.aluno.nome || '';
  campoNome.addEventListener('input', () => {
    estado.aluno.nome = campoNome.value.trim();
    salvar();
  });

  function redesenhar() {
    ctx.clearRect(0, 0, tela.width, tela.height);
    desenharPersonagem(ctx, tela.width / 2, tela.height * 0.72, 190, estado.personagem, { direcao: 'baixo' });
  }

  const listaOpcoes = cena.querySelector('#opcoes-personagem');
  GRUPOS.forEach((grupo) => {
    const bloco = document.createElement('fieldset');
    bloco.className = 'grupo';
    const legendaEl = document.createElement('legend');
    legendaEl.textContent = grupo.rotulo;
    bloco.appendChild(legendaEl);

    const linha = document.createElement('div');
    linha.className = 'linha-opcoes';
    grupo.opcoes.forEach((valor, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opcao ' + (grupo.tipo === 'cor' ? 'opcao-cor' : 'opcao-texto');
      if (grupo.tipo === 'cor') {
        b.style.background = valor;
        b.setAttribute('aria-label', `${grupo.rotulo}, opção ${i + 1}`);
      } else {
        b.textContent = grupo.nomes?.[valor] || valor;
      }
      b.setAttribute('aria-pressed', String(estado.personagem[grupo.chave] === i));
      b.addEventListener('click', () => {
        estado.personagem[grupo.chave] = i;
        salvar();
        redesenhar();
        som.abrir();
        linha.querySelectorAll('button').forEach((o, j) =>
          o.setAttribute('aria-pressed', String(j === i)));
        anunciar(`${grupo.rotulo}: ${grupo.nomes?.[valor] || 'opção ' + (i + 1)}`, { narrar: false });
      });
      linha.appendChild(b);
    });
    bloco.appendChild(linha);
    listaOpcoes.appendChild(bloco);
  });

  const acoes = cena.querySelector('#acoes-personalizar');
  acoes.appendChild(botao('Sortear', () => {
    GRUPOS.forEach((g) => {
      estado.personagem[g.chave] = Math.floor(Math.random() * g.opcoes.length);
    });
    salvar(); redesenhar(); som.guardar();
    anunciar('Personagem sorteado.', { narrar: false });
  }, 'secundario'));
  acoes.appendChild(botao('Entrar no jardim', () => {
    som.conquista();
    container.hidden = true;
    legendar('');
    definirCena('mundo');
    aoTerminar();
  }));

  redesenhar();
  legendar('Escolha como você quer ficar e entre no jardim.');
  anunciar('Monte o seu personagem. Depois toque em entrar no jardim.');
  acoes.querySelector('.botao.principal').focus();
}
