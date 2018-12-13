import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PopcloseComponent } from './components/popclose.component';
import { CancelclickDirective } from './cancelclick.directive';

@NgModule({
    imports: [
        CommonModule,
        NgbModule
    ],
    declarations: [
        PopcloseComponent,
        CancelclickDirective
    ],
    providers: [],
    exports: [NgbModule,
        PopcloseComponent,
        CancelclickDirective
    ],
    entryComponents: []
})
export class SharedModule { }
