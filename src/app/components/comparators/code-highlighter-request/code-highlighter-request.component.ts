import {
  AfterViewInit,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  output,
  Signal,
  signal,
  ViewChild
} from '@angular/core';
type apiTipos = 'REST' | 'SOAP' | 'GRAPHQL' ;
import { HighlightJsDirective } from 'ngx-highlight-js';
import {CursoSignalService} from '../../../services/curso-signal.service';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {CasoDeUso, CursoRequest} from '../../../models/Models';
type GraphqlBodyResponse = {
  codigo: boolean;
  titulo: boolean;
  descricao: boolean;
  cargaHoraria: boolean;
};

@Component({
  selector: 'app-code-highlighter-request',
  standalone: true,
  imports: [
    HighlightJsDirective,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './code-highlighter-request.component.html',
  styleUrls: ['./code-highlighter-request.component.css','../code-content.css']
})
export class CodeHighlighterRequestComponent {

  constructor(public cursoSignalService : CursoSignalService) {
    this.cursoAtual= this.cursoSignalService.cursoAtual;
    effect(() => {
      this.enviarDados.emit(this.bodyRequest());
    });
  }
  public apiTipo = input<apiTipos>('REST');
  // public codigo = input<string>('');
  public enviarDados = output<string>();

  public linguagem = computed(() => {
    switch (this.apiTipo()) {
      case 'REST':
        return 'json';
      case 'GRAPHQL':
        return 'graphql';
      case 'SOAP':
        return 'xml';
      default:
        return 'json';
    }
  });

  public graphqlBodyResponse = input<GraphqlBodyResponse>({
    codigo: true,
    titulo: true,
    descricao: true,
    cargaHoraria: true
  });
  public cursoAtual : Signal<CursoRequest> = signal({codigo: '', titulo: '', descricao: '', cargaHoraria: 0, codigoNovo: '', minCargaHoraria: 0, maxCargaHoraria: 0, isFindingByCodigo: false});

  bodyRequest = computed(() => {
    const curso = this.cursoAtual();
    switch (this.apiTipo()) {
        case 'REST':
            return this.retornarRestBodyRequest(curso, this.cursoSignalService.casoDeUsoSelecionado());
        case 'GRAPHQL':
            return this.retornarGraphqlBodyRequest(curso, this.cursoSignalService.casoDeUsoSelecionado());
        case 'SOAP':
            return this.retornarSoapBodyRequest(curso, this.cursoSignalService.casoDeUsoSelecionado());
        default:
            return ``;
    }
  });
  public contentType = computed(() => {
    switch (this.apiTipo()) {
      case 'REST':
        return 'application/json';
      case 'SOAP':
        return 'text/xml';
      case 'GRAPHQL':
        return 'application/graphql';
      default:
        return 'application/json';
    }
  });
  retornarRestBodyRequest( curso: CursoRequest, casoDeUso: CasoDeUso ): string {
    switch (casoDeUso) {
        case 'getAll':
            return `// sem body request`;
        case 'procurar':
            return `// sem body request`;
        case 'criar':
            return `{
    "codigo": "${curso.codigo}",
    "titulo": "${curso.titulo}",
    "descricao": "${curso.descricao}",
    "cargaHoraria": ${curso.cargaHoraria}
}`;
        case 'alterar':
            return `{
    "codigoNovo": "${curso.codigoNovo}",
    "titulo": "${curso.titulo}",
    "descricao": "${curso.descricao}"${curso.cargaHoraria ? `,
    "cargaHoraria": ${curso.cargaHoraria}` : ''}
}`;
        case 'deletar':
            return `// sem body request`;
        default:
            return ``;
    }}
  retornarGraphqlBodyRequest( curso: CursoRequest, casoDeUso: CasoDeUso ): string {
    switch (casoDeUso) {
      case 'getAll':
        return `query {
    listCursos {
        ${this.graphqlBodyResponse().codigo ? 'codigo' : ''}${this.graphqlBodyResponse().titulo ? '\n\ttitulo' : ''}${this.graphqlBodyResponse().descricao ? '\n\tdescricao' : ''}${this.graphqlBodyResponse().cargaHoraria ? '\n\tcargaHoraria' : ''}
        }
}`;
      case 'procurar':
        if (this.cursoSignalService.requestCursos.procurar().isFindingByCodigo) {
          return `query {
        getCursoByCodigo(codigo: "${curso.codigo}") {
            ${this.graphqlBodyResponse().codigo ? '\tcodigo' : ''}${this.graphqlBodyResponse().titulo ?
            '\n\t\ttitulo' : ''}${this.graphqlBodyResponse().descricao ?
            '\n\t\tdescricao' : ''}${this.graphqlBodyResponse().cargaHoraria ?
            '\n\t\tcargaHoraria' : ''}
            }
    }`;
        }else {
          return `query {
        listCursos(
          titulo: "${curso.titulo}",
          descricao: "${curso.descricao}"${curso.minCargaHoraria ? `,
          minCargaHoraria: ${curso.minCargaHoraria}` : ''}${curso.maxCargaHoraria ? `,
          maxCargaHoraria: ${curso.maxCargaHoraria}` : ''}
          ) {
            ${this.graphqlBodyResponse().codigo ? '\tcodigo' : ''}${this.graphqlBodyResponse().titulo ?
            '\n\t\ttitulo' : ''}${this.graphqlBodyResponse().descricao ?
            '\n\t\tdescricao' : ''}${this.graphqlBodyResponse().cargaHoraria ?
            '\n\t\tcargaHoraria' : ''}
            }
    }`;
        }
      case 'criar':
        return `mutation {
    createCurso(
        codigo: "${curso.codigo}",
        titulo: "${curso.titulo}",
        descricao: "${curso.descricao}",
        cargaHoraria: ${curso.cargaHoraria}
    ) {
        ${this.graphqlBodyResponse().codigo ? 'codigo' : ''}${this.graphqlBodyResponse().titulo ? '\n\ttitulo' : ''}${this.graphqlBodyResponse().descricao ? '\n\tdescricao' : ''}${this.graphqlBodyResponse().cargaHoraria ? '\n\tcargaHoraria' : ''}
        }
}`;
      case 'alterar':
        return `mutation {
    updateCurso(
        codigo: "${curso.codigo}",
        codigoNovo: "${curso.codigoNovo}",
        titulo: "${curso.titulo}",
        descricao: "${curso.descricao}"${curso.cargaHoraria ? `,
        cargaHoraria: ${curso.cargaHoraria}` : ''}
    ) {
        ${this.graphqlBodyResponse().codigo ? 'codigo' : ''}${this.graphqlBodyResponse().titulo ? '\n\ttitulo' : ''}${this.graphqlBodyResponse().descricao ? '\n\tdescricao' : ''}${this.graphqlBodyResponse().cargaHoraria ? '\n\tcargaHoraria' : ''}
        }\n}`;
      case 'deletar':
        return `mutation {
    deleteCurso(codigo: "${curso.codigo}")
}`;}
  }
  retornarSoapBodyRequest( curso: CursoRequest, casoDeUso: CasoDeUso ): string {
    switch (casoDeUso) {
      case 'getAll':
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="https://cursos-api-7vr6.onrender.com">
    <soap:Header/>
    <soap:Body>
        <cur:listCursosRequest/>
    </soap:Body>
</soap:Envelope>`;
      case 'procurar':
        if (this.cursoSignalService.requestCursos.procurar().isFindingByCodigo) {
          return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="https://cursos-api-7vr6.onrender.com">
    <soap:Header/>
    <soap:Body>
        <cur:getCursoRequest>
            <cur:codigo>${curso.codigo}</cur:codigo>
        </cur:getCursoRequest>
    </soap:Body>
</soap:Envelope>`;
        } else {
          return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="https://cursos-api-7vr6.onrender.com">
    <soap:Header/>
    <soap:Body>
        <cur:procurarCursosRequest>
            <cur:titulo>${curso.titulo}</cur:titulo>
            <cur:descricao>${curso.descricao}</cur:descricao>
            <cur:minCargaHoraria>${curso.minCargaHoraria ?? ""}</cur:minCargaHoraria>
            <cur:maxCargaHoraria>${curso.maxCargaHoraria ?? ""}</cur:maxCargaHoraria>
        </cur:procurarCursosRequest>
    </soap:Body>
</soap:Envelope>`;
        }


      case 'criar':
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="https://cursos-api-7vr6.onrender.com">
    <soap:Header/>
    <soap:Body>
        <cur:createCursoRequest>
            <cur:codigo>${curso.codigo}</cur:codigo>
            <cur:titulo>${curso.titulo}</cur:titulo>
            <cur:descricao>${curso.descricao}</cur:descricao>
            <cur:cargaHoraria>${curso.cargaHoraria ?? ""}</cur:cargaHoraria>
        </cur:createCursoRequest>
    </soap:Body>
</soap:Envelope>`;
      case 'alterar':
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="https://cursos-api-7vr6.onrender.com">
    <soap:Header/>
    <soap:Body>
        <cur:updateCursoRequest>
            <cur:codigo>${curso.codigo}</cur:codigo>
            <cur:codigoNovo>${curso.codigoNovo}</cur:codigoNovo>
            <cur:titulo>${curso.titulo}</cur:titulo>
            <cur:descricao>${curso.descricao}</cur:descricao>
            <cur:cargaHoraria>${curso.cargaHoraria ?? ""}</cur:cargaHoraria>
        </cur:updateCursoRequest>
    </soap:Body>
</soap:Envelope>`;
      case 'deletar':
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="https://cursos-api-7vr6.onrender.com">
    <soap:Header/>
    <soap:Body>
        <cur:deleteCursoRequest>
            <cur:codigo>${curso.codigo}</cur:codigo>
        </cur:deleteCursoRequest>
    </soap:Body>
</soap:Envelope>`;
      default:
        return ``;
    }
  }

}
