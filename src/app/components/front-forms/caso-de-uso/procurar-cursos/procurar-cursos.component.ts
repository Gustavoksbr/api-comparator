import {Component, computed} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CursoSignalService} from '../../../../services/curso-signal/curso-signal.service';
import {CursoRequest} from '../../../../models/Models';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-procurar-cursos',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    NgClass
  ],
  templateUrl: './procurar-cursos.component.html',
  styleUrls: ['./procurar-cursos.component.css','../caso-de-uso-style.css']
})
export class ProcurarCursosComponent {
  component: any;


  constructor(public cursoSignalService: CursoSignalService) {

    this.formulario.patchValue(this.cursoSignalService.requestCursos.procurar());
    this.formulario.get('minCargaHoraria')?.valueChanges.subscribe((valor: string) => {
      if (valor && valor.toString().length > 3) {
        this.formulario.get('minCargaHoraria')?.setValue(valor.toString().slice(0, 3), { emitEvent: false });
      }
    });

    this.formulario.get('maxCargaHoraria')?.valueChanges.subscribe((valor: string) => {
      if (valor && valor.toString().length > 3) {
        this.formulario.get('maxCargaHoraria')?.setValue(valor.toString().slice(0, 3), { emitEvent: false });
      }
    });
    this.formulario.valueChanges.subscribe((valores: {
      codigo?: string;
      titulo?: string;
      descricao?: string;
      minCargaHoraria?: number;
      maxCargaHoraria?: number;
    }) => {
this.cursoSignalService.requestCursos.procurar.update(() => ({
  ...valores,
  isFindingByCodigo: this.cursoSignalService.requestCursos.procurar().isFindingByCodigo
}));
    });
  }
  public alterarFindingByCodigo(){
    this.cursoSignalService.requestCursos.procurar.update((atual)=>{
      return {...atual, isFindingByCodigo: !atual.isFindingByCodigo};
    });
  }

  formulario: FormGroup = new FormGroup({
    codigo: new FormControl('',[
      Validators.maxLength(15),
    ]),
    titulo: new FormControl('',[
      Validators.minLength(3),
      Validators.maxLength(20),
    ]),
    descricao: new FormControl('',[
      Validators.maxLength(50)
    ]),
    minCargaHoraria: new FormControl(0,[
      Validators.min(0),
      Validators.max(300)
    ]),
    maxCargaHoraria: new FormControl(300,[
      Validators.min(0),
      Validators.max(300)
    ])

  });
}
