export const mockCursoSignalService : any = {
  requestCursos: {
    criar: jest.fn(() => ({
      codigo: '',
      titulo: '',
      descricao: '',
      cargaHoraria: 0
    })),
    alterar: jest.fn(() => ({
      codigo: '',
      codigoNovo: '',
      titulo: '',
      descricao: '',
      cargaHoraria: 0
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
