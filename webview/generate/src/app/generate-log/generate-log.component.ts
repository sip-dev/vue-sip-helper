import { Component, OnDestroy, OnInit } from '@angular/core';
import { IVscodeOption } from '../core/lib';
import { GenerateTmplService } from '../core/services/generate-tmpl.service';
import { GenerateService } from '../core/services/generate.service';
import { VscodeMessageService } from '../core/services/vscode-message.service';

@Component({
  selector: 'sip-generate-log',
  templateUrl: './generate-log.component.html'
})
export class GenerateLogComponent implements OnInit, OnDestroy {

  constructor(public genSrv: GenerateService, private _vsMsg: VscodeMessageService,
    private _genTmplSrv: GenerateTmplService) {
    this.vscodeOptions = _vsMsg.options;
    let generateOpt = this.vscodeOptions.generate;
    if (generateOpt) {
      this._vsMsg.input = generateOpt.input || 'demo';
      let title = generateOpt.tmpl;
      let tmpl = this._genTmplSrv.getTmpl(title);
      if (tmpl) {
        this.genSrv.addFileFromTmpl(tmpl);
        this.genSrv.generate();
      }
      document.addEventListener('keydown', this.keydown);
    }
  }

  keydown = (e) => {
    switch (e.keyCode) {
      case 13:
      case 27:
        e.stopPropagation();
        e.preventDefault();
        this.close();
        return false;

    }
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.keydown)
  }

  vscodeOptions: IVscodeOption;
  get generating(): number {
    return this.genSrv.generating;
  }

  set generating(p: number) {
    this.genSrv.generating = p;
  }

  close() {
    if (this.genSrv.generateFirstFile) {
      this._vsMsg.openFile(this.genSrv.generateFirstFile).subscribe();
    }
    this._vsMsg.close();
  }
  ngOnInit() {
  }
  get genReports(): string[] {
    return this.genSrv.genReports;
  }

}
