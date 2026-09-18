import { Component } from '@angular/core';
import {HeaderComponent} from './components/layout-externo/header/header.component';
import {SectionComponent} from './components/layout-externo/section/section.component';
import {FooterComponent} from './components/layout-externo/footer/footer.component';
import {
  FrontFormContainerComponent
} from './components/front-forms/front-form-container/front-form-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    SectionComponent,
    FooterComponent,
    FrontFormContainerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
}
