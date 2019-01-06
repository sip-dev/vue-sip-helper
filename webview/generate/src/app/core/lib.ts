import { IFileItem, IGenType } from "./base";

// export const TYPES: IGenType = {
//     'module': {
//         ts: true, spec: true, importToModue: true, importToRouting: true,
//         moduleExport: true, moduleImport: true
//     },
//     'component': {
//         ts: true, html: true, style: true, styleType: "less", spec: true,
//         importToModue: true, importToRouting: true,
//         moduleDeclaration: true, moduleEntryComponent: true, moduleExport: true
//     },
//     'service': { ts: true, spec: true, importToModue: true, moduleProvider: true },
//     'directive': { ts: true, spec: true, importToModue: true, moduleDeclaration: true, moduleExport: true },
//     'pipe': { ts: true, spec: true, importToModue: true, moduleDeclaration: true, moduleExport: true },
//     'class': { ts: true, spec: true },
//     'guard': { ts: true, spec: true, importToModue: true, moduleProvider: true, moduleExport: true },
//     'interface': { ts: true },
//     'enum': { ts: true }
// };

export const TYPES: IGenType = {
    'extend': { extend: true }
};

// export const VARS = [
//     'input', 'prefix',
//     'fileName', 'type', 'path', 'className', 'styleType', 'importToModue', 'importToRouting',
//     'curPath', 'curFile', 'workspaceRoot', 'extend', 'pathType', 'helper'
// ];

export const VARS = [
    'input', 'prefix', 'isDir', 'isLinux', 'tmplName',
    'fileName', 'pathType', 'extend', 'path', 'className',
    'curPath', 'curFile', 'workspaceRoot', '$data', '$helper'
];

export function GetDefaultFile(): IFileItem {
    let type = 'extend';
    let typeInfo = Object.assign({}, TYPES[type]);
    return {
        input: '',
        fileName: '',
        path: '',
        className: '',
        type: type,
        typeInfo: typeInfo,
        active: false,
        pathType: 'file'
    }
}

export function CloneFile(file: IFileItem): IFileItem {
    let fileTemp = Object.assign({}, file);
    fileTemp.typeInfo && (fileTemp.typeInfo = Object.assign({}, fileTemp.typeInfo));
    return fileTemp;
};

export function JoinPath(path: string, fileName: string): string {
    return [path.trim(), fileName.trim()].join(_pathSplice).replace(/[\\\/]{1,}/g, _pathSplice).replace(/^[\/\\]/, '');
}

let _pathSplice = '/';

export interface IVscodeOption {
    curPath?: string;
    curFile?: string;
    isDir?: boolean;
    isLinux?: boolean;
    input?: string;
    prefix?: string;
    fileName?: string;
    workspaceRoot?: string;
    extensionPath?: string;
    modules: string[];
    generate?: { input: string; tmpl: string; };
    helper?: string;
}

export interface ITmplItem {
    title: string;
    index?: number;
    active?: boolean;
    files: IFileItem[];
}

export interface IConfig {
    prefix?: string;
    templates?: ITmplItem[];
}

export function GetDefaultTmpl(): ITmplItem {
    return { title: '', active: false, files: [] };
}

export function CloneTmpl(tmpl: ITmplItem): ITmplItem {
    let tmplTemp = Object.assign({}, tmpl);
    tmplTemp.files = tmplTemp.files.slice().map((p) => {
        return CloneFile(p);
    });
    return tmplTemp;
}

export function MakeTmplIndex(tmpls: ITmplItem[]): ITmplItem[] {
    if (tmpls && tmpls.length > 0) {
        tmpls = tmpls.sort((item1, item2) => {
            item1.index = parseFloat(item1.index as any);
            item2.index = parseFloat(item2.index as any);
            return item1.index == item2.index ? 0 : (item1.index > item2.index ? 1 : -1);
        });
        tmpls.forEach((item, idx) => { item.index = idx; });
    }
    return tmpls;
}

export const DEFAULT_TMPLS: ITmplItem[] = [{
    "active": false,
    "index": 0,
    "files": [
        {
            "active": true,
            "className": "@{$helper.upperCamel(fileName)}",
            "fileName": "@{input}",
            "path": "",
            "pathType": "file",
            "extendContent": "export class @{className} {\n}\n",
            "type": "extend",
            "extend": "ts",
            "typeInfo": {
                "extend": true
            }
        }
    ],
    "title": "class"
}];