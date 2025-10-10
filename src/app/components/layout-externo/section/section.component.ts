import { Component } from '@angular/core';
import {CodeHighlighterRequestComponent} from '../../comparators/code-highlighter-request/code-highlighter-request.component';
import {FrontFormContainerComponent} from "../../front-forms/front-form-container/front-form-container.component";
import {ApiTypeComponent} from "../../comparators/api-type/api-type.component";

@Component({
  selector: 'app-section',
  standalone: true,
  templateUrl: './section.component.html',
    imports: [
        CodeHighlighterRequestComponent,
        FrontFormContainerComponent,
        ApiTypeComponent
    ],
  styleUrl: './section.component.css'
})
export class SectionComponent {

}
