import * as path from 'path';
import * as fs from 'fs';
import { Lib } from '../lib';

export interface GenerateParam {
    name: string;
    path: string;
    moduleFile: string;
    rootPath: string;
    [key: string]: any;
}

export interface ContentBase {
    generate: (params: GenerateParam) => string;
}

//#region about file

/**
 * 名称转换：sip-user_list.component ===> SipUserListComponent
 * @param name 
 */
export function MakeName(name: string) {
    return name.replace(/\b(\w)|\s(\w)/g, function (m) { return m.toUpperCase(); }).replace(/[-_.]/g, '');
}

/**
 * 生成文件名称
 * @param name 
 * @param prefix 
 * @param ext 
 */
export function MakeFileName(name: string, prefix: string, ext: string): string {
    let fileName = prefix ? [name, prefix, ext].join('.') : [name, ext].join('.');
    return fileName;
}

/**
 * 生成类名称
 * @param name 
 * @param prefix 
 */
export function MakeClassName(name: string, prefix: string) {
    let className = prefix ? [name, prefix].join('.') : name;
    return MakeName(className);
}

/**
 * 是否文件夹
 * @param fsPath 可以文件或目录
 */
export function IsDirectory(fsPath: string): boolean {
    let stats = fs.lstatSync(fsPath),
        isDir = stats.isDirectory();

    return isDir;
}

/**
 * 是否空文件夹
 * @param fsPath 可以文件或目录
 */
export function IsEmptyDirectory(fsPath: string): boolean {
    if (!IsDirectory(fsPath)) return false;
    return fs.readdirSync(fsPath).length <= 0;
}
/**
 * 如果是文件，返回文件所在目录；如果是目录直接返回
 * @param fsPath 可以文件或目录
 */
export function CalcPath(fsPath: string): string {
    let isDir = IsDirectory(fsPath);

    return isDir ? fsPath : path.dirname(fsPath);
}

const _rootRegex = /^\.\./;
/**
 * fsPath是否在rootPath里
 * @param rootPath 
 * @param fsPath 
 */
export function IsInRootPath(rootPath: string, fsPath: string): boolean {
    return !_rootRegex.test(path.relative(rootPath, fsPath));
}

/**
 * 从当前路径向上找到指定文件所在目录
 * FindPathUpward(rootPath, curPath, 'package.json')
 * @param rootPath 
 * @param curPath 可以文件或目录路径
 * @param fileName 文件名称
 */
export function FindPathUpward(rootPath: string, curPath: string, fileName: string): string {
    return FindPathUpwardIn(rootPath, CalcPath(curPath), fileName);
}

/**
 * 从当前路径向上找到指定文件所在路径（文件路径）
 * FindPathUpward(rootPath, curPath, 'package.json')
 * @param rootPath 
 * @param curPath 可以文件或目录路径
 * @param fileName 文件名称
 */
export function FindFileUpward(rootPath: string, curPath: string, fileName: string): string {
    let fsPath = FindPathUpwardIn(rootPath, CalcPath(curPath), fileName);
    return fsPath ? path.join(fsPath, fileName) : '';
}

function FindPathUpwardIn(rootPath: string, curPath: string, fileName: string): string {
    let fsPath = path.join(curPath, fileName);
    let exists = fs.existsSync(fsPath);
    if (exists)
        return curPath;
    else {
        if (!IsInRootPath(rootPath, curPath)) return '';
        curPath = FindPathUpwardIn(rootPath, path.dirname(curPath), fileName);
        return curPath;
    }
}

export function FindModuleFile(rootPath: string, curPath: string): string {
    let baseName = path.basename(curPath);
    let fsPath = path.join(curPath, [baseName, 'module.ts'].join('.'));
    if (fs.existsSync(fsPath))
        return fsPath;
    else {
        curPath = path.dirname(curPath);
        if (IsInRootPath(rootPath, curPath))
            return FindModuleFile(rootPath, curPath);
        else
            return '';
    }
};

let _sharedDirRegex = /\-shared$/i;
function _findSharedFiles(outList: string[], fsPath: string) {
    fs.readdirSync(fsPath).forEach((name) => {
        if (_sharedDirRegex.test(name)) {
            let file = path.join(fsPath, name, [name, 'module.ts'].join('.'));
            if (fs.existsSync(file))
                outList.push(file);
        }
    });
}

