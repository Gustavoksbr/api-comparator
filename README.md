# API Comparator

## 🧪 Acesse em: [https://api-comparator.vercel.app/](https://api-comparator.vercel.app/)

## 📘 Descrição do Projeto

O **API Comparator** compara diferentes estilos arquiteturais baseados no protocolo HTTP (**REST**, **GraphQL** e **SOAP**) para os seguintes casos de uso:

* Listar todos os cursos
* Procurar curso (por código ou por outro atributo)
* Criar curso
* Alterar curso
* Deletar curso

Utiliza Angular 18, SPA, standalone components, **Reactive Forms** e **Signals**. Como biblioteca externa, utiliza `ngx-highlight-js` para destacar o código das requisições e respostas.

O projeto consome a api [https://cursos-api-7vr6.onrender.com](https://cursos-api-7vr6.onrender.com), cujo código está em [https://github.com/Gustavoksbr/curso-maker](https://github.com/Gustavoksbr/curso-maker)

---

## 🤔 Como Usar

1. Escolha um **caso de uso** no topo da página (Listar, Criar, Atualizar, etc.).
2. Preencha os campos do formulário.
3. Observe como as requisições **REST**, **GraphQL** e **SOAP** são geradas automaticamente.
4. Clique em **Executar** em cada comparador para fazer a chamada a API e ver o *body response* correspondente.

---

## ⚙️ Principais Funcionalidades

### 🔄 Formulário Dinâmico

* O usuário escolhe o **caso de uso** (listar, criar, atualizar, etc.).
* Os campos de input mudam conforme a operação.
* Conforme o usuário digita, **os três comparadores (REST, GraphQL e SOAP)** são atualizados em tempo real, mostrando a requisição correspondente àquele tipo de API.
* Combina Reactive Forms com Signals

### 🔍 Componentes de Comparação

Cada comparador exibe:

* O **request formatado** (JSON, GraphQL ou XML).
* Um **botão “Executar”**, que envia a requisição real ao back-end e exibe o body response retornado.

O componente **GraphQL** possui um **checklist** para que o usuário escolha quais campos deseja no corpo da resposta (`código`, `título`, `descrição`, `carga horária`).

### 🧠 Reatividade com Signals

O serviço [curso-signal.service.ts](src/app/services/curso-signal/curso-signal.service.ts) utiliza **Angular Signals** para manter os dados compartilhados entre os componentes sincronizados. Assim, qualquer mudança feita no formulário é refletida automaticamente nos comparadores.

### 📡 Comunicação com o Back-end

O serviço [curso-api.service.ts](src/app/services/curso-api/curso-api.service.ts) é responsável por fazer as verdadeiras requisições HTTP para o back-end.

### ☀️🌙 Tema Claro/Escuro

O usuário pode alternar entre tema claro e escuro, cujas variáveis das cores são definidas em [./src/styles.css](./src/styles.css). Por padrão, o tema é escuro.

---

## 🧩 Estrutura da Aplicação

```
src/app
│
├── components
│   ├── comparators/            # Compara como ficaria a requisição em cada API
│   ├── front-forms/            # Formulário dinâmico
│   └── layout-externo/         # Header, Section e Footer. Componentes estáticos
│
├── models/                     # Interfaces e tipos compartilhados (CasoDeUso, ApiTipo e CursoRequest)
│
├── services/
│   ├── curso-api.service.ts    # Realiza requisições REST, GraphQL e SOAP para o back-end
│   └── curso-signal.service.ts # Gerencia estado reativo com Signals
```

---

## 💻 Como Executar o Projeto Localmente

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/Gustavoksbr/api-comparator.git
cd api-comparator
```

### 2️⃣ Instalar dependências

```bash
npm install
```

### 3️⃣ Executar a aplicação

```bash
ng serve
```

Acesse no navegador:

```
http://localhost:4200
```

---

## 🧪 Testes Automatizados

O projeto possui **testes unitários** e de integração com **Jest** e **testes e2e** usando **Cypress** .

### ✅ Jest

Testes unitários e de integração de serviços e componentes

Testei isoladamente os formularios de cada caso de uso (validando valores minimos e maximos), mockando o serviço de signal para manter o teste isolado

Também testei a funcionalidade de mudar o tema claro/escuro. Resolvi fazer um teste de integração, utilizando o verdadeiro servico de mudar tema claro-escuro de  em vez de mockar.

Para rodar os testes Jest:

```bash
npm test
```

### ✅ Cypress

Testes de fluxo completo, incluindo criação, busca, alteração e exclusão de cursos, verificando requisições REST, GraphQL e SOAP.

A ideia é principalmente testar vários componentes trabalhando juntos. Por exemplo, ao digitar no formulario (um componente), deve mudar o body request (outro componente) e, ao clicar em executar, deve retornar o body response correto (outro componente).

Testei endpoints chamando o back end real, mas tomando cuidado para não alterar dados. Não só adicionei endpoints de leitura, mas também criar, alterar e deletar curso, tendo a certeza que vai dar erro pois há cursos apenas leitura no sistema (de código c1 a c10). Eles foram criados inicialmente para manter uma quantidade mínima de cursos, mas também podem ser bons para testes e2e.

Ele fica fora da pasta src:
```
│
├── cypress
│  └──  e2e
│
├── src/app
│  └── ... 
```

Antes de executar o Cypress, certifique-se de que a aplicação Angular está rodando localmente com `ng serve`.

Você pode alterar a URL do Angular no arquivo `./cypress.env.json`:
```json
{
  "BASE_URL": "http://localhost:4200"
}

```

Para executar o Cypress

```bash
npm run cypress:run
```
Ou para abrir a interface gráfica do Cypress:

```bash
npm run cypress:open
```



---

## 📚 Dependências Externas

* `ngx-highlight-js` para destacar o código das requisições.
* Arquivos CSS e JS de highlight retirados de:

  * [highlight.min.js](https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@latest/build/highlight.min.js)
  * [atom-one-dark.min.css](https://codepen.io/zsty/pen/gxxQLe)
  * [atom-one-light.min.css](https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@latest/build/styles/atom-one-light.min.css)

Os arquivos JS foram movidos para `./public/vendor/atom-one.min.js` e os estilos foram extraídos para `./src/styles.css`.

---

## 🚀 Futuras Implementações

* Adicionar mais campos para os cursos (instrutor, nível, categoria, etc).
* Adicionar autenticação e autorização.
* Simular um front-end real de um site de cursos.

---

## 🧾 Licença

Projeto livre para fins educacionais e demonstração de integração entre diferentes paradigmas de API utilizando Angular 18.
