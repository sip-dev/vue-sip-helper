import { EventEmitter, Injectable } from '@angular/core';
import { CloneFile, GetDefaultFile, ITmplItem, TYPES } from '../lib';
import { GenerateTmplService } from './generate-tmpl.service';
import { VscodeMessageService } from './vscode-message.service';
import { IFileItem, IGenTypeInfo } from '../base';
import { SipRenderFile } from '../sip-render-file';

@Injectable()
export class GenerateService {

    constructor(
        private _genTmplSrv: GenerateTmplService,
        private _vsMsg: VscodeMessageService) {
        let typeList = [];
        Object.keys(TYPES).forEach((p) => {
            typeList.push(p);
        });
        this.typeList = typeList;
        this.activeFile(this.files[0]);
    }

    typeList: any[];
    curTypeInfo: IGenTypeInfo;

    files: IFileItem[] = [];

    curFile: IFileItem;

    activeFile(file: IFileItem) {
        this.curFile = file || GetDefaultFile();
        this.curTypeInfo = TYPES[this.curFile.type];
        if (!file) return;
        this.files.forEach((p) => {
            p.active = (p == file);
        });
    }

    changeType() {
        let file = this.curFile;
        this.curTypeInfo = TYPES[file.type];
        file.typeInfo = Object.assign({}, this.curTypeInfo);
    }

    add(addFileItem: IFileItem): IFileItem {
        let file = CloneFile(addFileItem);
        this.files.push(file);
        this.activeFile(file);
        return file;
    }

    addFileFromTmpl(tmpl: ITmplItem) {
        let files = tmpl.files.map((p) => { return CloneFile(p); });
        if (files.length == 0) return;
        let len = this.files.length;
        this.files = this.files.concat(files);
        this.activeFile(this.files[len]);
    }

    curEditTmpl: ITmplItem;
    curEditTmplTitle: string;
    private _onEdit: EventEmitter<any>;
    editTmpl(tmpl: ITmplItem): EventEmitter<any> {
        this.curEditTmplTitle = tmpl.title;
        this.curEditTmpl = tmpl;
        this.removeAll();
        this.addFileFromTmpl(tmpl);
        return this._onEdit = new EventEmitter<any>();
    }
    saveTmpl() {
        if (this.curEditTmpl) {
            let files = this.files.slice().map((p) => {
                return CloneFile(p);
            });
            this.curEditTmpl.files = files;
            this.curEditTmpl.title = this.curEditTmplTitle;
            this._onEdit && this._onEdit.emit(this.curEditTmpl);
        }
        this._onEdit = null;
    }

    remove(file: IFileItem) {
        let files = this.files;
        let index = files.indexOf(file);
        if (index >= 0) {
            files.splice(index, 1);
        }
        if (file == this.curFile) {
            let len = files.length;
            if (len <= index)
                this.activeFile(files[len - 1]);
            else
                this.activeFile(files[index]);
        }
    }

    removeAll() {
        this.files = [];
        this.activeFile(null);
    }

    addToTmpl(title: string) {
        let files = this.files.slice().map((p) => {
            return CloneFile(p);
        });
        this._genTmplSrv.add({
            title: title,
            files: files
        });
    }

    private render = new SipRenderFile();
    genReports: string[] = [];
    generating = 0;
    generateFirstFile:string;
    generate() {
        this.genReports = [];
        this.generating = 1;
        let saveList: {
            fileName: string;
            content?: string;
            className?: string;
            isModule?: boolean;
            isImportToModue?: boolean;
            importToModue?: string;
            isImportToRouting?: boolean;
            importToRouting?: string;
            typeInfo?: any;
            routePath?: string;
            dir:boolean;
            logs:string[];
        }[] = [];
        this.generateFirstFile = '';
        let input = this._vsMsg.input;
        this.files.forEach((file) => {
            file = CloneFile(file);
            file.input = input;
            saveList.push(this.render.renderFile(file, false, this.curEditTmplTitle));
        });
        let count = 0;
        saveList.forEach((file) => {
            count++;
            if (!file.dir){
                this.generateFirstFile || (this.generateFirstFile = file.fileName);
                this.genReports.push(...file.logs);
            }
            this._vsMsg.saveFile(file.fileName, file.content, null, null, file.dir).subscribe((res)=>{
                this.genReports.push(res || (file.fileName + '生成成功！！'));
                setTimeout(() => {
                    count--;
                    if (count == 0) {
                        this.generating = 2;
                        // this._generateImportToModule(saveList);
                    }
                });
            });
        });
    }

    // private _generateImportToModule(saveList: {
    //     fileName: string;
    //     content?: string;
    //     className?: string;
    //     isImportToModue?: boolean;
    //     importToModue?: string;
    //     isImportToRouting?: boolean;
    //     importToRouting?: string;
    //     routePath?: string;
    //     isModule?: boolean;
    //     typeInfo?: any;
    // }[]) {
    //     let count = 0;
    //     let has = false;
    //     saveList.forEach((file) => {
    //         if (file.isImportToModue && file.importToModue) {
    //             has = true;
    //             count++;
    //             this._vsMsg.importToModule(file.fileName, file.importToModue, file.className, file.typeInfo).subscribe((res)=>{
    //                 this.genReports.push(res || (file.fileName + '注册成功！！'));
    //                 setTimeout(() => {
    //                     count--;
    //                     if (count == 0) {
    //                         this.generating = 2;
    //                     }
    //                 });
    //             });
    //         }
    //         if (file.isImportToRouting && file.importToRouting) {
    //             has = true;
    //             count++;
    //             this._vsMsg.importToModule(file.fileName, file.importToRouting, file.className, { moduleRouting: true, routePath: file.routePath, isModule: file.isModule }).subscribe((res)=>{
    //                 this.genReports.push(res || (file.fileName + '注册成功！！'));
    //                 setTimeout(() => {
    //                     count--;
    //                     if (count == 0) {
    //                         this.generating = 2;
    //                     }
    //                 });
    //             });
    //         }
    //     });
    //     if (!has) this.generating = 2;
    // }
}
