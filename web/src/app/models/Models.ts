
export type CasoDeUso = 'getAll' | 'procurar' | 'criar' | 'alterar' | 'deletar';
export type ApiTipo = 'REST' | 'SOAP' | 'GRAPHQL';
export type Nivel = 'INICIANTE' | 'INTERMEDIARIO' | 'AVANCADO';

// Namespace fixo do XSD/WSDL do serviço SOAP. É apenas um identificador XML e
// não precisa (e não deve) mudar junto com a URL de deploy da API.
export const SOAP_NAMESPACE = 'https://cursos-api-comparator/soap';

export interface CursoRequest {
  codigo?: string;
  codigoNovo?: string; // só usado em alterar
  titulo?: string;
  descricao?: string;
  cargaHoraria?: number | null;
  minCargaHoraria?: number | null; // só usado em procurar
  maxCargaHoraria?: number | null; // só usado em procurar
  isFindingByCodigo?: boolean; // só usado em procurar

  // Campos de tipos mais diversos (enum, decimal, booleano, lista, objeto
  // aninhado e lista de objetos), usados em criar/alterar. Só existem para
  // demonstrar como cada estilo de API (REST/GraphQL/SOAP) representa esses
  // tipos de forma diferente — veja api/README.md.
  nivel?: Nivel | '';
  preco?: number | null;
  ativo?: 'true' | 'false' | ''; // '' = "não alterar" em alterar; select, não checkbox, para permitir esse terceiro estado
  tags?: string; // texto digitado pelo usuário, separado por vírgula
  instrutorNome?: string;
  instrutorEmail?: string;
  instrutorBio?: string;
  modulosTexto?: string; // um módulo por linha, no formato "título|duração em minutos"
}

/** Um módulo já interpretado a partir de `modulosTexto`. */
export interface ModuloRequest {
  titulo: string;
  duracaoMinutos: number;
}

/** Interpreta `tags` (CSV) em uma lista de tags não vazias. */
export function tagsDoTexto(tags: string | undefined): string[] {
  return (tags ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t !== '');
}

/** Interpreta `modulosTexto` ("título|duração" por linha) em uma lista de módulos. */
export function modulosDoTexto(texto: string | undefined): ModuloRequest[] {
  return (texto ?? '')
    .split('\n')
    .map((linha) => linha.trim())
    .filter((linha) => linha !== '')
    .map((linha) => {
      const [titulo, duracao] = linha.split('|').map((p) => p.trim());
      return { titulo: titulo ?? '', duracaoMinutos: Number(duracao) || 0 };
    });
}

/**
 * Quais campos do curso o usuário quer de volta numa query GraphQL — a
 * seleção de campos é a maior vantagem prática do GraphQL sobre REST/SOAP, e
 * por isso se estende a TODOS os atributos do curso, incluindo os campos
 * aninhados dentro de `instrutor` e de cada `modulo` (ex.: "só o título de
 * cada módulo"). Ver ApiTypeComponent (o checklist) e
 * CodeHighlighterRequestComponent (onde a seleção vira a query de verdade).
 */
export interface GraphqlBodyResponse {
  codigo: boolean;
  titulo: boolean;
  descricao: boolean;
  cargaHoraria: boolean;
  nivel: boolean;
  preco: boolean;
  ativo: boolean;
  criadoEm: boolean;
  atualizadoEm: boolean;
  tags: boolean;
  instrutor: { nome: boolean; email: boolean; bio: boolean };
  modulos: { ordem: boolean; titulo: boolean; duracaoMinutos: boolean };
}

/** Cópia independente do padrão — evita compartilhar os objetos aninhados por referência. */
export function clonarGraphqlBodyResponsePadrao(): GraphqlBodyResponse {
  return {
    ...GRAPHQL_BODY_RESPONSE_PADRAO,
    instrutor: { ...GRAPHQL_BODY_RESPONSE_PADRAO.instrutor },
    modulos: { ...GRAPHQL_BODY_RESPONSE_PADRAO.modulos },
  };
}

export const GRAPHQL_BODY_RESPONSE_PADRAO: GraphqlBodyResponse = {
  codigo: true,
  titulo: true,
  descricao: true,
  cargaHoraria: true,
  nivel: true,
  preco: true,
  ativo: true,
  criadoEm: true,
  atualizadoEm: true,
  tags: true,
  instrutor: { nome: true, email: true, bio: true },
  modulos: { ordem: true, titulo: true, duracaoMinutos: true },
};

/**
 * Monta o corpo de uma seleção GraphQL (o que fica dentro de `{ }`) a partir
 * do checklist do usuário, indentando cada linha com `indent`. `instrutor`/
 * `modulos` só entram na seleção se pelo menos um subcampo estiver marcado —
 * pedir um objeto aninhado sem nenhum subcampo não seria uma query válida.
 */
export function selecaoGraphqlDoBodyResponse(r: GraphqlBodyResponse, indent: string): string {
  const linhas: string[] = [];
  const campoEscalar = (marcado: boolean, nome: string) => {
    if (marcado) linhas.push(`${indent}${nome}`);
  };

  campoEscalar(r.codigo, 'codigo');
  campoEscalar(r.titulo, 'titulo');
  campoEscalar(r.descricao, 'descricao');
  campoEscalar(r.cargaHoraria, 'cargaHoraria');
  campoEscalar(r.nivel, 'nivel');
  campoEscalar(r.preco, 'preco');
  campoEscalar(r.ativo, 'ativo');
  campoEscalar(r.criadoEm, 'criadoEm');
  campoEscalar(r.atualizadoEm, 'atualizadoEm');
  campoEscalar(r.tags, 'tags');

  const subcampos = (grupo: Record<string, boolean>): string[] =>
    Object.entries(grupo)
      .filter(([, marcado]) => marcado)
      .map(([nome]) => `${indent}    ${nome}`);

  const camposInstrutor = subcampos(r.instrutor);
  if (camposInstrutor.length > 0) {
    linhas.push(`${indent}instrutor {`, ...camposInstrutor, `${indent}}`);
  }

  const camposModulos = subcampos(r.modulos);
  if (camposModulos.length > 0) {
    linhas.push(`${indent}modulos {`, ...camposModulos, `${indent}}`);
  }

  return linhas.join('\n');
}
