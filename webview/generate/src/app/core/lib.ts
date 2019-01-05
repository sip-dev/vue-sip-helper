import { SipRender } from "./sip-render";

export interface IFileItem {
    input?: string;
    fileName: string;
    path: string;
    pathType?: 'dir' | 'file';
    type: string;
    className: string;
    typeInfo?: IGenTypeInfo;
    active: boolean;
    importToModue?: string;
    importToRouting?: string;
    tsContent?: string;
    specContent?: string;
    htmlContent?: string;
    styleContent?: string;
    extend?: string;
    extendContent?: string;
}

export interface IGenTypeInfo {
    ts?: boolean;
    html?: boolean;
    style?: boolean;
    styleType?: string;
    spec?: boolean;
    importToModue?: boolean;
    importToRouting?: boolean;
    moduleExport?: boolean;
    moduleImport?: boolean;
    moduleDeclaration?: boolean;
    moduleEntryComponent?: boolean;
    moduleProvider?: boolean;
    extend?: boolean;
}

export interface IGenType {
    [key: string]: IGenTypeInfo;
}

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

export const STYLES = ['css', 'less', 'sass'];

export const VARS = [
    'input', 'prefix',
    'fileName', 'type', 'path', 'className', 'styleType', 'importToModue', 'importToRouting',
    'curPath', 'curFile', 'workspaceRoot', 'extend', 'pathType', 'helper'
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
        importToModue: '',
        active: false,
        pathType: 'file',
        tsContent: '',
        specContent: '',
        htmlContent: '',
        styleContent: ''
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

export function GetFileFullName(file: IFileItem): string {
    // let type = file.type;
    let typeInfo = file.typeInfo;
    let name = file.fileName.trim();

    if (file.pathType != 'dir') {
        let exts = [];
        typeInfo.ts && exts.push('ts');
        typeInfo.extend && exts.push(file.extend);
        typeInfo.spec && exts.push('spec');
        typeInfo.html && exts.push('html');
        typeInfo.style && exts.push(typeInfo.styleType);
        name = [name, exts.join(' | ')].join('.').replace(/[.]{2,}/g, '.');
    }
    name = name.replace(/[.]{2,}/g, '.');

    let fullName = JoinPath(file.path, name);
    return GetVar(file, fullName);
}

export function GetFileFullNameList(file: IFileItem): string[] {
    let type = file.type;
    let typeInfo = file.typeInfo;
    let fileList: string[] = [];
    let fileName = GetVar(file, JoinPath(file.path, file.fileName));
    typeInfo.ts && fileList.push([fileName, 'ts'].join('.'));
    typeInfo.extend && fileList.push([fileName, file.extend].join('.'));
    typeInfo.spec && fileList.push([fileName, 'spec'].join('.'));
    typeInfo.html && fileList.push([fileName, 'html'].join('.'));
    typeInfo.style && fileList.push([fileName, typeInfo.styleType || 'css'].join('.'));
    return fileList;
}

export function GetFileFullList(file: IFileItem): { fileName: string, content: string, dir: boolean }[] {
    let type = file.type;
    let typeInfo = file.typeInfo;
    let fileList = [];
    let fileName = GetVar(file, JoinPath(file.path, file.fileName));
    let dir = file.pathType == 'dir';
    if (typeInfo.ts) {
        let isImportToModue = file.typeInfo.importToModue;
        let isImportToRouting = file.typeInfo.importToRouting;
        fileList.push({
            fileName: dir ? fileName : [fileName, 'ts'].join('.'),
            content: GetVar(file, file.tsContent),
            className: file.className ? GetVar(file, file.className) : '',
            isModule: file.type == 'module',
            isImportToModue: file.typeInfo.importToModue,
            importToModue: file.importToModue ? GetVar(file, file.importToModue) : '',
            isImportToRouting: file.typeInfo.importToRouting,
            importToRouting: file.importToRouting ? GetVar(file, file.importToRouting) : '',
            routePath: GetVar(file, '@{fileName}').split('.')[0],
            typeInfo: Object.assign({}, file.typeInfo),
            dir: dir
        });
    }
    if (typeInfo.extend) {
        fileList.push({
            fileName: dir ? fileName : [fileName, file.extend].join('.'),
            content: GetVar(file, file.extendContent),
            dir: dir
        });
    }
    if (typeInfo.spec) {
        fileList.push({
            fileName: dir ? fileName : [fileName, 'spec.ts'].join('.'),
            content: GetVar(file, file.specContent),
            dir: dir
        });
    }
    if (typeInfo.html) {
        fileList.push({
            fileName: dir ? fileName : [fileName, 'html'].join('.'),
            content: GetVar(file, file.htmlContent),
            dir: dir
        });
    }
    if (typeInfo.style) {
        fileList.push({
            fileName: dir ? fileName : [fileName, typeInfo.styleType || 'css'].join('.'),
            content: GetVar(file, file.styleContent),
            dir: dir
        });
    }
    return fileList;
}

const _varFindRegex = /\@\{\s*#*\s*([^\}]+)\s*\}/gi;
export function GetVar(file: IFileItem, value: string): string {
    if (!value) return "";
    _varFindRegex.lastIndex = 0;
    if (!_varFindRegex.test(value)) return value;
    let data = Object.assign({
        styleType: file.typeInfo.styleType
    }, _varObj, file);
    return SipRender.render(value, data);
    // _varFindRegex.lastIndex = 0;
    // value = value.replace(_varFindRegex, function (find, name) {
    //     var text = '';
    //     if (name == 'styleType') {
    //         text = file.typeInfo.styleType;
    //     } else
    //         text = GetVarProp(file, name);
    //     text = GetVar(file, text);
    //     return find.indexOf('#') >= 0 ? MakePascalCasingName(text) : text;
    // });

    // return value;
}

let _pathSplice = '/';
// function GetVarProp(file: IFileItem, prop: string): string {
//     let str: string;
//     if (prop in file)
//         str = file[prop];
//     else if (prop in _varObj)
//         str = _varObj[prop];
//     return str ? str.replace('{' + prop + '}', '') : '';
// }

let _varObj: any = {};
export function SetVarObject(obj: object) {
    _varObj = Object.assign(_varObj, obj);
    _pathSplice = _varObj['isLinux'] ? '/' : '\\';
};

/**
 * 名称转换：sip-user_list.component ===> SipUserListComponent
 * @param name 
 */
export function MakePascalCasingName(name: string) {
    _varFindRegex.lastIndex = 0;
    if (_varFindRegex.test(name)) return name;
    return name.replace(/\b(\w)|\s(\w)/g, function (m) { return m.toUpperCase(); }).replace(/[^a-z0-9]/gi, '');
}

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
            "className": "@{#fileName}",
            "fileName": "@{input}",
            "htmlContent": "",
            "importToModue": "",
            "path": "",
            "pathType": "file",
            "specContent": "import { @{className} } from './@{fileName}';\n\ndescribe('@{className}', () => {\n  it('should create an instance', () => {\n    expect(new @{className}()).toBeTruthy();\n  });\n});\n",
            "styleContent": "",
            "tsContent": "export class @{className} {\n}\n",
            "type": "extend",
            "extend": "ts",
            "typeInfo": {
                "extend": true
            }
        }
    ],
    "title": "class"
}];