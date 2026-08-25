/* Montagem do jogo: liga cenas, mundo, tarefas, mochila e ajustes. */

import { JOGO, PALAVRAS, TRILHA, PERFIS } from './config.js';
import {
  estado, aoMudar, definirCena, reiniciar, registrar,
  palavraLiberada, palavraAplicada, aplicarNoAmbiente,
  jogoCompleto, etapasFeitas, totalEtapas
} from './estado.js';
import { ajustes, aplicar, aplicarPerfil, definirAjuste, anunciar, regiao, falar } from './acessibilidade.js';
import { som } from './som.js';
import { prepararInterface, elementos, dialogo, abrirPainel, fecharPainel, painelAberto, botao, aviso, legendar } from './interface.js';
import { iniciarMundo, bloquearJogador, irAte, moverPorBotao, OBJETOS, objetivoAtual, objetoEmFoco } from './mundo.js';
import { abrirTarefa } from './tarefas.js';
import { figuraEmCanvas } from './desenho.js';
import { abrirAbertura } from './cenas/abertura.js';
import { abrirPersonalizacao } from './cenas/personalizar.js';
import { abrirEncerramento } from './cenas/encerramento.js';

const el = (sel) => document.querySelector(sel);

export function iniciar() {
  prepararInterface();
  regiao(el('#aviso-vivo'));
  aplicar();
  el('#titulo-jogo').textContent = JOGO.titulo;
  el('#versao-jogo').textContent = JOGO.versao;

  ligarControles();
  ligarAjustes();
  aoMudar(atualizarHud);
  atualizarHud();

  /* Retomada: quem já estava no jardim volta direto para onde parou. */
  if (estado.iniciadoEm && !jogoCompleto()) {
    entrarNoMundo({ retomando: true });
  } else if (jogoCompleto()) {
    entrarNoMundo({ retomando: true });
  } else {
    abrirAbertura(elementos.cenas, () => {
      definirCena('personalizar');
      abrirPersonalizacao(elementos.cenas, () => entrarNoMundo({}));
    });
  }
}

/* ---------- mundo ---------- */

function entrarNoMundo({ retomando = false }) {
  elementos.cenas.hidden = true;
  definirCena('mundo');
  el('#palco').dataset.modo = 'mundo';
  iniciarMundo(el('#tela'), { aoInteragir: interagir, aoAproximar: mostrarAlvoProximo });
  atualizarHud();
  if (retomando) {
    aviso('Você voltou ao jardim.');
  } else {
    setTimeout(() => falarComNix(true), 500);
  }
}

function mostrarAlvoProximo(objeto) {
  const dica = el('#alvo-proximo');
  if (!objeto) { dica.textContent = ''; dica.hidden = true; return; }
  dica.hidden = false;
  dica.dataset.id = objeto.id;
  dica.innerHTML = `<strong>${objeto.rotulo}</strong> — aperte <kbd>Enter</kbd> ou toque em <em>Interagir</em>`;
}

async function interagir(objeto) {
  if (painelAberto() || !elementos.dialogo.hidden) return;
  bloquearJogador(true);
  try {
    switch (objeto.acao) {
      case 'tarefa': return await interagirTarefa(objeto);
      case 'aplicar': return await interagirMesa();
      case 'falar': return await falarComNix();
      case 'sair': return await interagirPorta();
      case 'ler':
        await dialogo('Placa de madeira: JARDIM DAS PALAVRAS.');
        return;
    }
  } finally {
    if (!painelAberto()) bloquearJogador(false);
  }
}

