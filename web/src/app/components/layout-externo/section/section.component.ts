import { Component } from '@angular/core';
import {FrontFormContainerComponent} from "../../front-forms/front-form-container/front-form-container.component";
import {ApiTypeComponent} from "../../comparators/api-type/api-type.component";
import {WireLogComponent} from "../../wire-log/wire-log.component";
import {SandboxInfoComponent} from "../../sandbox-info/sandbox-info.component";

@Component({
  selector: 'app-section',
  standalone: true,
  templateUrl: './section.component.html',
    imports: [
        FrontFormContainerComponent,
        ApiTypeComponent,
        WireLogComponent,
        SandboxInfoComponent
    ],
  styleUrl: './section.component.css'
})
export class SectionComponent {

}
