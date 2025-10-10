import {Component, computed, signal} from '@angular/core';
import {CursoSignalService} from '../../../../services/curso-signal.service';
import {CursoRequest} from '../../../../models/Models';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'app-atualizar-cursos',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './atualizar-cursos.component.html',
  styleUrls: ['./atualizar-cursos.component.css','../caso-de-uso-style.css']
})
export class AtualizarCursosComponent{

  constructor(public cursoSignalService: CursoSignalService) {

    this.formulario.setValue(this.cursoSignalService.requestCursos.alterar());
    this.formulario.valueChanges.subscribe((valores: CursoRequest) => {
      this.cursoSignalService.requestCursos.alterar.update(()=>valores);
    });

    this.formulario.get('cargaHoraria')?.valueChanges.subscribe((valor: number) => {

      const somenteNumeros = String(valor).replace(/\D/g, ''); // remove tudo que não é número
      const numero = Math.min(Number(somenteNumeros || 0), 300); // limita a 300

      if (valor !== numero) {
        this.formulario.get('cargaHoraria')?.setValue(numero, { emitEvent: false });
      }
    });
  }
  falso = false;
  codigoValor = computed(() => this.cursoSignalService.requestCursos.alterar().codigo ?? '');
  codigoPreenchido = computed(() => this.cursoSignalService.requestCursos.alterar().codigo!.trim().length > 0);
  formulario: FormGroup = new FormGroup({
    codigo: new FormControl('',[
      Validators.required,
      Validators.maxLength(15),
    ]),
    codigoNovo: new FormControl('',[
      Validators.maxLength(15),
    ]),
    titulo: new FormControl('',[
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(20),
    ]),
    descricao: new FormControl('',[
      Validators.maxLength(50)
    ]),
    cargaHoraria: new FormControl(0,[
      Validators.required,
      Validators.min(1),
      Validators.max(300),
    ])
  });
}
