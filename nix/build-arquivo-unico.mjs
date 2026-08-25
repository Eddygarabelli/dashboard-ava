/* Gera uma versão do jogo em arquivo único (nix-arquivo-unico.html).
   Junta HTML, CSS e todos os módulos ES num só arquivo, para o jogo poder ser
   copiado num pendrive, aberto direto pelo navegador (sem servidor) e
   publicado como link. Rode com:  node nix/build-arquivo-unico.mjs           */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = dirname(fileURLToPath(import.meta.url));

/* ordem de dependência dos módulos */
const MODULOS = [
  'js/config.js',
  'js/acessibilidade.js',
  'js/som.js',
  'js/desenho.js',
  'js/estado.js',
  'js/interface.js',
  'js/midia.js',
  'js/mundo.js',
  'js/tarefas.js',
  'js/cenas/abertura.js',
  'js/cenas/personalizar.js',
  'js/cenas/encerramento.js',
  'js/jogo.js'
];

const chave = (caminho) => basename(caminho, '.js');

/* Cada módulo vira uma função isolada que devolve seus exports; os imports
   viram leituras do registro. Assim nomes internos iguais em módulos
   diferentes (por exemplo `carregar`) não colidem. */
function converter(caminho) {
  /* junta imports quebrados em várias linhas antes de converter */
  const codigo = readFileSync(join(raiz, caminho), 'utf8')
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*'.+?';/gm,
             (trecho) => trecho.replace(/\s+/g, ' '));
  const linhas = codigo.split('\n');
  const exportados = new Set();
  const saida = [];

  for (let i = 0; i < linhas.length; i++) {
    let linha = linhas[i];

    const nomeado = linha.match(/^import\s+\{([^}]*)\}\s+from\s+'(.+?)';?\s*$/);
    if (nomeado) {
      saida.push(`  const {${nomeado[1]}} = registro['${chave(nomeado[2])}'];`);
      continue;
    }
    const estrela = linha.match(/^import\s+\*\s+as\s+(\w+)\s+from\s+'(.+?)';?\s*$/);
    if (estrela) {
      saida.push(`  const ${estrela[1]} = registro['${chave(estrela[2])}'];`);
      continue;
    }

    const decl = linha.match(/^export\s+(const|let|var|function|async function|class)\s+([A-Za-z0-9_$]+)/);
    if (decl) {
      exportados.add(decl[2]);
      linha = linha.replace(/^export\s+/, '');
    }
    saida.push('  ' + linha);
  }

  return `registro['${chave(caminho)}'] = (() => {\n${saida.join('\n')}\n  return { ${[...exportados].join(', ')} };\n})();`;
}

const css = readFileSync(join(raiz, 'css/nix.css'), 'utf8');
const html = readFileSync(join(raiz, 'index.html'), 'utf8');

const corpo = html
  .slice(html.indexOf('<body>') + 6, html.indexOf('</body>'))
  /* o painel do professor não acompanha o arquivo único */
  .replace(/\s*<a class="botao secundario" href="professor\.html">[\s\S]*?<\/a>/, '')
  .replace(/<script type="module">[\s\S]*?<\/script>/, '')
  .replace(
    'Material de pesquisa · uso educacional.',
    'Material de pesquisa · uso educacional. Versão em arquivo único — o painel do professor está na versão completa.'
  );

const bundle = `const registro = {};\n${MODULOS.map(converter).join('\n\n')}\nregistro['jogo'].iniciar();`;

const documento = `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nix: O Código das Palavras</title>
<meta name="description" content="Jogo educacional de alfabetização com acessibilidade — MVP em arquivo único.">
<style>
${css}
</style>
</head>
<body>
${corpo.trim()}
<script>
${bundle}
</script>
</body>
</html>
`;

writeFileSync(join(raiz, 'nix-arquivo-unico.html'), documento);
console.log('nix/nix-arquivo-unico.html gerado —',
  (Buffer.byteLength(documento) / 1024).toFixed(0) + ' KB');
