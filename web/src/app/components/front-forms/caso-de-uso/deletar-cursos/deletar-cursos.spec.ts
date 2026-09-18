import { DeletarCursosComponent } from './deletar-cursos.component';
import { mockCursoSignalService } from '../../../../services/curso-signal/curso-signal.service.mock';

describe('DeletarCursosComponent - validação de caracteres', () => {
  let component: DeletarCursosComponent;

  beforeEach(() => {
    jest.clearAllMocks();
    component = new DeletarCursosComponent(mockCursoSignalService as any);
  });

  it('codigo é obrigatório e no máximo 15 caracteres', () => {
    const control = component.formulario.get('codigo');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();

    control?.setValue('A'.repeat(15));
    expect(control?.valid).toBeTruthy();

    control?.setValue('A'.repeat(16));
    expect(control?.valid).toBeFalsy();
  });
});
