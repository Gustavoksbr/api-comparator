// Gera src/environments/environment.ts a partir da variável de ambiente API_URL.
// A Vercel injeta as env vars configuradas no dashboard do projeto em `process.env`
// no momento do build, então este script roda como "prebuild" (veja package.json).
const fs = require('fs');
const path = require('path');

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
