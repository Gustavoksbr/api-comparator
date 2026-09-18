import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { SessaoService } from '../sessao/sessao.service';
import { SOAP_NAMESPACE } from '../../models/Models';

interface PostmanHeader {
  key: string;
  value: string;
}

interface PostmanRequestItem {
  name: string;
  request: {
    method: string;
    header: PostmanHeader[];
    url: { raw: string; host: string[]; path: string[]; query?: { key: string; value: string }[] };
    body?: { mode: 'raw'; raw: string; options?: { raw: { language: string } } };
  };
}

interface PostmanFolder {
  name: string;
  description?: string;
  item: PostmanRequestItem[];
}

/**
 * Gera uma collection do Postman (schema v2.1, compatível com Insomnia e
 * Bruno também) com um request de exemplo para cada caso de uso nos três
 * legs — REST, GraphQL e SOAP — e dispara o download no navegador.
 *
 * `{{baseUrl}}` e `{{sessionId}}` ficam como variáveis da collection: quem
 * importar já testa contra a API configurada (`environment.apiUrl`) e o
 * sandbox atual deste navegador, mas pode trocar os dois livremente depois.
 */
@Injectable({
  providedIn: 'root',
})
export class PostmanExportService {
  constructor(private sessaoService: SessaoService) {}

  exportar(): void {
    const collection = this.montarCollection();
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'api-comparator.postman_collection.json';
    link.click();

    URL.revokeObjectURL(url);
  }

  private montarCollection() {
    const baseUrlSemBarra = environment.apiUrl.endsWith('/') ? environment.apiUrl.slice(0, -1) : environment.apiUrl;

    return {
      info: {
        name: 'API Comparator (REST + GraphQL + SOAP)',
        description:
          'Exportado do comparador. Cada sandbox de cursos é isolado por visitante (header X-Session-Id) — ' +
          'veja a variável {{sessionId}}, já preenchida com o sandbox deste navegador no momento da exportação.',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        { key: 'baseUrl', value: baseUrlSemBarra },
        { key: 'sessionId', value: this.sessaoService.idDaSessao() },
      ],
      item: [this.folderRest(), this.folderGraphql(), this.folderSoap()],
    };
  }

  // ---------------------------------------------------------------- REST

  private folderRest(): PostmanFolder {
    const jsonHeaders: PostmanHeader[] = [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-Session-Id', value: '{{sessionId}}' },
    ];
    const semCorpo: PostmanHeader[] = [{ key: 'X-Session-Id', value: '{{sessionId}}' }];

    const cursoExemplo = JSON.stringify(this.cursoExemploObjeto(), null, 2);
    const patchExemplo = JSON.stringify({ titulo: 'Novo Título', preco: 199.9 }, null, 2);

    return {
      name: 'REST',
      item: [
        this.restItem('Listar todos os cursos', 'GET', ['cursos'], semCorpo),
        this.restItem('Buscar por parâmetros', 'GET', ['cursos'], semCorpo, [
          { key: 'titulo', value: 'API' },
          { key: 'minCargaHoraria', value: '10' },
          { key: 'maxCargaHoraria', value: '300' },
        ]),
        this.restItem('Buscar por código (com projeção de campos)', 'GET', ['cursos', 'c1'], semCorpo, [
          { key: 'campos', value: 'codigo,instrutor.nome,modulos.titulo' },
        ]),
        this.restItem('Criar curso', 'POST', ['cursos'], jsonHeaders, undefined, cursoExemplo),
        this.restItem('Alterar curso (patch parcial)', 'PUT', ['cursos', 'c1'], jsonHeaders, undefined, patchExemplo),
        this.restItem('Deletar curso', 'DELETE', ['cursos', 'c1'], semCorpo),
      ],
    };
  }

  private restItem(
    name: string,
    method: string,
    path: string[],
    header: PostmanHeader[],
    query?: { key: string; value: string }[],
    body?: string,
  ): PostmanRequestItem {
    const queryString = query ? '?' + query.map((q) => `${q.key}=${encodeURIComponent(q.value)}`).join('&') : '';
    return {
      name,
      request: {
        method,
        header,
        url: {
          raw: `{{baseUrl}}/${path.join('/')}${queryString}`,
          host: ['{{baseUrl}}'],
          path,
          ...(query ? { query } : {}),
        },
        ...(body ? { body: { mode: 'raw', raw: body, options: { raw: { language: 'json' } } } } : {}),
      },
    };
  }

  // ------------------------------------------------------------- GraphQL

