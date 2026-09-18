# API Comparator

Repositório único do projeto: um comparador de **REST**, **GraphQL** e **SOAP** para o
mesmo domínio de "cursos".

- [`web/`](web) — front-end em Angular 18 (o comparador em si).
- [`api/`](api) — back-end em **PHP** (antes era Java/Spring), expondo REST, GraphQL e
  SOAP sobre **sandboxes de cursos isolados por visitante**, sem banco de dados
  persistente. Veja [`api/README.md`](api/README.md) para o porquê dessa escolha.

## Por que não há mais MongoDB

O projeto é didático — seu foco é comparar estilos de API, não persistência de dados.
Manter um banco de dados real e publicamente exposto (como era o caso do MongoDB Atlas
usado antes) não tinha propósito pedagógico e trazia um risco real: a URI de conexão
sendo usada para leitura/escrita por qualquer pessoa.

Em vez disso, cada visitante recebe seu próprio sandbox de cursos, identificado por um
id gerado no navegador (sem login, sem cookie — header `X-Session-Id`). Os dados vivem
só enquanto o sandbox estiver ativo (expiram após 30 min de inatividade, ou no
reinício/deploy do host) e nunca são compartilhados entre visitantes. Detalhes em
[`api/README.md`](api/README.md#sem-banco-de-dados-persistente-de-propósito-sandboxes-por-visitante).

O header da aplicação mostra o id do sandbox atual (os 8 primeiros caracteres) e tem um
botão "Novo sandbox" para trocar para um sandbox vazio sem esperar o TTL.

## Um domínio mais rico, e um log do tráfego real

Além dos quatro campos originais, cada curso agora tem `nivel` (enum), `preco`
(decimal), `ativo` (booleano), `criadoEm`/`atualizadoEm` (data/hora), `tags` (lista) e
`instrutor`/`modulos` (objeto aninhado / lista de objetos) — o suficiente para expor
onde REST, GraphQL e SOAP representam o mesmo dado de formas bem diferentes. Ver
[`api/README.md`](api/README.md#um-domínio-com-tipos-mais-diversos).

O painel **"Wire log"**, abaixo dos três comparadores, mostra o tráfego real medido no
servidor para cada chamada feita nesse sandbox: bytes de request/response, duração, e
campos pedidos vs. recebidos (over-fetching) — a comparação que o JavaScript do
navegador não tem como fazer por conta própria. Ver
[`api/README.md`](api/README.md#wire-log-o-tráfego-real-medido-no-servidor).

## Deploy

- **`web/`** → Vercel. Configure a env var `API_URL` no dashboard do projeto apontando
  para a URL pública da API.
- **`api/`** → Render (ou qualquer serviço com suporte a Docker), usando o
  `Dockerfile` em [`api/`](api).

## Desenvolvimento local

```bash
# Terminal 1 — API
cd api
php -S localhost:8080 -t public public/router.php

# Terminal 2 — Web
cd web
npm install
ng serve
```
