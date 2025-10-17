import {Component, WritableSignal} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';
import {TemaClaroEscuroSignalService} from '../../../services/tema-claro-escuro-signal.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [
    NgOptimizedImage
  ],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css'
})
export class FooterComponent {
  constructor(private temaService: TemaClaroEscuroSignalService) {
    this.escuro = this.temaService.escuro;
  }
  public escuro: WritableSignal<boolean>;
}