async function interagirTarefa(objeto) {
  const id = objeto.alvo;
  const palavra = PALAVRAS[id];

  if (palavraAplicada(id)) {
    await dialogo(`${palavra.texto} já está no jardim. Muito bem!`);
    return;
  }
  if (estado.mochila.includes(id)) {
    await dialogo(`${palavra.texto} já está na sua mochila. Leve até a mesa do jardim.`,
      [{ rotulo: 'Ir até a mesa', valor: 'mesa' }, { rotulo: 'Ficar aqui', valor: 'ficar' }])
      .then((r) => { if (r === 'mesa') irAte('mesa'); });
    return;
  }
  if (!palavraLiberada(id)) {
    const falta = TRILHA.find((t) => t.palavra === id).requer.find((r) => !palavraAplicada(r));
    await dialogo(`Ainda não. Primeiro precisamos de ${PALAVRAS[falta].texto}.`,
      [{ rotulo: `Ir até ${PALAVRAS[falta].texto}`, valor: 'ir' }, { rotulo: 'Ficar aqui', valor: 'ficar' }])
      .then((r) => {
        if (r === 'ir') {
          const destino = OBJETOS.find((o) => o.alvo === falta);
          if (destino) irAte(destino.id);
        }
      });
    return;
  }

  bloquearJogador(true);
  abrirTarefa(id, () => {
    bloquearJogador(false);
    atualizarHud();
    setTimeout(() => aviso('Leve a palavra até a mesa do jardim.'), 1200);
  });
}

async function interagirMesa() {
  if (!estado.mochila.length) {
    const alvo = objetivoAtual();
    const texto = jogoCompleto()
      ? 'A mesa está completa. O portão do jardim já pode abrir.'
      : `A mochila está vazia. Vá até ${alvo ? alvo.rotulo.toLowerCase() : 'o próximo lugar'}.`;
    await dialogo(texto, [{ rotulo: alvo ? `Ir até ${alvo.rotulo}` : 'Continuar', valor: 'ir' },
                          { rotulo: 'Ficar aqui', valor: 'ficar' }])
      .then((r) => { if (r === 'ir' && alvo) irAte(alvo.id); });
    return;
  }

  const id = estado.mochila[0];
  const palavra = PALAVRAS[id];
  await dialogo(`Colocar ${palavra.artigo.toUpperCase()} ${palavra.texto} na mesa do jardim?`,
    [{ rotulo: 'Sim, colocar', valor: 'sim' }, { rotulo: 'Agora não', valor: 'nao' }])
    .then(async (r) => {
      if (r !== 'sim') return;
      aplicarNoAmbiente(id);
      registrar('aplicou-no-ambiente', { palavra: id });
      som.conquista();
      aviso(`${palavra.texto} está no jardim!`);
      atualizarHud();

      if (jogoCompleto()) {
        await dialogo('As três palavras voltaram! O portão do jardim está aberto.',
          [{ rotulo: 'Ir até o portão', valor: 'ir' }, { rotulo: 'Ficar mais um pouco', valor: 'ficar' }])
          .then((res) => { if (res === 'ir') irAte('porta', true); });
      } else {
        const proximo = objetivoAtual();
        await dialogo(`${palavra.frase} Agora vamos buscar a próxima palavra.`,
          [{ rotulo: proximo ? `Ir até ${proximo.rotulo}` : 'Continuar', valor: 'ir' },
           { rotulo: 'Explorar sozinho', valor: 'ficar' }])
          .then((res) => { if (res === 'ir' && proximo) irAte(proximo.id); });
      }
    });
}

async function falarComNix(primeiraVez = false) {
  const alvo = objetivoAtual();
  let fala;
  if (primeiraVez) {
    fala = 'Oi! Eu sou o Nix. O vento levou três palavras do jardim: VASO, ÁGUA e FLOR. Vamos trazer de volta?';
  } else if (jogoCompleto()) {
    fala = 'Conseguimos! Agora é só ir até o portão do jardim.';
  } else if (estado.mochila.length) {
    const p = PALAVRAS[estado.mochila[0]];
    fala = `${p.texto} está na sua mochila. Leve até a mesa do jardim.`;
  } else if (alvo) {
    fala = `A próxima palavra está ${alvo.rotulo === 'Prateleira' ? 'na' : 'n' + (alvo.rotulo === 'Torneira' ? 'a' : 'o')} ${alvo.rotulo.toLowerCase()}. ${alvo.dica}`;
  } else {
    fala = 'Vamos explorar o jardim.';
  }
  const opcoes = [{ rotulo: 'Entendi', valor: 'ok' }];
  if (alvo) opcoes.unshift({ rotulo: `Me leve até ${alvo.rotulo}`, valor: 'ir' });
  const r = await dialogo(fala, opcoes, { descricaoLibras: fala });
  if (r === 'ir' && alvo) irAte(alvo.id);
}

