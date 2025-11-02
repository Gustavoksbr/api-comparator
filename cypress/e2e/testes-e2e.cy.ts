// cypress/e2e/procurar-cursos-fluxo-completo.cy.ts
// Testes de fluxo completo: Formulário → Body Request → Execução → Body Response
const BASE_URL = Cypress.env('BASE_URL') || 'http://localhasdasdadsasdadsost:420sssssssssss0';
describe('Procurar Cursos - Fluxo Completo', () => {

  it('Deve buscar curso c8 por código em REST, GRAPHQL e SOAP', () => {
    cy.visit(BASE_URL);
    cy.get('[data-test-id="botao-procurar"]').click();

    // Preencher formulário
    cy.get('[data-test-id="procurar-input-codigo"]').type('c8');

    // Testar REST
    cy.get('[data-test-id="api-type-header-rest"]').click();
    cy.wait(200);

    cy.get('[data-test-id="url-da-api-rest"]')
      .should('contain', 'c8');
    cy.get(`[data-test-id="botao-executar-rest"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-rest"]')
      .should('contain', '200');

    cy.get('[data-test-id="body-response-textarea-rest"]')
      .should('contain', 'c8')
      .and('contain', 'APIs com Node.js')
      .and('contain', 'Crie e consuma APIs RESTful utilizando Node.js e Express')
      .and('contain', '100');

    // Testar GRAPHQL
    cy.get('[data-test-id="api-type-header-graphql"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-graphql"]')
      .should('contain', 'c8')
      .and('contain', 'query');

    cy.get(`[data-test-id="botao-executar-graphql"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-graphql"]')
      .should('contain', '200');

    cy.get('[data-test-id="body-response-textarea-graphql"]')
      .should('contain', 'getCursoByCodigo')
      .and('contain', 'c8')
      .and('contain', 'APIs com Node.js')
      .and('contain', '100');

    // Testar SOAP
    cy.get('[data-test-id="api-type-header-soap"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-soap"]')
      .should('contain', 'c8')
      .and('contain', 'soap:Envelope');

    cy.get(`[data-test-id="botao-executar-soap"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-soap"]')
      .should('contain', '200');

    cy.get('[data-test-id="body-response-textarea-soap"]')
      .should('contain', 'c8')
      .and('contain', 'APIs com Node.js')
      .and('contain', 'SOAP-ENV:Envelope')
      .and('contain', '100');
  });

  it('Deve buscar cursos por parâmetros com filtro de carga horária (excluir c9, incluir c8)', () => {
    cy.visit(BASE_URL);
    cy.get('[data-test-id="botao-procurar"]').click();

    // Alternar para busca por parâmetros
    cy.get('[data-test-id="procurar-botao-por-parametros"]').click();

    // Filtrar por carga horária: maior que 50 e menor que 120
    cy.get('[data-test-id="procurar-input-min-carga-horaria"]').type('50');
    cy.get('[data-test-id="procurar-input-max-carga-horaria"]').type('120');

    // Testar REST
    cy.get('[data-test-id="api-type-header-rest"]').click();
    cy.wait(200);

    cy.get('[data-test-id="url-da-api-rest"]')
      .should('contain', 'minCargaHoraria=50')
      .and('contain', 'maxCargaHoraria=120');

    cy.get(`[data-test-id="botao-executar-rest"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-rest"]')
      .should('contain', '200');

    // Deve conter c8 (100h) e não conter c9 (40h)
    cy.get('[data-test-id="body-response-textarea-rest"]')
      .should('contain', 'c8')
      .and('contain', 'APIs com Node.js')
      .and('not.contain', 'c9')
      .and('not.contain', 'Git e GitHub');

    // Testar GRAPHQL
    cy.get('[data-test-id="api-type-header-graphql"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-graphql"]')
      .should('contain', 'minCargaHoraria: 50')
      .and('contain', 'maxCargaHoraria: 120');

    cy.get(`[data-test-id="botao-executar-graphql"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-textarea-graphql"]')
      .should('contain', 'c8')
      .and('not.contain', 'c9');

    // Testar SOAP
    cy.get('[data-test-id="api-type-header-soap"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-soap"]')
      .should('contain', '50')
      .and('contain', '120');

    cy.get(`[data-test-id="botao-executar-soap"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-textarea-soap"]')
      .should('contain', 'c8')
      .and('not.contain', 'c9');
  });

  it('Deve buscar cursos por substring de título', () => {
    cy.visit(BASE_URL);
    cy.get('[data-test-id="botao-procurar"]').click();
    cy.get('[data-test-id="procurar-botao-por-parametros"]').click();

    cy.get('[data-test-id="procurar-input-titulo"]').type('Node');

    // Testar GRAPHQL com campos personalizados
    cy.get('[data-test-id="api-type-header-graphql"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-graphql"]')
      .should('contain', 'titulo: "Node"')
      .and('contain','{\n' +
        '            \tcodigo\n' +
        '\t\ttitulo\n' +
        '\t\tdescricao\n' +
        '\t\tcargaHoraria\n' +
        '            }');

    // Desselecionar descricao

    cy.get('[data-test-id="selecionar-atributos-para-response-content-graphql"]')
      .contains('label', 'descricao')
      .find('input[type="checkbox"]')
      .uncheck();

    cy.get('[data-test-id="body-request-textarea-graphql"]')
      .should('contain', 'titulo: "Node"')
      .and('contain','{\n' +
        '            \tcodigo\n' +
        '\t\ttitulo\n' +
        '\t\tcargaHoraria\n' +
        '            }')
      .and('not.contain','{\n' +
        '            \tcodigo\n' +
        '\t\ttitulo\n' +
        '\t\tdescricao\n' +
        '\t\tcargaHoraria\n' +
        '            }');

    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-graphql"]')
      .should('contain', 'titulo: "Node"')
      .and('contain', 'codigo')
      .and('contain', 'titulo')
      .and('contain', 'cargaHoraria')
      .and('not.contain', '{\n' +
        '        codigo\n' +
        '\ttitulo\n' +
        '\tdescricao\n' +
        '\tcargaHoraria\n' +
        '        }\n' +
        '}');

    cy.get(`[data-test-id="botao-executar-graphql"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-textarea-graphql"]')
      .should('contain', 'APIs com Node.js');

    // Testar REST
    cy.get('[data-test-id="api-type-header-rest"]').click();
    cy.wait(200);

    cy.get(`[data-test-id="botao-executar-rest"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-textarea-rest"]')
      .should('contain', 'Node');
  });
});


// cypress/e2e/criar-cursos-fluxo-completo.cy.ts
// Testes de criação com erro proposital (código duplicado)

describe('Fluxo Completo com Erros (criar curso codigo duplicado, + alterar e deletar curso apenas leitura', () => {

  it('Deve tentar criar curso com código duplicado c8 em REST, GRAPHQL e SOAP', () => {
    cy.visit(BASE_URL);
    cy.get('[data-test-id="botao-criar"]').click();

    // Preencher formulário com código duplicado
    cy.get('[data-test-id="criar-input-codigo"]').type('c8');
    cy.get('[data-test-id="criar-input-titulo"]').type('Curso Teste');
    cy.get('[data-test-id="criar-textarea-descricao"]').type('Descrição do curso teste');
    cy.get('[data-test-id="criar-input-carga-horaria"]').type('60');

    // Testar REST - Status 409 Conflict
    cy.get('[data-test-id="api-type-header-rest"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-rest"]')
      .should('contain', 'c8')
      .and('contain', 'Curso Teste')
      .and('contain', '60');

    cy.get(`[data-test-id="botao-executar-rest"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-rest"]')
      .should('contain', '409');

    cy.get('[data-test-id="body-response-textarea-rest"]')
      .should('contain', 'Curso com o mesmo código já existente');

    // Testar GRAPHQL - Status 200 mas com errors
    cy.get('[data-test-id="api-type-header-graphql"]').click();
    cy.wait(200);

    // Personalizar campos (só codigo e titulo)
    cy.get('[data-test-id="selecionar-atributos-para-response-content-graphql"]')
      .contains('label', 'descricao')
      .find('input[type="checkbox"]')
      .uncheck();

    cy.get('[data-test-id="selecionar-atributos-para-response-content-graphql"]')
      .contains('label', 'cargaHoraria')
      .find('input[type="checkbox"]')
      .uncheck();

    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-graphql"]')
      .should('contain', 'codigo: "c8"')
      .and('contain', 'mutation');

    cy.get(`[data-test-id="botao-executar-graphql"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-graphql"]')
      .should('contain', '200');

    cy.get('[data-test-id="body-response-textarea-graphql"]')
      .should('contain', 'errors')
      .and('contain', 'Curso com o mesmo código já existente')
      .and('contain', 'CONFLICT');

    // Testar SOAP - Status 500
    cy.get('[data-test-id="api-type-header-soap"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-soap"]')
      .should('contain', 'c8')
      .and('contain', 'Curso Teste');

    cy.get(`[data-test-id="botao-executar-soap"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-soap"]')
      .should('contain', '500');

    cy.get('[data-test-id="body-response-textarea-soap"]')
      .should('contain', 'SOAP-ENV:Fault')
      .and('contain', 'Curso com o mesmo código já existente');
  });
  it('Deve tentar alterar curso somente leitura c1 + nao deve perder o as informacoes ao mudar de caso de uso', () => {
    const codigo = 'c1';

    cy.visit(BASE_URL);
    cy.get('[data-test-id="botao-alterar"]').click();

    cy.get('[data-test-id="alterar-input-codigo"]').type(codigo);
    cy.get('[data-test-id="alterar-input-titulo"]').type('Novo Título');

    // Testar REST
    cy.get('[data-test-id="api-type-header-rest"]').click();
    cy.wait(200);

    cy.get(`[data-test-id="botao-executar-rest"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-rest"]')
      .should('contain', '400');

    cy.get('[data-test-id="body-response-textarea-rest"]')
      .should('contain', 'somente leitura');

    // Testar GRAPHQL

    cy.get('[data-test-id="api-type-header-graphql"]').click();

    cy.get(`[data-test-id="botao-executar-graphql"]`).click();
    cy.wait(1200);
    cy.get('[data-test-id="body-response-status-code-graphql"]')
      .should('contain', '200');
    cy.get('[data-test-id="body-response-textarea-graphql"]')
      .should('contain', 'errors')
      .and('contain', 'somente leitura');
    // Testar SOAP
    cy.get('[data-test-id="api-type-header-soap"]').click();
    cy.get(`[data-test-id="botao-executar-soap"]`).click();
    cy.wait(1200);
    cy.get('[data-test-id="body-response-status-code-soap"]')
      .should('contain', '500');
    cy.get('[data-test-id="body-response-textarea-soap"]')
      .should('contain', 'SOAP-ENV:Fault')
      .and('contain', 'somente leitura');

    // alterar para caso de uso buscar por id, e executar com curso c2, e voltar para caso de uso alterar e verificar se os dados estao mantidos
    cy.get('[data-test-id="botao-procurar"]').click();
    cy.get('[data-test-id="procurar-input-codigo"]').type('c2');
    cy.get(`[data-test-id="botao-executar-rest"]`).click();
    cy.wait(1200);
    cy.get('[data-test-id="body-response-textarea-rest"]')
      .should('contain', 'c2');
    cy.get('[data-test-id="botao-alterar"]').click();
    cy.get('[data-test-id="alterar-input-codigo"]').should('have.value', codigo);
    cy.get('[data-test-id="alterar-input-titulo"]').should('have.value', 'Novo Título');
    cy.get('[data-test-id="body-request-textarea-rest"]').should('contain', 'Novo Título'); // Verificar se o body request ainda esta com o curso c1
    cy.get('[data-test-id="body-response-textarea-rest"]').should('contain', 'somente leitura'); // Verificar se o body response do erro ainda esta presente

    cy.get('[data-test-id="botao-procurar"]').click();
    cy.get('[data-test-id="url-da-api-rest"]').should('contain', 'c2')
      .and('not.contain', 'Novo Titulo');
  });
  it('Deve tentar deletar curso somente leitura c8 em REST, GRAPHQL e SOAP', () => {
    cy.visit(BASE_URL);
    cy.get('[data-test-id="botao-deletar"]').click();

    cy.get('[data-test-id="deletar-input-codigo"]').type('c8');

    // Testar REST - Status 400
    cy.get('[data-test-id="api-type-header-rest"]').click();
    cy.wait(200);

    cy.get('[data-test-id="url-da-api-rest"]')
      .should('contain', 'c8');

    cy.get(`[data-test-id="botao-executar-rest"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-rest"]')
      .should('contain', '400');

    cy.get('[data-test-id="body-response-textarea-rest"]')
      .should('contain', 'somente leitura')
      .and('contain', 'não pode ser deletado');

    // Testar GRAPHQL
    cy.get('[data-test-id="api-type-header-graphql"]').click();
    cy.wait(200);

    cy.get('[data-test-id="body-request-textarea-graphql"]')
      .should('contain', 'deleteCurso')
      .and('contain', 'c8');

    cy.get(`[data-test-id="botao-executar-graphql"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-graphql"]')
      .should('contain', '200');

    cy.get('[data-test-id="body-response-textarea-graphql"]')
      .should('contain', 'errors')
      .and('contain', 'somente leitura')
      .and('contain', 'não pode ser deletado');

    // Testar SOAP
    cy.get('[data-test-id="api-type-header-soap"]').click();
    cy.wait(200);

    cy.get(`[data-test-id="botao-executar-soap"]`).click();
    cy.wait(1200);

    cy.get('[data-test-id="body-response-status-code-soap"]')
      .should('contain', '500');

    cy.get('[data-test-id="body-response-textarea-soap"]')
      .should('contain', 'SOAP-ENV:Fault')
      .and('contain', 'não pode ser deletado');
  });
});

