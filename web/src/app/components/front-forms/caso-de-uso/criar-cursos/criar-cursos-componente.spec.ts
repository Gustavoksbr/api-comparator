import { CriarCursosComponent } from './criar-cursos.component';
import { mockCursoSignalService } from '../../../../services/curso-signal/curso-signal.service.mock';

describe('CriarCursosComponent - validação de caracteres', () => {
  let component: CriarCursosComponent;

  beforeEach(() => {
    jest.clearAllMocks();
    component = new CriarCursosComponent(mockCursoSignalService as any);
  });

  it('codigo deve ser obrigatório e ter no máximo 15 caracteres', () => {
    const control = component.formulario.get('codigo');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();

    control?.setValue('A'.repeat(15));
    expect(control?.valid).toBeTruthy();

    control?.setValue('A'.repeat(16));
    expect(control?.valid).toBeFalsy();
  });

  it('titulo deve ter entre 3 e 20 caracteres', () => {
    const control = component.formulario.get('titulo');
    control?.setValue('AB');
    expect(control?.valid).toBeFalsy();

    control?.setValue('ABC');
    expect(control?.valid).toBeTruthy();

    control?.setValue('A'.repeat(21));
    expect(control?.valid).toBeFalsy();
  });

  it('descricao deve ter até 50 caracteres', () => {
    const control = component.formulario.get('descricao');
    control?.setValue('A'.repeat(50));
    expect(control?.valid).toBeTruthy();

    control?.setValue('A'.repeat(51));
    expect(control?.valid).toBeFalsy();
  });

  it('cargaHoraria deve ser obrigatória, mínima 1 e máxima 300', () => {
    const control = component.formulario.get('cargaHoraria');
    control?.setValue(0);
    expect(control?.valid).toBeFalsy();

    control?.setValue(1);
    expect(control?.valid).toBeTruthy();

    control?.setValue(301);
    expect(control?.valid).toBeFalsy();
  });
});
