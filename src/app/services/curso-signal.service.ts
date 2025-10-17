import {computed, Injectable, signal, WritableSignal} from '@angular/core';
import {ApiTipo, CasoDeUso, CursoRequest} from '../models/Models';

type GraphqlBodyResponse = {
  codigo: boolean;
  titulo: boolean;
  descricao: boolean;
  cargaHoraria: boolean;
};
interface RespostaDaApi {
  bodyResponse: WritableSignal<string>;
  carregando: WritableSignal<boolean>;
  statusCode: WritableSignal<number|null>;
}

type RespostasDaApi = Record<CasoDeUso, Record<ApiTipo, RespostaDaApi >>;



@Injectable({
  providedIn: 'root'
})
export class CursoSignalService {

   public casoDeUsoSelecionado = signal<CasoDeUso>('getAll');
  public requestCursos: Record<CasoDeUso,  WritableSignal<CursoRequest>> = {
    getAll: signal<CursoRequest>({ codigo: '', titulo: '', descricao: '', cargaHoraria: null }),
    procurar: signal<CursoRequest>({ codigo: '', titulo: '', descricao: '', minCargaHoraria: null, maxCargaHoraria: null, isFindingByCodigo: true }),
    criar: signal<CursoRequest>({ codigo: '', titulo: '', descricao: '', cargaHoraria: null }),
    alterar: signal<CursoRequest>({ codigo: '', codigoNovo:'', titulo: '', descricao: '', cargaHoraria: null }),
    deletar: signal<CursoRequest>({ codigo: '' }),
  };
  public cursoAtual = computed(() => this.requestCursos[this.casoDeUsoSelecionado()]());
  public selectGrapqhlBodyResponse: WritableSignal<GraphqlBodyResponse> = signal({
      codigo: true,
      titulo: true,
      descricao: true,
      cargaHoraria: true
    }
  );

public respostasDaApi: RespostasDaApi = {
  getAll: {
    REST: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    GRAPHQL: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    SOAP: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    }
  },
  procurar: {
    REST: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    GRAPHQL: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    SOAP: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    }
  },
  criar: {
    REST: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    GRAPHQL: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    SOAP: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    }
  },
  alterar: {
    REST: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    GRAPHQL: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    SOAP: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    }
  },
  deletar: {
    REST: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    GRAPHQL: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    },
    SOAP: {
      bodyResponse: signal(''),
      carregando: signal(false),
      statusCode: signal(null)
    }
  }
};
  constructor() {
  }
}