export function FindSharedModuleFiles(outList: string[], rootPath: string, curPath: string) {
    if (!IsInRootPath(rootPath, curPath)) return;
    _findSharedFiles(outList, curPath);
    curPath = path.dirname(curPath);
    FindSharedModuleFiles(outList, rootPath, curPath);
};

export function _FindUpwardModuleFiles(files: string[], rootPath: string, curPath: string, curFile: string, lv: number) {
    if (!IsInRootPath(rootPath, curFile)) return;

    let mdRegex = /module\.ts\s*$/i;
    let file, hasFile = false;
    fs.readdirSync(curPath).forEach(fileName => {
        if (mdRegex.test(fileName)) {
            file = path.join(curPath, fileName);
            if (file != curFile)
                files.push(file);
        }
    });
    if (lv < 2) {
        _FindUpwardModuleFiles(files, rootPath, path.dirname(curPath), curFile, lv + 1);
    }
};

export function FindUpwardModuleFiles(rootPath: string, curFile: string): string[] {
    let files = [];
    _FindUpwardModuleFiles(files, rootPath, CalcPath(curFile), curFile, 0);
    return files;
};

//#endregion about file

//#region Import

export function CalcImportPath(moduleFile: string, tsFile: string) {
    let mdPath = path.dirname(moduleFile);
    let tsPath = path.dirname(tsFile);
    let fileName = path.parse(tsFile).name;
    let importPath = ['.', path.relative(mdPath, tsPath), fileName].join('/');
    return importPath.replace(/\/{2,}/g, '/').replace(/(?:\.\/){2,}/g, './').replace(/[\/\\]+/g, '/').replace(/^\.\/\.\.\//, '../');
}

let _importRegex = /^\s*\bimport\b.+?from/i;
export function PushToImport(content: string, className: string, importPath: string): string {
    let _hasImportRegex = new RegExp('^\\s*\\bimport\\b.+?\\b' + className + '\\b.+?from', 'm');
    if (_hasImportRegex.test(content)) return content;

    let contentList = content.replace(/\n\r/g, '\n').split('\n').reverse();
    let hasImport = _importRegex.test(content);
    let importRegex = /^\s*import\s+/;
    let index = contentList.findIndex(item => { return _importRegex.test(item); });
    let has = true;
    if (index < 0) {
        index = contentList.length - 1;
        has = false;
    }

    let str = ["import { ", className, " } from '", importPath, "';"].join('');
    if (has)
        contentList[index] += ('\n' + str);
    else
        contentList[index] = str + '\n' + contentList[index];

    return contentList.reverse().join('\n');

}

export function RemoveFromImport(content: string, className: string): string {

    let contentList = content.replace(/\n\r/g, '\n').split('\n');
    let importRegex = new RegExp('^\\s*\\bimport\\b.*\\b' + className + '\\b');
    let change = false;
    let removeFn = function () {
        let index = contentList.findIndex(item => {
            return importRegex.test(item)
        });
        if (index > -1) {
            contentList.splice(index, 1);
            change = true;
            return true;
        } else
            return false;
    }
    while (removeFn()) { }

    return change ? contentList.join('\n') : content;
}

let _exportRegex = /^\s*\bexport\b.+?from/i;
export function PushToExport(content: string, className: string, importPath: string): string {
    let _hasExportRegex = new RegExp('^\\s*\\bexport\\b.+?\\bfrom\\b.+?[\'"]' + importPath, 'm');
    if (_hasExportRegex.test(content)) return content;

    let contentList = content.replace(/\n\r/g, '\n').split('\n').reverse();

    let index = contentList.findIndex(item => { return _exportRegex.test(item); });
    let has = true;
    let hasImport = true;
    if (index < 0) {
        index = contentList.findIndex(item => { return _importRegex.test(item); });
        has = false;
    }
    if (index < 0) {
        hasImport = false;
        index = contentList.length - 1;
    }

    let str = ["export * from '", importPath, "';"].join('');
    if (has)
        contentList[index] += ('\n' + str);
    else if (hasImport)
        contentList[index] += ('\n\n' + str);
    else
        contentList[index] = str + '\n' + contentList[index];

    return contentList.reverse().join('\n');

}

export function RemoveFromExport(content: string, className: string, importPath: string): string {

    let contentList = content.replace(/\n\r/g, '\n').split('\n');
    let exportRegex = new RegExp('^\\s*\\bexport\\b.*\\bfrom\\b');
    let exportPath = '\'' + importPath + '\'';
    let change = false;
    let removeFn = function () {
        let index = contentList.findIndex(item => {
            return exportRegex.test(item) && item.indexOf(exportPath) > 0
        });
        if (index > -1) {
            contentList.splice(index, 1);
            change = true;
            return true;
        } else
            return false;
    };
    while (removeFn()) { }

    return change ? contentList.join('\n') : content;
}

//#endregion Import

//#region getContent

interface IContentInfo {
    start: number;
    content: string;
    [key: string]: any;
}

function _escape(text: string): string {
    return encodeURIComponent(text).replace('\'', '%27');
}

function _unescape(text: string): string {
    return decodeURIComponent(text);
}

function _encodeNotes(content: string) {
    return content.replace(/\/\*\*((?:\n|\r|.)*?)\*\//gm, function (find, text) {
        return ['|>>', _escape(text), '>|'].join('');
    }).replace(/\/\/(.*)$/gm, function (find, text) {
        return ['|--', _escape(text)].join('');
    });
}

