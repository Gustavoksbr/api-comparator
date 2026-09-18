export const mockCursoSignalService : any = {
  requestCursos: {
    criar: jest.fn(() => ({
      codigo: '',
      titulo: '',
      descricao: '',
      cargaHoraria: 0,
      nivel: 'INICIANTE',
      preco: 0,
      ativo: 'true',
      tags: '',
      instrutorNome: '',
      instrutorEmail: '',
      instrutorBio: '',
      modulosTexto: ''
    })),
    alterar: jest.fn(() => ({
      codigo: '',
      codigoNovo: '',
      titulo: '',
      descricao: '',
      cargaHoraria: 0,
      nivel: '',
      preco: null,
      ativo: '',
      tags: '',
      instrutorNome: '',
      instrutorEmail: '',
      instrutorBio: '',
      modulosTexto: ''
    })),
    deletar: jest.fn(() => ({ codigo: '' })),
    procurar: jest.fn(() => ({
      isFindingByCodigo: true,
      codigo: '',
      titulo: '',
      descricao: '',
      minCargaHoraria: 0,
      maxCargaHoraria: 300
    }))
  }
};
mockCursoSignalService.requestCursos.criar.update = jest.fn();
mockCursoSignalService.requestCursos.alterar.update = jest.fn();
mockCursoSignalService.requestCursos.deletar.update = jest.fn();
mockCursoSignalService.requestCursos.procurar.update = jest.fn();
