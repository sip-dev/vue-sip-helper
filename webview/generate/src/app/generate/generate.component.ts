import { Component, OnDestroy, ViewChild } from '@angular/core';
import { NgbTypeahead } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, merge } from 'rxjs/operators';
import { AppComponent } from '../app.component';
import { IFileItem, IGenTypeInfo, ITmplItem } from '../core/base';
import { CloneTmpl, DEFAULT_TMPLS, VARS } from '../core/lib';
import { GenerateTmplService } from '../core/services/generate-tmpl.service';
import { GenerateService } from '../core/services/generate.service';
import { VscodeMessageService } from '../core/services/vscode-message.service';
import { SipRenderFile } from '../core/sip-render-file';
@Component({
  selector: 'sip-generate',
  templateUrl: './generate.component.html',
  styles: []
})
export class GenerateComponent implements OnDestroy {

  constructor(public genSrv: GenerateService,
    private _genTmplSrv: GenerateTmplService,
    private _vsMsg: VscodeMessageService,
    private _app: AppComponent) {
    document.addEventListener('keydown', this.keydown);
  }

  keydown = (e) => {
    if (!this.isEditFileMode) return;
    switch (e.keyCode) {
      case 27:
        e.stopPropagation();
        e.preventDefault();
        this.back();
        return false;
      case 83:
        if (!e.ctrlKey) return;
        e.stopPropagation();
        e.preventDefault();
        this.saveTmpl();
        return false;

    }
  }

  back() {
    this.isEditFileMode = false;
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
  vars: string = VARS.join(', ');
  editContentType = 0;

  log(p: any) {
    console.log(p);
  }

  get typeList(): any[] {
    return this.genSrv.typeList;
  }

  get curTypeInfo(): IGenTypeInfo {
    return this.genSrv.curTypeInfo;
  }

  get files(): IFileItem[] {
    return this.genSrv.files;
  };

  get hasFile(): boolean {
    return this.files && this.files.length > 0;
  }

  get curFile(): IFileItem {
    return this.genSrv.curFile;
  };

  public get input(): string {
    return this._vsMsg.input;
  }
  public set input(p: string) {
    this._vsMsg.input = p;
  }

  public get prefix(): string {
    return this._vsMsg.prefix;
  }
  public set prefix(p: string) {
    this._vsMsg.prefix = p;
  }
  

  render = new SipRenderFile();

  getFileFullName(file: IFileItem) {
    file.input = this.input;
    return this.render.getFileFullPath(file, this.curEditTmplTitle);
  }

  activeFice(file: IFileItem) {
    let hasContentType = true;
    switch (this.editContentType) {
      case 1:
        hasContentType = file.typeInfo.extend;
        break;
    }
    if (!hasContentType) this.editContentType = 0;
    return this.genSrv.activeFile(file);
  }

  changeType() {
    this.genSrv.changeType();
  }

  add() {
    let index = ~~this.tmplIndex;
    let tmpl = (index < 0) ? CloneTmpl(DEFAULT_TMPLS[0]) : this.tmpls[index];
    if (tmpl)
      this.genSrv.addFileFromTmpl(tmpl);
    this.showFormType = 'list';
  }

  showFormType = 'list';

  remove(file: IFileItem) {
    this.genSrv.remove(file);
  }

  removeAll() {
    this.genSrv.removeAll();
  }

  tmplIndex: string = "-1";
  get tmpls(): ITmplItem[] {
    return this._genTmplSrv.tmpls;
  }

  close() {
    this._vsMsg.close();
  }

  modules = this._vsMsg.options.modules;
  @ViewChild('instImportM') instImportM: NgbTypeahead;
  focusImportM = new Subject<string>();
  clickImportM = new Subject<string>();
  searchImportM = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      merge(this.focusImportM),
      merge(this.clickImportM.pipe(filter(() => !this.instImportM.isPopupOpen()))),
      map(term => (term === '' ? this.modules
        : this.modules.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 10))
    );


  @ViewChild('instImportM') instImportR: NgbTypeahead;
  focusImportR = new Subject<string>();
  clickImportR = new Subject<string>();
  searchImportR = (text$: Observable<string>) =>
    text$.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      merge(this.focusImportR),
      merge(this.clickImportR.pipe(filter(() => !this.instImportR.isPopupOpen()))),
      map(term => (term === '' ? this.modules
        : this.modules.filter(v => v.toLowerCase().indexOf(term.toLowerCase()) > -1)).slice(0, 10))
    );

  public get curEditTmplTitle(): string {
    return this.genSrv.curEditTmplTitle;
  }
  public set curEditTmplTitle(value: string) {
    this.genSrv.curEditTmplTitle = value;
  }

  saveTmpl() {
    // this.genSrv.curEditTmpl.title = this.curEditTmplTitle;
    this.genSrv.saveTmpl();
    this.isEditFileMode = false;
  }
}
