// Gera src/environments/environment.ts a partir da variável de ambiente API_URL.
// A Vercel injeta as env vars configuradas no dashboard do projeto em `process.env`
// no momento do build, então este script roda como "prebuild" (veja package.json).
//
// Localmente, quem não usa Vercel pode em vez disso criar um arquivo `.env` (veja
// `.env.example`) com `API_URL=...`. Uma env var já definida no processo (ex.: pela
// Vercel, ou exportada manualmente no terminal) sempre tem prioridade sobre o `.env`.
const fs = require('fs');
const path = require('path');

function carregarDotEnv(caminho) {
  if (!fs.existsSync(caminho)) {
    return;
  }
  for (const linha of fs.readFileSync(caminho, 'utf8').split('\n')) {
    const semComentario = linha.trim();
    if (!semComentario || semComentario.startsWith('#')) {
      continue;
    }
    const separador = semComentario.indexOf('=');
    if (separador === -1) {
      continue;
    }
    const chave = semComentario.slice(0, separador).trim();
    let valor = semComentario.slice(separador + 1).trim();
    if (
      (valor.startsWith('"') && valor.endsWith('"')) ||
      (valor.startsWith("'") && valor.endsWith("'"))
    ) {
      valor = valor.slice(1, -1);
    }
    if (!(chave in process.env)) {
      process.env[chave] = valor;
    }
  }
}

carregarDotEnv(path.join(__dirname, '..', '.env'));

const apiUrl = process.env['API_URL'] || 'http://localhost:8080/';
const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl : apiUrl + '/';

const content = `// Arquivo gerado automaticamente por scripts/set-env.js a partir da env var API_URL. Não edite manualmente.
export const environment = {
  apiUrl: '${normalizedApiUrl}',
};
`;

const outputPath = path.join(__dirname, '..', 'src', 'environments', 'environment.ts');
fs.writeFileSync(outputPath, content);
console.log(`[set-env] environment.ts gerado com apiUrl = ${normalizedApiUrl}`);
