/* Estado do jogo, persistência local e registro pedagógico.
   Tudo em localStorage: o jogo roda offline no computador da escola. */

import { CHAVES, PALAVRAS, TRILHA, ETAPAS } from './config.js';

const ouvintes = new Set();

function estadoInicial() {
  return {
    aluno: { id: null, nome: '' },
    personagem: { pele: 0, cabelo: 0, penteado: 0, roupa: 0, acessorio: 0 },
    cena: 'abertura',              // abertura | personalizar | mundo | encerramento
    mochila: [],                   // ids de itens conquistados
    /* progresso por palavra: etapas concluídas + item aplicado no ambiente */
    progresso: Object.fromEntries(
      Object.keys(PALAVRAS).map((id) => [id, { etapas: [], aplicado: false }])
    ),
    ambiente: { vaso: false, agua: false, flor: false },
    iniciadoEm: null,
    concluidoEm: null
  };
}

export const estado = carregar();

function carregar() {
  try {
    const bruto = localStorage.getItem(CHAVES.sessao);
    if (!bruto) return estadoInicial();
    const salvo = JSON.parse(bruto);
    return Object.assign(estadoInicial(), salvo);
  } catch {
    return estadoInicial();
  }
}

export function salvar() {
  try {
    localStorage.setItem(CHAVES.sessao, JSON.stringify(estado));
  } catch {
    /* modo anônimo / armazenamento bloqueado: o jogo continua na memória */
  }
}

export function reiniciar() {
  Object.assign(estado, estadoInicial());
  salvar();
  avisar();
}

export function aoMudar(fn) {
  ouvintes.add(fn);
  return () => ouvintes.delete(fn);
}

export function avisar() {
  ouvintes.forEach((fn) => fn(estado));
}

/* ---------- consultas de progresso ---------- */

export function etapaConcluida(palavraId, etapaId) {
  return estado.progresso[palavraId]?.etapas.includes(etapaId);
}

export function palavraCompleta(palavraId) {
  const p = estado.progresso[palavraId];
  return !!p && ETAPAS.every((e) => p.etapas.includes(e.id));
}

export function palavraAplicada(palavraId) {
  return !!estado.progresso[palavraId]?.aplicado;
}

/* Regra de bloqueio/avanço: uma palavra só abre quando as anteriores
   já foram aplicadas no ambiente. */
export function palavraLiberada(palavraId) {
  const item = TRILHA.find((t) => t.palavra === palavraId);
  if (!item) return false;
  return item.requer.every((req) => palavraAplicada(req));
}

export function proximaEtapa(palavraId) {
  return ETAPAS.find((e) => !etapaConcluida(palavraId, e.id)) || null;
}

export function jogoCompleto() {
  return TRILHA.every((t) => palavraAplicada(t.palavra));
}

export function totalEtapas() {
  return TRILHA.length * (ETAPAS.length + 1); // etapas + aplicação no ambiente
}

export function etapasFeitas() {
  return TRILHA.reduce((soma, t) => {
    const p = estado.progresso[t.palavra];
    return soma + p.etapas.length + (p.aplicado ? 1 : 0);
  }, 0);
}

/* ---------- mutações ---------- */

export function concluirEtapa(palavraId, etapaId) {
  const p = estado.progresso[palavraId];
  if (p && !p.etapas.includes(etapaId)) p.etapas.push(etapaId);
  salvar();
  avisar();
}

export function guardarNaMochila(itemId) {
  if (!estado.mochila.includes(itemId)) estado.mochila.push(itemId);
  salvar();
  avisar();
}

export function aplicarNoAmbiente(palavraId) {
  estado.progresso[palavraId].aplicado = true;
  estado.ambiente[palavraId] = true;
  estado.mochila = estado.mochila.filter((i) => i !== palavraId);
  salvar();
  avisar();
}

export function definirCena(cena) {
  estado.cena = cena;
  if (cena === 'mundo' && !estado.iniciadoEm) estado.iniciadoEm = Date.now();
  if (cena === 'encerramento') estado.concluidoEm = Date.now();
  salvar();
  avisar();
}

/* ---------- registro pedagógico (para o painel do professor) ---------- */

const sessaoAtual = {
  inicio: Date.now(),
  eventos: []
};

export function registrar(tipo, dados = {}) {
  sessaoAtual.eventos.push({ tipo, ...dados, em: Date.now() });
  gravarRelatorio();
}

function gravarRelatorio() {
  try {
    const lista = JSON.parse(localStorage.getItem(CHAVES.relatorios) || '[]');
    const registro = {
      id: 'sessao-' + sessaoAtual.inicio,
      aluno: estado.aluno,
      inicio: sessaoAtual.inicio,
      fim: Date.now(),
      eventos: sessaoAtual.eventos,
      resumo: resumoPedagogico()
    };
    const i = lista.findIndex((r) => r.id === registro.id);
    if (i >= 0) lista[i] = registro; else lista.push(registro);
    localStorage.setItem(CHAVES.relatorios, JSON.stringify(lista.slice(-60)));
  } catch {
    /* sem armazenamento: o jogo segue, apenas sem histórico */
  }
}

export function resumoPedagogico() {
  const porPalavra = {};
  for (const id of Object.keys(PALAVRAS)) {
    const eventos = sessaoAtual.eventos.filter((e) => e.palavra === id);
    porPalavra[id] = {
      acertos: eventos.filter((e) => e.tipo === 'acerto').length,
      erros: eventos.filter((e) => e.tipo === 'erro').length,
      apoios: eventos.filter((e) => e.tipo === 'recuperacao').length,
      concluida: palavraAplicada(id)
    };
  }
  return {
    porPalavra,
    etapasFeitas: etapasFeitas(),
    totalEtapas: totalEtapas(),
    completo: jogoCompleto()
  };
}
