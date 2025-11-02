import {Component, computed} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {CursoRequest} from '../../../../models/Models';
import {CursoSignalService} from '../../../../services/curso-signal/curso-signal.service';

@Component({
  selector: 'app-deletar-cursos',
  standalone: true,
    imports: [
        ReactiveFormsModule
    ],
  templateUrl: './deletar-cursos.component.html',
  styleUrls: ['./deletar-cursos.component.css','../caso-de-uso-style.css']
})
export class DeletarCursosComponent {

  constructor(public cursoSignalService: CursoSignalService) {

    this.formulario.setValue(this.cursoSignalService.requestCursos.deletar());
    this.formulario.valueChanges.subscribe((valores: CursoRequest) => {
      this.cursoSignalService.requestCursos.deletar.update(()=>valores);
    });

  }

  formulario: FormGroup = new FormGroup({
    codigo: new FormControl('',[
      Validators.required,
      Validators.maxLength(15),
    ])
  });

}
