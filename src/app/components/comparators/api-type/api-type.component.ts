import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input, Signal,
  signal,
  WritableSignal
} from '@angular/core';
import {CodeHighlighterRequestComponent} from '../code-highlighter-request/code-highlighter-request.component';
import {CursoSignalService} from '../../../services/curso-signal.service';
import {ApiTipo, CasoDeUso, CursoRequest} from '../../../models/Models';
import {ReactiveFormsModule} from '@angular/forms';
import {CodeHighlighterResponseComponent} from '../code-highlighter-response/code-highlighter-response.component';
import {CursoApiService} from '../../../services/curso-api.service';
import {NgClass, NgOptimizedImage, NgStyle} from '@angular/common';
type HttpMetodo = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
type GraphqlBodyResponse = {
  codigo: boolean;
  titulo: boolean;
  descricao: boolean;
  cargaHoraria: boolean;
};

@Component({
  selector: 'app-api-type',
  standalone: true,
  imports: [
    CodeHighlighterRequestComponent,
    ReactiveFormsModule,
    CodeHighlighterResponseComponent,
    NgClass,
    NgOptimizedImage,
    NgStyle
  ],
  templateUrl: './api-type.component.html',
  styleUrl: './api-type.component.css'
})
export class ApiTypeComponent {
  apiType = input<'REST' | 'SOAP' | 'GRAPHQL'>('REST');
  isOpen = signal(true);

public executar(casoDeUso : CasoDeUso, tipoApi : ApiTipo, bodyRequest : string, url : string, httpMetodo : HttpMetodo) {

  console.log(
    "executando:\nAPI Type: ", this.apiType(),
    "\nCaso de uso: ", this.casoDeUsoAtual(),
    "\nURL: https://cursos-api-7vr6.onrender.com/"+ this.url(),
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
  public alterarGraphqlBodyResponse(campo: keyof GraphqlBodyResponse): void {
    this.cursoSignalService.selectGrapqhlBodyResponse.update((current) => ({
      ...current,
      [campo]: !current[campo]
    }));
  }
  public receberDados(bodyRequest : string){
    this.bodyRequest.set(bodyRequest);
  }
  public bodyRequest = signal<string>('');
  public campos = [
    'codigo',
    'titulo',
    'descricao',
    'cargaHoraria'
  ] as const

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
