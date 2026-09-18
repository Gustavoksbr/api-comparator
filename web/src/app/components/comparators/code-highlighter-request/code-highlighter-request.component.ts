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
type apiTypes = 'REST' | 'SOAP' | 'GRAPHQL' ;
import { HighlightJsDirective } from 'ngx-highlight-js';
import {CursoSignalService} from '../../../services/curso-signal/curso-signal.service';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {
  CasoDeUso,
  clonarGraphqlBodyResponsePadrao,
  CursoRequest,
  GraphqlBodyResponse,
  ModuloRequest,
  modulosDoTexto,
  selecaoGraphqlDoBodyResponse,
  SOAP_NAMESPACE,
  tagsDoTexto
} from '../../../models/Models';

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
  public apiType = input<apiTypes>('REST');
  // public codigo = input<string>('');
  public enviarDados = output<string>();

  public linguagem = computed(() => {
    switch (this.apiType()) {
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

  public graphqlBodyResponse = input<GraphqlBodyResponse>(clonarGraphqlBodyResponsePadrao());
  public cursoAtual : Signal<CursoRequest> = signal({codigo: '', titulo: '', descricao: '', cargaHoraria: 0, codigoNovo: '', minCargaHoraria: 0, maxCargaHoraria: 0, isFindingByCodigo: false});

  bodyRequest = computed(() => {
    const curso = this.cursoAtual();
    switch (this.apiType()) {
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
    switch (this.apiType()) {
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
    "cargaHoraria": ${curso.cargaHoraria},
    "nivel": "${curso.nivel}",
    "preco": ${curso.preco ?? 0},
    "ativo": ${curso.ativo !== 'false'},
    "tags": ${JSON.stringify(tagsDoTexto(curso.tags))},
    "instrutor": {"nome": "${curso.instrutorNome ?? ''}", "email": "${curso.instrutorEmail ?? ''}", "bio": "${curso.instrutorBio ?? ''}"},
    "modulos": ${JSON.stringify(modulosDoTexto(curso.modulosTexto))}
}`;
        case 'alterar':
            return `{
    "codigoNovo": "${curso.codigoNovo}",
    "titulo": "${curso.titulo}",
    "descricao": "${curso.descricao}"${curso.cargaHoraria ? `,
    "cargaHoraria": ${curso.cargaHoraria}` : ''}${this.jsonAlterarExtra(curso)}
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
${selecaoGraphqlDoBodyResponse(this.graphqlBodyResponse(), '        ')}
    }
}`;
      case 'procurar':
        if (this.cursoSignalService.requestCursos.procurar().isFindingByCodigo) {
          return `query {
        getCursoByCodigo(codigo: "${curso.codigo}") {
${selecaoGraphqlDoBodyResponse(this.graphqlBodyResponse(), '            ')}
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
${selecaoGraphqlDoBodyResponse(this.graphqlBodyResponse(), '            ')}
            }
    }`;
        }
      case 'criar':
        return `mutation {
    createCurso(
        codigo: "${curso.codigo}",
        titulo: "${curso.titulo}",
        descricao: "${curso.descricao}",
        cargaHoraria: ${curso.cargaHoraria},
        nivel: ${curso.nivel},
        preco: ${curso.preco ?? 0},
        ativo: ${curso.ativo !== 'false'},
        tags: ${this.gqlTagsLiteral(tagsDoTexto(curso.tags))},
        instrutor: ${this.gqlInstrutorLiteral(curso.instrutorNome, curso.instrutorEmail, curso.instrutorBio)},
        modulos: ${this.gqlModulosLiteral(modulosDoTexto(curso.modulosTexto))}
    ) {
${selecaoGraphqlDoBodyResponse(this.graphqlBodyResponse(), '        ')}
        }
}`;
      case 'alterar':
        return `mutation {
    updateCurso(
        codigo: "${curso.codigo}",
        codigoNovo: "${curso.codigoNovo}",
        titulo: "${curso.titulo}",
        descricao: "${curso.descricao}"${curso.cargaHoraria ? `,
        cargaHoraria: ${curso.cargaHoraria}` : ''}${this.gqlAlterarExtraArgs(curso)}
    ) {
${selecaoGraphqlDoBodyResponse(this.graphqlBodyResponse(), '        ')}
        }
}`;
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
               xmlns:cur="${SOAP_NAMESPACE}">
    <soap:Header/>
    <soap:Body>
        <cur:listCursosRequest/>
    </soap:Body>
</soap:Envelope>`;
      case 'procurar':
        if (this.cursoSignalService.requestCursos.procurar().isFindingByCodigo) {
          return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="${SOAP_NAMESPACE}">
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
               xmlns:cur="${SOAP_NAMESPACE}">
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
               xmlns:cur="${SOAP_NAMESPACE}">
    <soap:Header/>
    <soap:Body>
        <cur:createCursoRequest>
            <cur:codigo>${curso.codigo}</cur:codigo>
            <cur:titulo>${curso.titulo}</cur:titulo>
            <cur:descricao>${curso.descricao}</cur:descricao>
            <cur:cargaHoraria>${curso.cargaHoraria ?? ""}</cur:cargaHoraria>
            <cur:nivel>${curso.nivel}</cur:nivel>
            <cur:preco>${curso.preco ?? 0}</cur:preco>
            <cur:ativo>${curso.ativo !== 'false'}</cur:ativo>${this.soapTagsXml(tagsDoTexto(curso.tags))}${this.soapInstrutorXml(curso.instrutorNome, curso.instrutorEmail, curso.instrutorBio)}${this.soapModulosXml(modulosDoTexto(curso.modulosTexto))}
        </cur:createCursoRequest>
    </soap:Body>
</soap:Envelope>`;
      case 'alterar':
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="${SOAP_NAMESPACE}">
    <soap:Header/>
    <soap:Body>
        <cur:updateCursoRequest>
            <cur:codigo>${curso.codigo}</cur:codigo>
            <cur:codigoNovo>${curso.codigoNovo}</cur:codigoNovo>
            <cur:titulo>${curso.titulo}</cur:titulo>
            <cur:descricao>${curso.descricao}</cur:descricao>
            <cur:cargaHoraria>${curso.cargaHoraria ?? ""}</cur:cargaHoraria>${this.soapAlterarExtra(curso)}
        </cur:updateCursoRequest>
    </soap:Body>
</soap:Envelope>`;
      case 'deletar':
        return `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:cur="${SOAP_NAMESPACE}">
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

  // ---- Helpers para os campos "de tipos mais diversos" (nivel, preco,
  // ativo, tags, instrutor, modulos), usados só em criar/alterar. Em
  // "alterar" cada campo só entra na requisição se o usuário o preencheu —
  // igual à convenção já usada para cargaHoraria (patch parcial). ----

  private jsonAlterarExtra(curso: CursoRequest): string {
    const partes: string[] = [];
    if (curso.nivel) partes.push(`"nivel": "${curso.nivel}"`);
    if (curso.preco) partes.push(`"preco": ${curso.preco}`);
    if (curso.ativo) partes.push(`"ativo": ${curso.ativo === 'true'}`);
    if (curso.tags?.trim()) partes.push(`"tags": ${JSON.stringify(tagsDoTexto(curso.tags))}`);
    if (curso.instrutorNome || curso.instrutorEmail || curso.instrutorBio) {
      partes.push(`"instrutor": {"nome": "${curso.instrutorNome ?? ''}", "email": "${curso.instrutorEmail ?? ''}", "bio": "${curso.instrutorBio ?? ''}"}`);
    }
    if (curso.modulosTexto?.trim()) partes.push(`"modulos": ${JSON.stringify(modulosDoTexto(curso.modulosTexto))}`);
    return partes.length ? ',\n    ' + partes.join(',\n    ') : '';
  }

  private gqlTagsLiteral(tags: string[]): string {
    return `[${tags.map((t) => `"${t}"`).join(', ')}]`;
  }

  private gqlInstrutorLiteral(nome?: string, email?: string, bio?: string): string {
    return `{nome: "${nome ?? ''}", email: "${email ?? ''}", bio: "${bio ?? ''}"}`;
  }

  private gqlModulosLiteral(modulos: ModuloRequest[]): string {
    return `[${modulos.map((m) => `{titulo: "${m.titulo}", duracaoMinutos: ${m.duracaoMinutos}}`).join(', ')}]`;
  }

  private gqlAlterarExtraArgs(curso: CursoRequest): string {
    const partes: string[] = [];
    if (curso.nivel) partes.push(`nivel: ${curso.nivel}`);
    if (curso.preco) partes.push(`preco: ${curso.preco}`);
    if (curso.ativo) partes.push(`ativo: ${curso.ativo === 'true'}`);
    if (curso.tags?.trim()) partes.push(`tags: ${this.gqlTagsLiteral(tagsDoTexto(curso.tags))}`);
    if (curso.instrutorNome || curso.instrutorEmail || curso.instrutorBio) {
      partes.push(`instrutor: ${this.gqlInstrutorLiteral(curso.instrutorNome, curso.instrutorEmail, curso.instrutorBio)}`);
    }
    if (curso.modulosTexto?.trim()) partes.push(`modulos: ${this.gqlModulosLiteral(modulosDoTexto(curso.modulosTexto))}`);
    return partes.length ? ',\n        ' + partes.join(',\n        ') : '';
  }

  private soapTagsXml(tags: string[]): string {
    return tags.map((t) => `\n            <cur:tags>${t}</cur:tags>`).join('');
  }

  private soapInstrutorXml(nome?: string, email?: string, bio?: string): string {
    return `\n            <cur:instrutor>
                <cur:nome>${nome ?? ''}</cur:nome>
                <cur:email>${email ?? ''}</cur:email>
                <cur:bio>${bio ?? ''}</cur:bio>
            </cur:instrutor>`;
  }

  private soapModulosXml(modulos: ModuloRequest[]): string {
    return modulos.map((m) => `\n            <cur:modulos>
                <cur:titulo>${m.titulo}</cur:titulo>
                <cur:duracaoMinutos>${m.duracaoMinutos}</cur:duracaoMinutos>
            </cur:modulos>`).join('');
  }

  private soapAlterarExtra(curso: CursoRequest): string {
    let xml = '';
    if (curso.nivel) xml += `\n            <cur:nivel>${curso.nivel}</cur:nivel>`;
    if (curso.preco) xml += `\n            <cur:preco>${curso.preco}</cur:preco>`;
    if (curso.ativo) xml += `\n            <cur:ativo>${curso.ativo === 'true'}</cur:ativo>`;
    if (curso.tags?.trim()) xml += this.soapTagsXml(tagsDoTexto(curso.tags));
    if (curso.instrutorNome || curso.instrutorEmail || curso.instrutorBio) {
      xml += this.soapInstrutorXml(curso.instrutorNome, curso.instrutorEmail, curso.instrutorBio);
    }
    if (curso.modulosTexto?.trim()) xml += this.soapModulosXml(modulosDoTexto(curso.modulosTexto));
    return xml;
  }
}
