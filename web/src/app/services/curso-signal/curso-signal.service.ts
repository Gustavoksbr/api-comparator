import {computed, effect, Injectable, signal, WritableSignal} from '@angular/core';
import {ApiTipo, CasoDeUso, clonarGraphqlBodyResponsePadrao, CursoRequest, GraphqlBodyResponse} from '../../models/Models';

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
    getAll: signal<CursoRequest>({ }),
    procurar: signal<CursoRequest>({ codigo: '', titulo: '', descricao: '', minCargaHoraria: null, maxCargaHoraria: null, isFindingByCodigo: true }),
    criar: signal<CursoRequest>({
      codigo: '', titulo: '', descricao: '', cargaHoraria: null,
      nivel: 'INICIANTE', preco: 0, ativo: 'true',
      tags: '', instrutorNome: '', instrutorEmail: '', instrutorBio: '', modulosTexto: '',
    }),
    alterar: signal<CursoRequest>({
      codigo: '', codigoNovo: '', titulo: '', descricao: '', cargaHoraria: null,
      nivel: '', preco: null, ativo: '',
      tags: '', instrutorNome: '', instrutorEmail: '', instrutorBio: '', modulosTexto: '',
    }),
    deletar: signal<CursoRequest>({ codigo: '' }),
  };
  public cursoAtual = computed(() => this.requestCursos[this.casoDeUsoSelecionado()]());
  public selectGrapqhlBodyResponse: WritableSignal<GraphqlBodyResponse> = signal(
    clonarGraphqlBodyResponsePadrao()
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
}
