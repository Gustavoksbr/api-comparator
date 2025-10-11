﻿#  API Comparator


## 🧪 Acesse em: https://api-comparator.vercel.app/


## 📘 Descrição do Projeto

O **API Comparator** compara diferentes estilos arquiteturais baseados no protocolo HTTP (**REST**, **GraphQL** e **SOAP**) para os seguintes casos de uso:
* Listar todos os cursos
* Procurar curso (por código ou por outro atributo)
* Criar curso
* Alterar curso
* Deletar curso

Utiliza Angular 18, SPA, standalone components, **Reactive Forms** e **Signals**. Como biblioteca externa, utiliza `ngx-highlight-js` para destacar o código das requisições e respostas.

O projeto consome a api https://cursos-api-7vr6.onrender.com, cujo código está em https://github.com/Gustavoksbr/curso-maker

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

O serviço `curso-signal.service.ts` utiliza **Angular Signals** para manter os dados compartilhados entre os componentes sincronizados. Assim, qualquer mudança feita no formulário é refletida automaticamente nos comparadores.

### 📡 Comunicação com o Back-end

O serviço `curso-api.service.ts` é responsável por fazer as verdadeiras requisições HTTP para o back-end.

---

## 🧩 Estrutura da Aplicação

A aplicação é composta por uma única página dividida em seções visuais e componentes interativos:

```
src/app
│
├── components
│   ├── comparators/            # Compara como ficaria a requisição em cada api
│   ├── front-forms/            # Formulário dinâmico
│   └── layout-externo/         # Header, Section e Footer. Componentes estáticos
│
├── models/                     # Interfaces e tipos compartilhados (CasoDeUso, ApiTipo e CursoRequest)
│
├── services/
│   ├── curso-api.service.ts    # Realiza requisições REST, GraphQL e SOAP para o back-end
│   └── curso-signal.service.ts # Gerencia estado reativo com Signals
│

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


### 4️⃣ Executar a aplicação

```bash
ng serve
```

Acesse no navegador:

```
http://localhost:4200
```

---

## 🤔 Como Usar

1. Escolha um **caso de uso** no topo da página (Listar, Criar, Atualizar, etc.).
2. Preencha os campos do formulário.
3. Observe como as requisições **REST**, **GraphQL** e **SOAP** são geradas automaticamente.
4. Clique em **Executar** em cada comparador para ver o *body response* correspondente.

---


## 📚 Dependências Externas

Utilizei a biblioteca ngx-highlight-js e arquivos de css e js específicos para essa biblioteca, que eu peguei no site https://www.jsdelivr.com/

Eles servem especificamente para colorir o código das requisições e respostas, parecendo um editor de código

- [atom-one-light.min.css](https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@latest/build/styles/atom-one-light.min.css)
- [highlight.min.js](https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@latest/build/highlight.min.js)

---

## 🚀 Futuras Implementações

- Adicionar testes unitários e de integração.
- Adicionar mais campos para os cursos (ex: instrutor, nível, categoria, etc).
- Adicionar escolha de tema claro/escuro. (já importei o arquivo [atom-one-dark.min.css](https://codepen.io/zsty/pen/gxxQLe) do Daniel Gamage para isso)
- Adicionar autenticação e autorização.
- Simular um front end real de um site de cursos, e não apenas um comparador de APIs


---

## 🧾 Licença

Projeto livre para fins educacionais e demonstração de integração entre diferentes paradigmas de API utilizando Angular 18.
