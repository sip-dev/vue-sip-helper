import { Component, OnDestroy } from '@angular/core';
import { AppComponent } from '../app.component';
import { ITmplItem } from '../core/lib';
import { GenerateTmplService } from '../core/services/generate-tmpl.service';
import { GenerateService } from '../core/services/generate.service';
import { VscodeMessageService } from '../core/services/vscode-message.service';

@Component({
    selector: 'sip-genrate-tmpl',
    templateUrl: './genrate-tmpl.component.html',
    styles: []
})
export class GenrateTmplComponent implements OnDestroy {

    constructor(private _tmplSrv: GenerateTmplService, private _vsMsg: VscodeMessageService,
        public genSrv: GenerateService,
        private _app: AppComponent) {
        document.addEventListener('keydown', this.keydown);
    }

    keydown = (e) => {
        if (this.isEditFileMode) return;
        switch (e.keyCode) {
            case 27:
                e.stopPropagation();
                e.preventDefault();
                this._vsMsg.close();
                return false;
            case 13:
                e.stopPropagation();
                e.preventDefault();
                if (this.curTmpl)
                    this.edit(this.curTmpl);
                return false;
            case 40://down
                e.stopPropagation();
                e.preventDefault();
                this.next();
                return false;
            case 38:
                e.stopPropagation();
                e.preventDefault();
                this.pre();
                return false;
        }
    }

    ngOnDestroy() {
        document.removeEventListener('keydown', this.keydown)
    }

    public get isEditFileMode() {
        return this._app.isEditFileMode;
    }
    public set isEditFileMode(value) {
        this._app.isEditFileMode = value;
    }

    get tmpls(): ITmplItem[] {
        return this._tmplSrv.tmpls;
    }

    get hasTmpl(): boolean {
        return this.tmpls && this.tmpls.length > 0;
    }

    get curTmpl(): ITmplItem {
        return this._tmplSrv.curTmpl;
    }

    activeTmpl(tmpl: ITmplItem) {
        this._tmplSrv.activeTmpl(tmpl);
    }

    get curIndex(): number {
        return this.tmpls.indexOf(this.curTmpl);
    }

    next() {
        let index = this.curIndex;
        let lastIndex = this.tmpls.length - 1;
        if (index < lastIndex) {
            this.activeTmpl(this.tmpls[index + 1]);
        }
    }

    pre() {
        let index = this.curIndex;
        if (index > 0) {
            this.activeTmpl(this.tmpls[index - 1]);
        }

    }

    remove(tmpl: ITmplItem) {
        this._tmplSrv.remove(tmpl);
    }

    removeAll() {
        this._tmplSrv.removeAll();
    }


    report() {
        console.log(JSON.stringify(this.tmpls));
    }

    edit(tmpl: ITmplItem) {
        this.genSrv.editTmpl(tmpl).subscribe((p) => {
            this._tmplSrv.save();
        });
        this.isEditFileMode = true;
    }
    add() {
        let tmpl: ITmplItem = {
            title: 'new_tmpl',
            files: []
        };
        this.genSrv.editTmpl(tmpl).subscribe((tmpl) => {
            this._tmplSrv.add(tmpl);
        });
        this.isEditFileMode = true;
    }
    copy(tmpl: ITmplItem) {
        this._tmplSrv.copy(tmpl);
    }
    sortTmpl() {
        this._tmplSrv.sort();
    }
}