async function interagirPorta() {
  if (!jogoCompleto()) {
    const faltam = TRILHA.filter((t) => !palavraAplicada(t.palavra))
      .map((t) => PALAVRAS[t.palavra].texto).join(' e ');
    await dialogo(`O portão abre quando as palavras voltarem. Ainda falta: ${faltam}.`);
    return;
  }
  const r = await dialogo('Quer encerrar a aventura de hoje?',
    [{ rotulo: 'Sim, encerrar', valor: 'sim' }, { rotulo: 'Ficar no jardim', valor: 'nao' }]);
  if (r === 'sim') {
    registrar('encerramento', {});
    bloquearJogador(true);
    abrirEncerramento(elementos.cenas, () => { location.reload(); });
  }
}

/* ---------- HUD: mochila, progresso, objetivo ---------- */

function atualizarHud() {
  const mochila = el('#mochila-itens');
  if (mochila) {
    mochila.innerHTML = '';
    if (!estado.mochila.length) {
      const vazio = document.createElement('li');
      vazio.className = 'mochila-vazia';
      vazio.textContent = 'vazia';
      mochila.appendChild(vazio);
    }
    estado.mochila.forEach((id) => {
      const item = document.createElement('li');
      item.className = 'mochila-item';
      item.title = PALAVRAS[id].texto;
      item.appendChild(figuraEmCanvas(id, 46));
      const nome = document.createElement('span');
      nome.textContent = PALAVRAS[id].texto;
      item.appendChild(nome);
      mochila.appendChild(item);
    });
  }

  const feitas = etapasFeitas(), total = totalEtapas();
  const barra = el('#barra-progresso');
  if (barra) {
    barra.style.width = Math.round((feitas / total) * 100) + '%';
    el('#progresso').setAttribute('aria-valuenow', String(feitas));
    el('#progresso').setAttribute('aria-valuemax', String(total));
    el('#progresso-texto').textContent = `${feitas} de ${total}`;
  }

  const lista = el('#palavras-hud');
  if (lista) {
    lista.innerHTML = '';
    TRILHA.forEach(({ palavra }) => {
      const li = document.createElement('li');
      const estadoPalavra = palavraAplicada(palavra) ? 'feita'
        : palavraLiberada(palavra) ? 'aberta' : 'bloqueada';
      li.className = 'palavra-hud ' + estadoPalavra;
      li.innerHTML = `<span aria-hidden="true">${estadoPalavra === 'feita' ? '✓' : estadoPalavra === 'aberta' ? '●' : '🔒'}</span> ${PALAVRAS[palavra].texto}`;
      li.setAttribute('aria-label',
        `${PALAVRAS[palavra].texto}: ${estadoPalavra === 'feita' ? 'concluída' : estadoPalavra === 'aberta' ? 'disponível' : 'bloqueada'}`);
      lista.appendChild(li);
    });
  }

  const alvo = objetivoAtual();
  const objetivo = el('#objetivo');
  if (objetivo) objetivo.textContent = alvo ? `Objetivo: ${alvo.rotulo}` : 'Objetivo: explorar o jardim';
}

/* ---------- controles ---------- */

function ligarControles() {
  ['cima', 'baixo', 'esquerda', 'direita'].forEach((dir) => {
    const b = el(`#dpad-${dir}`);
    if (!b) return;
    const liga = (e) => { e.preventDefault(); moverPorBotao(dir, true); };
    const desliga = () => moverPorBotao(dir, false);
    b.addEventListener('pointerdown', liga);
    b.addEventListener('pointerup', desliga);
    b.addEventListener('pointerleave', desliga);
    b.addEventListener('pointercancel', desliga);
  });

  el('#btn-interagir')?.addEventListener('click', () => {
    /* interage com o que está perto; sem nada por perto, caminha até o objetivo */
    const perto = objetoEmFoco();
    if (perto) return interagir(perto);
    const alvo = objetivoAtual();
    if (alvo) irAte(alvo.id, true);
    else aviso('Chegue mais perto de alguma coisa do jardim.');
  });

  el('#btn-dica')?.addEventListener('click', () => falarComNix());
  el('#btn-ir')?.addEventListener('click', abrirIrAte);
  el('#painel-fechar')?.addEventListener('click', () => { fecharPainel(); bloquearJogador(false); });

  el('#btn-recomecar')?.addEventListener('click', async () => {
    const r = await dialogo('Quer começar tudo de novo? O progresso de hoje será apagado.',
      [{ rotulo: 'Não', valor: 'nao' }, { rotulo: 'Sim, recomeçar', valor: 'sim' }]);
    if (r === 'sim') { reiniciar(); location.reload(); }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (painelAberto()) { fecharPainel(); bloquearJogador(false); }
      else if (!el('#modal-ajustes').hidden) fecharAjustes();
    }
  });
}

