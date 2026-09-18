import { ProcurarCursosComponent } from './procurar-cursos.component';
import { mockCursoSignalService } from '../../../../services/curso-signal/curso-signal.service.mock';

describe('ProcurarCursosComponent - limites de caracteres', () => {
  let component: ProcurarCursosComponent;

  beforeEach(() => {
    jest.clearAllMocks();
    component = new ProcurarCursosComponent(mockCursoSignalService as any);
  });

  it('codigo deve aceitar até 15 caracteres', () => {
    const control = component.formulario.get('codigo');
    control?.setValue('A'.repeat(15));
    expect(control?.valid).toBeTruthy();

    control?.setValue('A'.repeat(16));
    expect(control?.valid).toBeFalsy();
  });

  it('titulo deve aceitar entre 3 e 20 caracteres', () => {
    const control = component.formulario.get('titulo');
    control?.setValue('AB'); // abaixo do mínimo
    expect(control?.valid).toBeFalsy();

    control?.setValue('ABC');
    expect(control?.valid).toBeTruthy();

    control?.setValue('A'.repeat(21)); // acima do máximo
    expect(control?.valid).toBeFalsy();
  });

  it('descricao deve aceitar até 50 caracteres', () => {
    const control = component.formulario.get('descricao');
    control?.setValue('A'.repeat(50));
    expect(control?.valid).toBeTruthy();

    control?.setValue('A'.repeat(51));
    expect(control?.valid).toBeFalsy();
  });

  it('minCargaHoraria deve respeitar [0,300]', () => {
    const control = component.formulario.get('minCargaHoraria');
    control?.setValue(-1);
    expect(control?.valid).toBeFalsy();

    control?.setValue(301);
    expect(control?.valid).toBeFalsy();

    control?.setValue(150);
    expect(control?.valid).toBeTruthy();
  });

  it('maxCargaHoraria deve respeitar [0,300]', () => {
    const control = component.formulario.get('maxCargaHoraria');
    control?.setValue(-10);
    expect(control?.valid).toBeFalsy();

    control?.setValue(400);
    expect(control?.valid).toBeFalsy();

    control?.setValue(300);
    expect(control?.valid).toBeTruthy();
  });
});
