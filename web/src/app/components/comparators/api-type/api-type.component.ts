import {
  Component,
  computed,
  input, Signal,
  signal,
} from '@angular/core';
import {CodeHighlighterRequestComponent} from '../code-highlighter-request/code-highlighter-request.component';
import {CursoSignalService} from '../../../services/curso-signal/curso-signal.service';
import {ApiTipo, CasoDeUso, CursoRequest, GraphqlBodyResponse} from '../../../models/Models';
import {ReactiveFormsModule} from '@angular/forms';
import {CodeHighlighterResponseComponent} from '../code-highlighter-response/code-highlighter-response.component';
import {CursoApiService} from '../../../services/curso-api/curso-api.service';
import {NgClass, NgOptimizedImage, NgStyle} from '@angular/common';
import {environment} from '../../../../environments/environment';
type HttpMetodo = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type CampoEscalar = 'codigo' | 'titulo' | 'descricao' | 'cargaHoraria' | 'nivel' | 'preco' | 'ativo' | 'criadoEm' | 'atualizadoEm' | 'tags';
type CampoInstrutor = 'nome' | 'email' | 'bio';
type CampoModulo = 'ordem' | 'titulo' | 'duracaoMinutos';

@Component({
  selector: 'app-api-type',
  standalone: true,
  imports: [
    CodeHighlighterRequestComponent,
    ReactiveFormsModule,
    CodeHighlighterResponseComponent,
    NgClass,
    NgStyle
  ],
  templateUrl: './api-type.component.html',
  styleUrls: ['./api-type.component.css','./graphql-select-body-response.css'],
})
export class ApiTypeComponent {
  apiType = input<'REST' | 'SOAP' | 'GRAPHQL'>('REST');
  isOpen = signal(false);
  public urlBackEnd = environment.apiUrl;

  public executar(casoDeUso : CasoDeUso, tipoApi : ApiTipo, bodyRequest : string, url : string, httpMetodo : HttpMetodo) {
if (this.carregando()){
  console.log( "cancelado");
  return;
}
  console.log(
    "executando:\nAPI Type: ", this.apiType(),
    "\nCaso de uso: ", this.casoDeUsoAtual(),
    "\nURL:"+ this.url(),
    "\nMétodo HTTP: ", this.httpMetodo(),
    "\nContent-Type: ", this.contentType(),
    "\nBody Request: ", this.bodyRequest()
  )
  this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].carregando.set(true);

        this.cursoApiService.call(
          {
            apiType: tipoApi,
            method: httpMetodo,
            url: url,
            body: bodyRequest,
          }
        ).subscribe({
          next: (data) => {
            console.log('Sucesso:', data);
            this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].bodyResponse.set(data.body);
            this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].carregando.set(false);
            this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].statusCode.set(data.statusCode);
          },
          error: (error) => {
            console.error('Erro:', error);
            if (error.status === 0) {
            this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].bodyResponse.set('// a api está offline');
            }else{
              if (tipoApi === 'SOAP' || tipoApi === 'REST') {
                this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].bodyResponse.set(error.error);
              }else {
                this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].bodyResponse.set(JSON.stringify(error.message));
              }
            }
            this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].carregando.set(false);
            this.cursoSignalService.respostasDaApi[casoDeUso][tipoApi].statusCode.set(error.status || 500);
          }
        });
}
  toggle() {
    this.isOpen.set(!this.isOpen());
  };
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
  public url = computed(() => {
    switch (this.apiType()) {
      case 'REST':
        switch (this.casoDeUsoAtual()) {
          case 'getAll':
            return 'cursos';
          case 'procurar':
            const isFindingByCodigo = this.cursoAtual().isFindingByCodigo;
            if (isFindingByCodigo) {
              const codigoProcurar = this.cursoAtual().codigo;
              return `cursos/${codigoProcurar}`;
            }
            const titulo = this.cursoAtual().titulo;
            const descricao = this.cursoAtual().descricao;
            const minCargaHoraria = this.cursoAtual().minCargaHoraria;
            const maxCargaHoraria = this.cursoAtual().maxCargaHoraria;
            const params: string[] = [];
            if (titulo) {
              params.push(`titulo=${encodeURIComponent(titulo)}`);
            }
            if (descricao) {
              params.push(`descricao=${encodeURIComponent(descricao)}`);
            }
            if (minCargaHoraria !== 0 && minCargaHoraria !== null) {
              params.push(`minCargaHoraria=${minCargaHoraria}`);
            }
            if (maxCargaHoraria !== 300 && maxCargaHoraria !== null) {
              params.push(`maxCargaHoraria=${maxCargaHoraria}`);
            }
            return `cursos?${params.join('&')}`;
          case 'criar':
            return 'cursos';
          case 'alterar':
          case 'deletar':
            const codigo = this.cursoAtual().codigo;
            return `cursos/${codigo}`;
          default:
            return 'cursos';
        }
      case  'SOAP':
        return 'ws/cursos';
      case 'GRAPHQL':
        return 'graphql';
      default:
        return 'cursos';
    }
  });
  httpMetodo = computed(() => {
    switch (this.apiType()) {
      case 'REST':
        switch (this.casoDeUsoAtual()) {
          case 'getAll':
            return 'GET';
          case 'procurar':
            return 'GET';
          case 'criar':
            return 'POST';
          case 'alterar':
            return 'PUT';
          case 'deletar':
            return 'DELETE';
          default:
            return 'GET';
        }
      case 'SOAP':
      case 'GRAPHQL':
        return 'POST';
      default:
        return 'GET';
    }
  });
  public alterarGraphqlBodyResponse(campo: CampoEscalar): void {
    this.cursoSignalService.selectGrapqhlBodyResponse.update((current) => ({
      ...current,
      [campo]: !current[campo]
    }));
  }
  public alterarGraphqlBodyResponseInstrutor(campo: CampoInstrutor): void {
    this.cursoSignalService.selectGrapqhlBodyResponse.update((current) => ({
      ...current,
      instrutor: { ...current.instrutor, [campo]: !current.instrutor[campo] }
    }));
  }
  public alterarGraphqlBodyResponseModulo(campo: CampoModulo): void {
    this.cursoSignalService.selectGrapqhlBodyResponse.update((current) => ({
      ...current,
      modulos: { ...current.modulos, [campo]: !current.modulos[campo] }
    }));
  }
  public receberDados(bodyRequest : string){
    this.bodyRequest.set(bodyRequest);
  }
  public bodyRequest = signal<string>('');
  // Todos os atributos escalares do curso — a seleção de campos do GraphQL
  // não se limita aos 4 originais.
  public campos: readonly CampoEscalar[] = [
    'codigo', 'titulo', 'descricao', 'cargaHoraria',
    'nivel', 'preco', 'ativo', 'criadoEm', 'atualizadoEm', 'tags',
  ];
  public camposInstrutor: readonly CampoInstrutor[] = ['nome', 'email', 'bio'];
  public camposModulo: readonly CampoModulo[] = ['ordem', 'titulo', 'duracaoMinutos'];

  public cursoAtual : Signal<CursoRequest> ;
  public carregando : Signal<boolean> = computed(() => {
    return this.cursoSignalService.respostasDaApi[this.casoDeUsoAtual()][this.apiType()].carregando();
  });
  public casoDeUsoAtual = computed(() => this.cursoSignalService.casoDeUsoSelecionado());
  constructor(
     public cursoSignalService : CursoSignalService,
     public cursoApiService : CursoApiService
  ) {
    this.cursoAtual= this.cursoSignalService.cursoAtual;
 }
}
