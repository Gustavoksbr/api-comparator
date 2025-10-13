import {Component} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CursoSignalService} from '../../../../services/curso-signal.service';
import {CursoRequest} from '../../../../models/Models';

@Component({
  selector: 'app-criar-cursos',
  standalone: true,
    imports: [
        ReactiveFormsModule
    ],
  templateUrl: './criar-cursos.component.html',
  styleUrls: ['./criar-cursos.component.css','../caso-de-uso-style.css']
})
export class CriarCursosComponent {

  constructor(public cursoSignalService: CursoSignalService) {
    this.formulario.setValue(this.cursoSignalService.requestCursos.criar());
    this.formulario.valueChanges.subscribe((valores: CursoRequest) => {
      this.cursoSignalService.requestCursos.criar.update(()=>valores);
    });
    this.formulario.get('cargaHoraria')?.valueChanges.subscribe((valor: number) => {
      if (valor && valor.toString().length > 3) {
        this.formulario.get('cargaHoraria')?.setValue(Number(valor.toString().slice(0, 3)), { emitEvent: false });
      }
    });
  }
  formulario: FormGroup = new FormGroup({
    codigo: new FormControl('',[
      Validators.required,
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