function _decodeNotes(content: string) {
    return content.replace(/\|\>\>((?:\n|\r|.)*?)\>\|/gm, function (find, text) {
        return ['/**', _unescape(text), '*/'].join('');
    }).replace(/\|\-\-(.*)$/gm, function (find, text) {
        return ['//', _unescape(text)].join('');
    });
}

function _getStrContent(content: string, split: string, start: number): IContentInfo {
    start++;
    let len = content.length;
    let prec, c, list = [];
    for (let i = start; i < len; i++) {
        c = content.charAt(i);
        if (prec != '\\' && c == split) {
            break;
        }
        list.push(c);
        prec = prec == '\\' ? '' : c;
    }
    return {
        start: start,
        content: list.join('')
    };
}

function _getRegexContent(content: string, start: number): IContentInfo {
    start++;
    let len = content.length;
    let prec, c, list = [];
    for (let i = start; i < len; i++) {
        c = content.charAt(i);
        if (prec != '\\' && c == '/') {
            break;
        }
        list.push(c);
        prec = prec == '\\' ? '' : c;
    }
    return {
        start: start,
        content: list.join('')
    };
}

let _strSplitRegex = /['"`]/;
function _getContentEx(content: string, start: number, splitStart: string, splitEnd: string): IContentInfo {
    start++;
    let len = content.length;
    let prec, c, list = [];
    let info: IContentInfo, lv = 0;
    for (let i = start; i < len; i++) {
        c = content.charAt(i);
        if (prec != '\\') {
            if (c == '/') {
                info = _getRegexContent(content, i);
                list.push(['/' + info.content, '/'].join(''));
                i = info.start + info.content.length;
            } else if (_strSplitRegex.test(c)) {
                info = _getStrContent(content, c, i);
                list.push([c + info.content, c].join(''));
                i = info.start + info.content.length;
            } else if (c == splitStart) {
                lv++;
                list.push(c);
            } else if (c == splitEnd) {
                if (lv == 0)
                    break;
                else {
                    lv--;
                    list.push(c);
                }
            } else
                list.push(c);
        } else
            list.push(c);
        prec = prec == '\\' ? '' : c;
    }

    return {
        start: start,
        content: list.join('')
    };
}

function _getContent(content: string, start: number, splitStart: string, splitEnd: string): IContentInfo {
    content = _encodeNotes(content.substr(start));
    let info = _getContentEx(content, 0, splitStart, splitEnd);
    if (!info) return null;
    return {
        start: start + 1,
        content: _decodeNotes(info.content)
    };
}

function _replaceContent(content: string, info: IContentInfo, newContent): string {
    let start = info.start;
    let end = start + info.content.length;
    return [content.substr(0, start), newContent, content.substr(end)].join('');
}

//#endregion getContent

//#region NgModuleProp

function _getNgModuleContent(content: string): IContentInfo {

    let typeRegex = /\@NgModule\s*\(\s*\{/;
    let regText = typeRegex.exec(content);
    if (regText) {
        let start = regText.index + regText[0].length - 1;//index到'['的位置
        return _getContent(content, start, '{', '}');
    }

    return null;
};

function _getNgModulePropContent(content: string, propName: string): IContentInfo {

    let typeRegex = new RegExp('\\b' + propName + '\\b\\s*\\:\\s*\\[');
    let regText = typeRegex.exec(content);
    if (regText) {
        let start = regText.index + regText[0].length - 1;//index到'['的位置
        return _getContent(content, start, '[', ']');
    }

    return null;
};

function _pushNgModulePropClass(content: string, propName: string, className: string) {
    let ngModuleInfo = _getNgModuleContent(content);
    if (!ngModuleInfo) return content;

    let info = _getNgModulePropContent(ngModuleInfo.content, propName);
    if (info && _hasClassName(info.content, className)) return content;

    let mdConten, descContent;
    if (info) {
        let isEmpty = !Lib.trim(info.content);
        descContent = isEmpty ? '\n        ' + className + '\n    '
            : Lib.trimEnd(info.content) + ',\n        ' + className + '\n    ';
        mdConten = _replaceContent(ngModuleInfo.content, info, descContent);

        content = _replaceContent(content, ngModuleInfo, mdConten);

    } else {
        descContent = propName + ': [\n        ' + className + '\n    ]'
        mdConten = Lib.trimEnd(ngModuleInfo.content) + ',\n    ' + descContent + '\n';
        content = _replaceContent(content, ngModuleInfo, mdConten);
    }

    return content.replace(/\,{2,}/g, ',');
}

function _newWordRegex(work: string) {
    return new RegExp('\\b' + work + '\\b');
}

function _hasClassName(content: string, className: string): boolean {
    return _newWordRegex(className).test(content);
}

function _removeNgModulePropClass(content: string, propName: string, className: string) {
    let ngModuleInfo = _getNgModuleContent(content);
    if (!ngModuleInfo) return content;

    let info = _getNgModulePropContent(ngModuleInfo.content, propName);
    if (info && _hasClassName(info.content, className)) {

        let removeRegex = new RegExp('\\,?(?:\\n|\\r|\\s)*\\b' + className + '\\b', 'g');
        let descContent = info.content.replace(removeRegex, '').replace(/^(?:\n|\r|\s|\,)*|(?:\n|\r|\s|\,)*$/, function (find) { return find.replace(',', ''); });
        let isEmpty = !Lib.trim(descContent);
        if (isEmpty) descContent = ' ';

        let mdConten = _replaceContent(ngModuleInfo.content, info, descContent);

        content = _replaceContent(content, ngModuleInfo, mdConten);

    }

    return content;
}

export function PushToModuleDeclarations(content: string, className: string) {
    return _pushNgModulePropClass(content, 'declarations', className);
}

export function RemoveFromModuleDeclarations(content: string, className: string) {
    return _removeNgModulePropClass(content, 'declarations', className);
}

export function PushToModuleEntryComponents(content: string, className: string) {
    return _pushNgModulePropClass(content, 'entryComponents', className);
}

export function RemoveModuleEntryComponents(content: string, className: string) {
    return _removeNgModulePropClass(content, 'entryComponents', className);
}

export function PushToModuleImports(content: string, className: string) {
    return _pushNgModulePropClass(content, 'imports', className);
}

export function RemoveFromModuleImports(content: string, className: string) {
    return _removeNgModulePropClass(content, 'imports', className);
}

export function PushToModuleExports(content: string, className: string) {
    return _pushNgModulePropClass(content, 'exports', className);
}

export function RemoveFromModuleExports(content: string, className: string) {
    return _removeNgModulePropClass(content, 'exports', className);
}

export function PushToModuleProviders(content: string, className: string) {
    return _pushNgModulePropClass(content, 'providers', className);
}

export function RemoveFromModuleProviders(content: string, className: string) {
    return _removeNgModulePropClass(content, 'providers', className);
}

//#endregion NgModuleProp

//#region route

interface IRouteItem {
    route: boolean;
    endRoute: boolean;
    content: string;
}

let _routeItemStartRegex = /\{/;
function _toRouteItems(content: string, outList: IRouteItem[]) {
    let find = _routeItemStartRegex.exec(content);
    if (find) {
        let start = find.index + find[0].length - 1;//index到'{'的位置
        outList.push({ route: false, endRoute: false, content: content.substr(0, start) });
        let info = _getContent(content, start, '{', '}');
        outList.push({ route: true, endRoute: false, content: info.content });
        start += info.content.length + 2;
        _toRouteItems(content.substr(start), outList);
    } else {
        outList.push({ route: false, endRoute: false, content: content });
    }
}

function _makeEndRoute(list: IRouteItem[]): IRouteItem[] {
    let endRoute = true;
    list = list.slice();
    list.reverse().forEach((item) => {
        if (!item.route) return;
        item.endRoute = endRoute;
        endRoute && (endRoute = false);
    });
    list.reverse();
    return list;
}

function _getRoutingInfo(content: string): IContentInfo {

    let typeRegex = /const\s+routes\s*:\s*Routes\s*\=\s*\[/m;
    let regText = typeRegex.exec(content);
    if (regText) {
        let start = regText.index + regText[0].length - 1;//index到'['的位置
        let info = _getContent(content, start, '[', ']');

        if (!info) return null;

        let outList: IRouteItem[] = [];
        _toRouteItems(info.content, outList);

        info.routes = outList
        return info;
    }

    return null;
}

function _trimRouteItem(str: string): string {
    return Lib.trim(str.replace(/^\,+|\,+$/g, ''), true);
}

function _makeRouteItems(list: IRouteItem[]): string {
    let retList = [], temp;
    list = _makeEndRoute(list);
    list.forEach((item) => {
        if (item.route) {
            retList.push(['    {', item.content, '}', item.endRoute ? '' : ','].join(''));
        } else {
            temp = _trimRouteItem(item.content);
            !temp || retList.push('    ' + temp);
        }
    });
    return '\n' + retList.join('\n') + '\n';
}

function _hasRouteItem(routeList: IRouteItem[], className: string, importPath: string, isChild: boolean): boolean {
    let childText = isChild ? `${importPath}#${className}` : '';
    return routeList.filter(item => {
        return isChild ? item.content.indexOf(childText) >= 0
            : _hasClassName(item.content, className);
    }).length > 0;
}

export function PushToModuleRouting(content: string, name: string, className: string, importPath: string, isChild?: boolean) {
    let info = _getRoutingInfo(content);
    if (_hasRouteItem(info.routes, className, importPath, isChild))
        return content;
    if (info) {
        let routeList: IRouteItem[] = info.routes;
        if (isChild) {
            routeList.push({
                route: true, endRoute: false,
                content: `
        path: '${name.replace(/-routing$/i, '')}',
        loadChildren: '${importPath}#${className}'
    `
            });
        } else {
            routeList.push({
                route: true, endRoute: false,
                content: `
        path: '${name}',
        component: ${className}
    `
            });
        }
        return _replaceContent(content, info, _makeRouteItems(routeList));
    } else
        return content;
}

export function RemoveFromModuleRouting(content: string, name: string, className: string, importPath: string, isChild?: boolean) {
    let info = _getRoutingInfo(content);
    if (info) {
        let routeList: IRouteItem[] = info.routes;
        let len = routeList.length;
        let filterChild = `'${importPath}#${className}'`;
        let compRegex = new RegExp('\\b' + className + '\\b');
        routeList = routeList.filter(route => {
            if (!route.route) return true;
            let item = route.content;
            return isChild ? item.indexOf(filterChild) < 0
                : !compRegex.test(item);
        });

        let change = len != routeList.length;

        if (change) {
            let retContent = _replaceContent(content, info, _makeRouteItems(routeList));
            return retContent;
        } else
            return content;
    } else
        return content;
}

//#endregion route

export function IsInModuel(content: string, className: string): boolean {
    return new RegExp('\\b' + className + '\\b').test(content);
}