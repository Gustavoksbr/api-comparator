# API Comparator (PHP)

Backend do **API Comparator**, reescrito em **PHP puro** (sem framework e sem dependências
externas), expondo o mesmo domínio de "cursos" através de três tipos de API:

- **REST** — `/cursos`
- **GraphQL** — `/graphql`
- **SOAP** — `/ws/cursos`

## Sem banco de dados persistente, de propósito: sandboxes por visitante

Este projeto é **didático**: seu objetivo é comparar REST, GraphQL e SOAP, não ensinar
persistência de dados. A versão anterior usava MongoDB Atlas, o que trazia um problema
real: o banco ficava publicamente alcançável, e qualquer visitante do site com a URI
podia ler ou alterar os dados de todo mundo.

A solução aqui não é só "tirar o banco" — é isolar cada visitante no seu próprio
**sandbox** de cursos, sem login e sem cookie:

- O front gera um id aleatório no primeiro acesso, guarda no `localStorage` do
  navegador ([`sessao.service.ts`](../web/src/app/services/sessao/sessao.service.ts))
  e o envia em todo request no header `X-Session-Id`.
- O back usa esse id para isolar o CRUD de cada visitante
  (`src/Sandbox/Sandboxes.php`): cada sandbox nasce semeado com os mesmos 10 cursos de
  exemplo (`c1` a `c10` — veja `src/Sandbox/Seed.php`), e as mutações de um visitante
  nunca são visíveis para outro. Todos os cursos, incluindo os de seed, podem ser
  editados e deletados livremente: a antiga trava de "somente leitura" existia porque o
  MongoDB era compartilhado entre todo mundo, e deixou de fazer sentido com o
  isolamento por sandbox.
- Sandboxes inativos por 30 minutos são descartados automaticamente, e há um teto
  global de 500 sandboxes vivos (o mais antigo cai primeiro se o teto for atingido) —
  veja `Sandboxes::TTL_SEGUNDOS` e `Sandboxes::MAX_SANDBOXES`. Cada sandbox também tem
  um teto de 50 cursos (`CursoRepository::MAX_CURSOS`, erro 429/`TOO_MANY_REQUESTS`),
  para um único visitante não esgotar o armazenamento do host.
- `POST /_sandbox/reset` (com o mesmo header `X-Session-Id`) devolve o sandbox ao
  estado inicial, sem esperar o TTL.

Nada disso é persistido de propósito: se o host reiniciar, o próximo acesso re-semeia.
Estado descartável é a feature, não uma limitação.

### Onde os sandboxes vivem (`src/Persistencia`)

O modelo de execução do PHP decide o que é possível:

- Sob um runtime com **worker mode** real (o processo sobrevive entre requisições,
  ex.: FrankenPHP), um array em memória (`DepositoEmMemoria`) basta e é o caminho mais
  rápido.
- Sob o **servidor embutido do PHP** (`php -S`, o que o `Dockerfile` deste projeto usa),
  cada requisição roda numa execução isolada do interpretador — um array estático não
  sobrevive a nada. Por isso o driver efetivamente usado aqui é `DepositoEmArquivo`:
  cada sandbox vira um arquivo JSON em `sys_get_temp_dir()/api-comparator/sandboxes/`,
  nunca exposto pela rede, e apagado quando expira ou quando o host reinicia. Essa
  escolha é automática (`Http\Router::depositoPadrao()`), mas pode ser forçada com a
  env var `SANDBOX_DRIVER=memoria|arquivo`.

## Arquitetura

Mesma arquitetura em 3 camadas do backend Java original, com o sandboxing entrando
como uma camada de acesso a dados adicional:

- **Controller** (`src/Controller`): recebe a requisição HTTP/GraphQL/SOAP e traduz o
  resultado (ou exceção) do `CursoService` em uma resposta.
- **Domain** (`src/Domain`): `CursoService` (casos de uso), `CursoValidator` (regras de
  validação) e os modelos `Curso`/`CursoParaAtualizar`/`Nivel`/`Instrutor`/`Modulo`.