  private folderGraphql(): PostmanFolder {
    const header: PostmanHeader[] = [
      { key: 'Content-Type', value: 'application/json' },
      { key: 'X-Session-Id', value: '{{sessionId}}' },
    ];

    const queries: Record<string, string> = {
      'listCursos (todos os campos, incluindo aninhados)': `query {
    listCursos {
        codigo
        titulo
        descricao
        cargaHoraria
        nivel
        preco
        ativo
        criadoEm
        atualizadoEm
        tags
        instrutor {
            nome
            email
            bio
        }
        modulos {
            ordem
            titulo
            duracaoMinutos
        }
    }
}`,
      'listCursos (só título de cada módulo — over-fetching zero)': `query {
    listCursos {
        codigo
        modulos {
            titulo
        }
    }
}`,
      'getCursoByCodigo': `query {
    getCursoByCodigo(codigo: "c1") {
        codigo
        titulo
        instrutor {
            nome
        }
    }
}`,
      'createCurso': `mutation {
    createCurso(
        codigo: "postman1",
        titulo: "Curso via Postman",
        descricao: "Criado a partir da collection exportada",
        cargaHoraria: 20,
        nivel: INTERMEDIARIO,
        preco: 149.9,
        ativo: true,
        tags: ["postman", "exemplo"],
        instrutor: {nome: "Fulano", email: "fulano@exemplo.dev", bio: "bio de exemplo"},
        modulos: [{titulo: "Introdução", duracaoMinutos: 30}]
    ) {
        codigo
        titulo
        instrutor {
            nome
        }
        modulos {
            titulo
            duracaoMinutos
        }
    }
}`,
      'updateCurso': `mutation {
    updateCurso(codigo: "c1", titulo: "Novo Título via Postman") {
        codigo
        titulo
    }
}`,
      'deleteCurso': `mutation {
    deleteCurso(codigo: "c1")
}`,
    };

    return {
      name: 'GraphQL',
      item: Object.entries(queries).map(([nome, query]) => ({
        name: nome,
        request: {
          method: 'POST',
          header,
          url: { raw: '{{baseUrl}}/graphql', host: ['{{baseUrl}}'], path: ['graphql'] },
          body: {
            mode: 'raw',
            raw: JSON.stringify({ query }, null, 2),
            options: { raw: { language: 'json' } },
          },
        },
      })),
    };
  }

  // ---------------------------------------------------------------- SOAP

  private folderSoap(): PostmanFolder {
    const header: PostmanHeader[] = [
      { key: 'Content-Type', value: 'text/xml' },
      { key: 'X-Session-Id', value: '{{sessionId}}' },
    ];

    const envelope = (body: string) => `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="${SOAP_NAMESPACE}">
    <soap:Header/>
    <soap:Body>
${body}
    </soap:Body>
</soap:Envelope>`;

    const bodies: Record<string, string> = {
      listCursos: envelope('        <cur:listCursosRequest/>'),
      getCurso: envelope(`        <cur:getCursoRequest>
            <cur:codigo>c1</cur:codigo>
        </cur:getCursoRequest>`),
      createCurso: envelope(`        <cur:createCursoRequest>
            <cur:codigo>postmansoap</cur:codigo>
            <cur:titulo>Curso via Postman</cur:titulo>
            <cur:descricao>Criado a partir da collection exportada</cur:descricao>
            <cur:cargaHoraria>20</cur:cargaHoraria>
            <cur:nivel>INTERMEDIARIO</cur:nivel>
            <cur:preco>149.9</cur:preco>
            <cur:ativo>true</cur:ativo>
            <cur:tags>postman</cur:tags>
            <cur:tags>exemplo</cur:tags>
            <cur:instrutor>
                <cur:nome>Fulano</cur:nome>
                <cur:email>fulano@exemplo.dev</cur:email>
                <cur:bio>bio de exemplo</cur:bio>
            </cur:instrutor>
            <cur:modulos>
                <cur:titulo>Introdução</cur:titulo>
                <cur:duracaoMinutos>30</cur:duracaoMinutos>
            </cur:modulos>
        </cur:createCursoRequest>`),
      updateCurso: envelope(`        <cur:updateCursoRequest>
            <cur:codigo>c1</cur:codigo>
            <cur:titulo>Novo Título via Postman</cur:titulo>
        </cur:updateCursoRequest>`),
      deleteCurso: envelope(`        <cur:deleteCursoRequest>
            <cur:codigo>c1</cur:codigo>
        </cur:deleteCursoRequest>`),
    };

    return {
      name: 'SOAP',
      item: Object.entries(bodies).map(([nome, raw]) => ({
        name: nome,
        request: {
          method: 'POST',
          header,
          url: { raw: '{{baseUrl}}/ws/cursos', host: ['{{baseUrl}}'], path: ['ws', 'cursos'] },
          body: { mode: 'raw', raw, options: { raw: { language: 'xml' } } },
        },
      })),
    };
  }

  private cursoExemploObjeto() {
    return {
      codigo: 'postman1',
      titulo: 'Curso via Postman',
      descricao: 'Criado a partir da collection exportada',
      cargaHoraria: 20,
      nivel: 'INTERMEDIARIO',
      preco: 149.9,
      ativo: true,
      tags: ['postman', 'exemplo'],
      instrutor: { nome: 'Fulano', email: 'fulano@exemplo.dev', bio: 'bio de exemplo' },
      modulos: [{ titulo: 'Introdução', duracaoMinutos: 30 }],
    };
  }
}