/* Lista "Ir até": alternativa acessível ao uso das setas. */
function abrirIrAte() {
  const corpo = abrirPainel('Ir até...', { rotuloFechar: 'Fechar', aoFechar: () => bloquearJogador(false) });
  bloquearJogador(true);
  const lista = document.createElement('div');
  lista.className = 'lista-lugares';
  OBJETOS.filter((o) => o.id !== 'placa').forEach((o) => {
    const b = botao(o.rotulo, () => {
      fecharPainel();
      bloquearJogador(false);
      irAte(o.id, true);
    }, 'secundario');
    b.title = o.dica;
    lista.appendChild(b);
  });
  corpo.appendChild(lista);
  legendar('Escolha um lugar do jardim.');
  anunciar('Escolha para onde ir.');
  lista.querySelector('button').focus();
}

/* ---------- ajustes de acessibilidade ---------- */

const INTERRUPTORES = [
  { chave: 'som', rotulo: 'Sons do jogo' },
  { chave: 'voz', rotulo: 'Narração em voz' },
  { chave: 'legenda', rotulo: 'Legendas' },
  { chave: 'libras', rotulo: 'Janela de Libras' },
  { chave: 'movimento', rotulo: 'Animações' },
  { chave: 'contraste', rotulo: 'Alto contraste' },
  { chave: 'textoGrande', rotulo: 'Texto grande' }
];

function ligarAjustes() {
  el('#btn-ajustes')?.addEventListener('click', abrirAjustes);
  el('#ajustes-fechar')?.addEventListener('click', fecharAjustes);
  montarAjustes();
}

function montarAjustes() {
  const perfis = el('#lista-perfis');
  perfis.innerHTML = '';
  Object.entries(PERFIS).forEach(([id, perfil]) => {
    const b = document.createElement('button');
    b.className = 'perfil' + (ajustes.perfil === id ? ' ativo' : '');
    b.innerHTML = `<strong>${perfil.rotulo}</strong><small>${perfil.descricao}</small>`;
    b.setAttribute('aria-pressed', String(ajustes.perfil === id));
    b.addEventListener('click', () => {
      aplicarPerfil(id);
      montarAjustes();
      anunciar(`Perfil ${perfil.rotulo} ativado.`, { narrar: false });
    });
    perfis.appendChild(b);
  });

  const lista = el('#lista-ajustes');
  lista.innerHTML = '';
  INTERRUPTORES.forEach(({ chave, rotulo }) => {
    const linha = document.createElement('label');
    linha.className = 'interruptor';
    const entrada = document.createElement('input');
    entrada.type = 'checkbox';
    entrada.checked = !!ajustes[chave];
    entrada.addEventListener('change', () => {
      definirAjuste(chave, entrada.checked);
      el('#lista-perfis').querySelectorAll('.perfil').forEach((p) => p.classList.remove('ativo'));
    });
    const texto = document.createElement('span');
    texto.textContent = rotulo;
    linha.append(entrada, texto);
    lista.appendChild(linha);
  });
}

function abrirAjustes() {
  montarAjustes();
  el('#modal-ajustes').hidden = false;
  bloquearJogador(true);
  el('#ajustes-fechar').focus();
}

function fecharAjustes() {
  el('#modal-ajustes').hidden = true;
  if (!painelAberto()) bloquearJogador(false);
}
