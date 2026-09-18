import { Injectable, Signal, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessaoService } from '../sessao/sessao.service';

export interface RegistroWire {
  leg: string;
  casoDeUso: string;
  metodo: string;
  caminho: string;
  status: number;
  bytes: {
    request: number;
    response: number;
    responseComprimido: number;
    total: number;
  };
  duracaoMs: number;
  fetching: {
    camposPedidos: number | null;
    camposRecebidos: number | null;
    overFetching: number | null;
  };
  em: number;
}

export interface ResumoLeg {
  chamadas: number;
  bytesTotal: number;
  bytesMedio: number;
  duracaoMediaMs: number;
}

export interface RespostaWire {
  sandbox: string;
  resumoPorLeg: Record<string, ResumoLeg>;
  registros: RegistroWire[];
}

/**
 * Cliente do wire log do servidor (veja api/src/Wire). É a razão pela qual
 * este comparador não pode ser 100% frontend: bytes reais e duração medidos
 * no servidor, não estimados pelo `fetch` do browser.
 */
@Injectable({
  providedIn: 'root',
})
export class WireLogService {
  constructor(private http: HttpClient, private sessaoService: SessaoService) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'X-Session-Id': this.sessaoService.idDaSessao() });
  }

  // Incrementado a cada chamada concluída (sucesso ou erro) do comparador —
  // é o gatilho que faz o painel do Wire log se atualizar sozinho, sem
  // precisar que a pessoa clique em "Atualizar" a cada requisição.
  private readonly atualizacoesSignal = signal(0);
  readonly atualizacoes: Signal<number> = this.atualizacoesSignal.asReadonly();

  /** Chamado por CursoApiService após cada chamada REST/GraphQL/SOAP terminar. */
  notificarChamadaConcluida(): void {
    this.atualizacoesSignal.update((v) => v + 1);
  }

  obter(): Observable<RespostaWire> {
    return this.http.get<RespostaWire>(environment.apiUrl + '_wire', { headers: this.headers });
  }

  limpar(): Observable<void> {
    return this.http.delete<void>(environment.apiUrl + '_wire', { headers: this.headers });
  }
}
