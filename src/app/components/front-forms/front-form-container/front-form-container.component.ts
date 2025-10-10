import {Component, computed, input, output, Signal, signal} from '@angular/core';

import {CursoSignalService} from '../../../services/curso-signal.service';
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {CasoDeUso, CursoRequest} from '../../../models/Models';
import {GetAllCursosComponent} from '../caso-de-uso/get-all-cursos/get-all-cursos.component';
import {ProcurarCursosComponent} from '../caso-de-uso/procurar-cursos/procurar-cursos.component';
import {CriarCursosComponent} from '../caso-de-uso/criar-cursos/criar-cursos.component';
import {AtualizarCursosComponent} from '../caso-de-uso/atualizar-cursos/atualizar-cursos.component';
import {DeletarCursosComponent} from '../caso-de-uso/deletar-cursos/deletar-cursos.component';
import {NgClass} from '@angular/common';
@Component({
  selector: 'app-front-form-container',
  standalone: true,
  templateUrl: './front-form-container.component.html',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    GetAllCursosComponent,
    ProcurarCursosComponent,
    CriarCursosComponent,
    AtualizarCursosComponent,
    DeletarCursosComponent,
    NgClass
  ],
  styleUrl: './front-form-container.component.css'
})
export class FrontFormContainerComponent {

  public alterarDadosDoCursoAtual( cursoRequest: CursoRequest) {
  }
  public selecionarCasoDeUso( casoDeUso: CasoDeUso) {
    this.cursoSignalService.casoDeUsoSelecionado.set(casoDeUso);
  }
  casoDeUsoTextos : {
    casoDeUso : CasoDeUso,
    texto: string,
  }[] = [
    {casoDeUso: 'getAll', texto: 'Listar todos os cursos'},
    {casoDeUso: 'procurar', texto: 'Procurar curso'},
    {casoDeUso: 'criar', texto: 'Criar curso'},
    {casoDeUso: 'alterar', texto: 'Alterar curso'},
    {casoDeUso: 'deletar', texto: 'Deletar curso'},
  ];
  constructor(public cursoSignalService: CursoSignalService) {
  }
}

