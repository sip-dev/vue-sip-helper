import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GenerateService } from './services/generate.service';
import { GenerateTmplService } from './services/generate-tmpl.service';
import { VscodeMessageService } from './services/vscode-message.service';

@NgModule({
    imports: [
        CommonModule
    ],
    declarations: [],
    providers: [
        GenerateService,
        GenerateTmplService,
        VscodeMessageService
    ],
    exports:[],
    entryComponents:[]
})
export class CoreModule { }
