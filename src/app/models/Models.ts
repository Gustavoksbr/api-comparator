
export type CasoDeUso = 'getAll' | 'procurar' | 'criar' | 'alterar' | 'deletar';
export type ApiTipo = 'REST' | 'SOAP' | 'GRAPHQL';
export interface CursoRequest {
  codigo?: string;
  codigoNovo?: string; // só usado em alterar
  titulo?: string;
  descricao?: string;
  cargaHoraria?: number;
  minCargaHoraria?: number; // só usado em procurar
  maxCargaHoraria?: number; // só usado em procurar
  isFindingByCodigo?: boolean; // só usado em procurar
}
