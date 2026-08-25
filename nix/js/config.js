/* Nix: O Código das Palavras — MVP
   Configuração pedagógica e de conteúdo.
   Todo o conteúdo textual/visual do MVP está centralizado aqui para que a
   autora possa revisar e ajustar sem mexer na lógica do jogo. */

export const JOGO = {
  titulo: 'Nix: O Código das Palavras',
  versao: 'MVP 0.1',
  subtitulo: 'O jardim das palavras perdidas'
};

/* Enquanto os vídeos e áudios definitivos não forem produzidos, o jogo usa as
   figuras desenhadas por código. Assim que os arquivos estiverem em
   nix/assets/, mude para true e a mídia real passa a ser usada. */
export const MIDIA_EXTERNA = false;

/* ---------- Palavras centrais do MVP: VASO, ÁGUA, FLOR ---------- */
/* `silabas` e `letras` alimentam as tarefas de composição.
   `midia` aponta para arquivos opcionais em nix/assets/. Quando o arquivo
   não existe, o jogo exibe o desenho procedural + o espaço reservado,
   sem quebrar a experiência. */
export const PALAVRAS = {
  vaso: {
    id: 'vaso',
    texto: 'VASO',
    artigo: 'o',
    silabas: ['VA', 'SO'],
    letras: ['V', 'A', 'S', 'O'],
    cor: '#c2703d',
    frase: 'O vaso guarda a terra.',
    dica: 'É de barro. A planta mora dentro dele.',
    midia: {
      video: 'assets/midia/vaso.mp4',
      libras: 'assets/libras/vaso.mp4',
      audio: 'assets/midia/vaso.mp3',
      legenda: 'Vaso. O vaso guarda a terra da planta.'
    }
  },
  agua: {
    id: 'agua',
    texto: 'ÁGUA',
    artigo: 'a',
    silabas: ['Á', 'GUA'],
    letras: ['Á', 'G', 'U', 'A'],
    cor: '#2f8fd8',
    frase: 'A água mata a sede da planta.',
    dica: 'Vem da torneira. É transparente e molha.',
    midia: {
      video: 'assets/midia/agua.mp4',
      libras: 'assets/libras/agua.mp4',
      audio: 'assets/midia/agua.mp3',
      legenda: 'Água. A água mata a sede da planta.'
    }
  },
  flor: {
    id: 'flor',
    texto: 'FLOR',
    artigo: 'a',
    silabas: ['FLOR'],
    letras: ['F', 'L', 'O', 'R'],
    cor: '#e05c8a',
    frase: 'A flor nasce do vaso com água.',
    dica: 'Tem pétalas coloridas e cheiro bom.',
    midia: {
      video: 'assets/midia/flor.mp4',
      libras: 'assets/libras/flor.mp4',
      audio: 'assets/midia/flor.mp3',
      legenda: 'Flor. A flor nasce do vaso com água.'
    }
  }
};

/* Ordem pedagógica do MVP: uma palavra depende da anterior.
   `requer` implementa as regras de bloqueio/avanço. */
export const TRILHA = [
  { palavra: 'vaso', requer: [] },
  { palavra: 'agua', requer: ['vaso'] },
  { palavra: 'flor', requer: ['vaso', 'agua'] }
];

/* Etapas de cada palavra. Sempre na mesma ordem — previsibilidade é
   requisito de acessibilidade para estudantes autistas. */
export const ETAPAS = [
  {
    id: 'reconhecer',
    titulo: 'Encontre a figura',
    instrucao: (p) => `Toque na figura de ${p.artigo.toUpperCase()} ${p.texto}.`,
    tipo: 'escolha'
  },
  {
    id: 'silabas',
    titulo: 'Monte as sílabas',
    instrucao: (p) => `Coloque as sílabas na ordem para formar ${p.texto}.`,
    tipo: 'ordenar'
  },
  {
    id: 'letras',
    titulo: 'Monte as letras',
    instrucao: (p) => `Coloque as letras na ordem para escrever ${p.texto}.`,
    tipo: 'ordenar'
  }
];

/* Regras de tentativa e recuperação pedagógica.
   Não existe "perder": o jogo apoia até a criança acertar. */
export const REGRAS = {
  tentativasAteApoio: 2,      // depois disso entra a recuperação pedagógica
  alternativasApoio: 2,       // reduz o número de opções na recuperação
  tempoLimite: null,          // sem tempo — decisão pedagógica do projeto
  bloqueiaAvanco: true        // só avança cumprindo as condições da tarefa
};

/* Abertura narrativa (quadros visuais + legenda + narração). */
export const ABERTURA = [
  {
    cena: 'noite',
    texto: 'Era uma noite quieta no jardim da escola.',
    legenda: 'Era uma noite quieta no jardim da escola.'
  },
  {
    cena: 'vento',
    texto: 'Um vento levou as palavras que davam nome às coisas.',
    legenda: 'Um vento levou as palavras que davam nome às coisas.'
  },
  {
    cena: 'nix',
    texto: 'Então Nix acendeu. Nix guarda o código das palavras.',
    legenda: 'Então Nix acendeu. Nix guarda o código das palavras.'
  },
  {
    cena: 'convite',
    texto: 'Nix precisa de você para trazer VASO, ÁGUA e FLOR de volta.',
    legenda: 'Nix precisa de você para trazer as palavras vaso, água e flor de volta.'
  }
];

/* Personalização do personagem. Opções pensadas para representatividade
   e para escolha rápida (poucos passos, sem sobrecarga visual). */
export const PERSONALIZACAO = {
  nome: { maximo: 14, padrao: '' },
  pele: ['#f6d7c0', '#e8b48c', '#c98c5e', '#8d5a3a', '#5b3625'],
  cabelo: ['#2b2118', '#6b4423', '#c9903c', '#9b2226', '#3f5c8a'],
  penteado: ['curto', 'cacheado', 'trancas', 'longo'],
  roupa: ['#1d1ed8', '#16a34a', '#e11d48', '#f59e0b', '#7c3aed'],
  acessorio: ['nenhum', 'oculos', 'fone', 'lenco']
};

/* Perfis de acessibilidade — atalhos que ajustam vários recursos de uma vez.
   Todos os recursos continuam ajustáveis individualmente. */
export const PERFIS = {
  padrao: {
    rotulo: 'Padrão',
    descricao: 'Som, voz e legendas ligados.',
    ajustes: { som: true, voz: true, legenda: true, libras: false, movimento: true, contraste: false, textoGrande: false }
  },
  surdo: {
    rotulo: 'Visual / Libras',
    descricao: 'Legendas sempre visíveis, janela de Libras e retorno visual reforçado.',
    ajustes: { som: false, voz: false, legenda: true, libras: true, movimento: true, contraste: false, textoGrande: false }
  },
  baixoEstimulo: {
    rotulo: 'Baixo estímulo',
    descricao: 'Menos movimento, cores suaves, sons curtos e avisos do que vem a seguir.',
    ajustes: { som: false, voz: true, legenda: true, libras: false, movimento: false, contraste: false, textoGrande: true }
  },
  baixaVisao: {
    rotulo: 'Baixa visão',
    descricao: 'Alto contraste, texto grande e narração ligada.',
    ajustes: { som: true, voz: true, legenda: true, libras: false, movimento: true, contraste: true, textoGrande: true }
  }
};

/* Chaves de armazenamento local (funciona offline, sem servidor). */
export const CHAVES = {
  sessao: 'nix.sessao.v1',
  ajustes: 'nix.ajustes.v1',
  relatorios: 'nix.relatorios.v1'
};
