import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {finalize, map, Observable} from 'rxjs';
import {ApiTipo, CasoDeUso} from '../../models/Models';
import {environment} from '../../../environments/environment';
import {SessaoService} from '../sessao/sessao.service';
import {WireLogService} from '../wire-log/wire-log.service';
export interface ApiRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  body?: string; // aceita string manual (json, xml, etc)
  headers?: Record<string, string>; // headers extras
  apiType?: ApiTipo; // tipo de API: REST, SOAP, GRAPHQL
}

@Injectable({
  providedIn: 'root'
})
export class CursoApiService {

  constructor(
    private http: HttpClient,
    private sessaoService: SessaoService,
    private wireLogService: WireLogService,
  ) {

  }
  private url_back_end = environment.apiUrl;

  // Identifica o sandbox de cursos deste navegador para a API (sem login,
  // sem cookie, sem dado pessoal). Veja SessaoService e api/README.md.
  private get sandboxHeader(): Record<string, string> {
    return { 'X-Session-Id': this.sessaoService.idDaSessao() };
  }

  // Avisa o painel do Wire log que uma chamada terminou (sucesso ou erro),
  // para ele se atualizar sozinho em vez de depender de clique manual.
  private get avisarWireLog() {
    return finalize<{ statusCode: number; body: string }>(() => this.wireLogService.notificarChamadaConcluida());
  }

  call<T>(options: ApiRequestOptions): Observable<{statusCode: number, body: string}> {
    console.log("call options:", JSON.stringify(options));
    if (options.apiType === 'GRAPHQL') {
      const headers = new HttpHeaders({
        'Content-Type': 'application/graphql',
        ...this.sandboxHeader,
      });
      return this.http.post(this.url_back_end + 'graphql', { query: options.body }, { observe: 'response', headers }).pipe(
        map(response => ({
            statusCode: response.status,
            body: JSON.stringify(response.body)
          })
        ),
        this.avisarWireLog,
      );
    } else if(options.apiType === 'SOAP'){
      const headers = new HttpHeaders({
        'Content-Type': 'text/xml',
        ...this.sandboxHeader,
      });
      return this.http.post(this.url_back_end + 'ws/cursos', options.body, {
        headers, responseType: 'text',
        observe: 'response'
      }).pipe(
        map(response => ({
          statusCode: response.status,
          body: response.body || ''
        })),
        this.avisarWireLog,
      );
    }
//rest

    return this.http.request<T>(options.method, this.url_back_end + options.url, {
      body: options.body,
      observe: 'response' as 'response',
      headers: new HttpHeaders({ 'Content-Type': 'application/json', ...this.sandboxHeader })
    }).pipe(
      map((response: any) => {
        return {
          statusCode: response.status,
          body: JSON.stringify(response.body)
        };
      }),
      this.avisarWireLog,
    );
  }

}