- **Repository** (`src/Repository`): `CursoRepository`, o CRUD de um único sandbox.
- **Sandbox** (`src/Sandbox`): `Sandboxes` (seleciona/semeia/expira sandboxes),
  `Armazenamento` (mapeia `Curso` de e para o depósito) e `Seed` (dados iniciais).
- **Persistência** (`src/Persistencia`): `Deposito`, a interface de armazenamento
  chave-valor por trás dos sandboxes, com os drivers `DepositoEmMemoria` e
  `DepositoEmArquivo`.
- **Wire** (`src/Wire`): `Registro`/`WireLog`, o log de tráfego real medido no
  servidor (ver seção própria abaixo).

O roteamento (`src/Http/Router.php`) decide qual controller chamar a partir do path da
requisição (e monta o sandbox certo a partir do header `X-Session-Id`);
`public/index.php` é o front controller.

## Um domínio com tipos mais diversos

Além de `codigo`/`titulo`/`descricao`/`cargaHoraria`, cada curso tem:

- `nivel` — enum (`INICIANTE`/`INTERMEDIARIO`/`AVANCADO`): de primeira classe no
  GraphQL (`enum Nivel`) e documentado no XSD como uma `xs:simpleType` com
  `enumeration`; no REST é só uma `string`, e a validação sobra para a aplicação.
- `preco` — decimal: `number` em JSON é float binário e perde a garantia de exatidão
  que `xs:decimal` tem no XSD. `CursoValidator` rejeita mais de 2 casas decimais.
- `ativo` — booleano, trivial em todo lugar.
- `criadoEm`/`atualizadoEm` — data/hora (ISO 8601), sempre derivadas no servidor
  (o cliente nunca as define). Tratadas como `String` no GraphQL "sob medida" deste
  projeto — um scalar `DataHora` de verdade exigiria um motor GraphQL completo.
- `tags` — lista de strings.
- `instrutor` — objeto aninhado (`nome`, `email`, `bio`).
- `modulos` — lista de objetos aninhados (`ordem`, `titulo`, `duracaoMinutos`).

Ver `schema.graphqls` e `cursos.xsd` (documentais — os controllers fazem o
parsing/montagem à mão, sem carregar esses arquivos em runtime) para a forma exata de
cada campo em cada leg, e `Controller\CursoGraphqlController`/`CursoSoapController`
para como listas e objetos aninhados são interpretados e montados.

O REST também aceita `?campos=codigo,instrutor.nome,modulos.titulo` para pedir só um
subconjunto de campos (sintaxe inventada por este projeto, sem contrato nenhum) — é o
que deixa a comparação de over-fetching com o GraphQL (que faz o mesmo de forma nativa,
via seleção de campos) honesta no Wire log.

## Wire log: o tráfego real, medido no servidor

`GET /_wire` (e `DELETE /_wire` para limpar) devolvem, para o sandbox do
`X-Session-Id` que fez a chamada, uma lista das últimas 60 chamadas REST/GraphQL/SOAP
com:

- bytes de request e response (e response comprimido via gzip, se `ext-zlib` estiver
  disponível);
- duração em milissegundos;
- campos pedidos vs. campos recebidos (over-fetching) — no REST via `?campos=`, no
  GraphQL via seleção da query; no SOAP é sempre `null`, e de propósito: document/
  literal wrapped não tem como pedir menos.

É a razão pela qual este comparador não pode ser só frontend: o JavaScript do
navegador não vê bytes crus nem consegue medir compressão — a Resource Timing API do
browser para no `transferSize`. Ver `src/Wire/Registro.php` e `Http\Router::medir()`.

## Rodando localmente

```bash
php -S localhost:8080 -t public public/router.php
```

## Deploy (Render)

O `Dockerfile` já está pronto para builds via Docker no Render (ou qualquer serviço que
suporte Docker). Configure o serviço para expor a porta definida em `$PORT` (o Render
injeta essa variável automaticamente).
