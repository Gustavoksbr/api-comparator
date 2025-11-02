import {Component, WritableSignal} from '@angular/core';
import {TemaClaroEscuroSignalService} from '../../../services/tema-claro-escuro-signal/tema-claro-escuro-signal.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {

  constructor(private temaService: TemaClaroEscuroSignalService) {
   this.escuro = this.temaService.escuro;
  }
  public escuro: WritableSignal<boolean>;
  changeTheme() {
    this.temaService.changeTheme();
  }
}
