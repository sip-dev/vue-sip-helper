'use strict';
import * as fs from 'fs';
import * as path from 'path';
import { commands, ExtensionContext, Position, Range, Terminal, TextDocument, Uri, ViewColumn, window, workspace } from 'vscode';
import { CalcImportPath, CalcPath, ContentBase, FindModuleFile, FindPathUpward, FindUpwardModuleFiles, IsDirectory, IsEmptyDirectory, MakeClassName, PushToImport, PushToModuleDeclarations, PushToModuleEntryComponents, PushToModuleExports, PushToModuleImports, PushToModuleProviders, PushToModuleRouting } from './contents/content-base';
import { SipRegModule } from './contents/sip-reg-module';
import { Lib } from './lib';

let argv = require('yargs-parser');


let stringify = require('json-stable-stringify');
var jsonic = require('jsonic');

function getCurrentPath(args): string {
    return args && args.fsPath ? args.fsPath : (window.activeTextEditor ? window.activeTextEditor.document.fileName : '');
}

function getRelativePath(args): string {
    let fsPath = getCurrentPath(args);

    return CalcPath(fsPath);
}

export interface IParam {
    param: string;
    title: string;
    input: boolean;
    terminal?: string;
}

export interface IConfig {
    prefix: string;
    commands: IConfigCommand[];
    templates: any[];
}

export interface IConfigCommand {
    command: string;
    title: string;
    terminal: string;
    input: boolean;
    path: string;
    builtin: boolean;
    children: IConfigCommand[];
    params: IParam[];
}

export function activate(context: ExtensionContext) {

    let _rootPath = workspace.rootPath;
    let _getRootPath = (): string => {
        return _rootPath;
    }, _calcRootPath = (curPath: string) => {
        curPath = CalcPath(curPath);
        _rootPath = FindPathUpward(workspace.rootPath, curPath, 'package.json')
            && workspace.rootPath;
    };

    context.subscriptions.push({
        dispose: () => {
            Object.keys(terminals).forEach(key => {
                dispose_Terminal(key);
            })
        }
    });
    let mkdirSync = function (fsPath: string) {
        let pathParent = path.dirname(fsPath);
        if (!fs.existsSync(pathParent)) mkdirSync(pathParent);
        fs.mkdirSync(fsPath);
    };
    context.subscriptions.push(commands.registerCommand('vuesiphelper.sipgenerate', (args) => {
        _preDoneRegisterCommand(args);
        let config = getConfig();
        let picks = config.templates.map(tmpl => tmpl.title);
        window.showQuickPick(picks).then(tmpl => {
            if (!tmpl) return;
            window.showInputBox({
                prompt: '请输入文件名称/内容？',
                value: _fileName
            }).then((fileName) => {
                if (fileName) {
                    if (/[~`!#$%\^&*+=\[\]\\';,{}|\\":<>\?]/g.test(fileName)) {
                        window.showInformationMessage('文件名称存在不合法字符!');
                    } else {
                        showSipGenerateUI(args, { tmpl: tmpl, input: path.basename(fileName), path: path.dirname(fileName) });
                    }
                }
            },
                (error) => console.error(error));
        });
    }));
    context.subscriptions.push(commands.registerCommand('vuesiphelper.sipgenerate.tmpl', (args) => {
        _preDoneRegisterCommand(args);
        showSipGenerateUI(args);
    }));
    context.subscriptions.push(commands.registerCommand('vuesiphelper.component.switchfile', (args) => {
        let curFile = getCurrentPath(args);
        let curPath = path.dirname(curFile);
        let curFileName = path.basename(curFile);
        let curFileList = fs.readdirSync(curPath);
        if (curFileList && curFileList.length >  0){
            let picks = curFileList.filter((fileName) => fileName != curFileName && !IsDirectory(path.join(curPath, fileName)));

                window.showQuickPick(picks).then(file => {
                    if (!file) return;
                    file = path.join(curPath, file);
                    _openFile(file);
                });
        }
    }));

    let regModule = (file: string, moduleFile: string, className: string, regOpt: {
        moduleExport?: boolean;
        moduleImport?: boolean;
        moduleDeclaration?: boolean;
        moduleEntryComponent?: boolean;
        moduleProvider?: boolean;
        moduleRouting?: boolean;
        routePath: string;
        isModule?: boolean;
    }): boolean => {
        let workspaceRoot = _getRootPath();
        let regFile: string = file;
        let regFilePath: string = path.dirname(regFile);
        let regModuleFile: string = moduleFile;
        let regImportFile: string = CalcImportPath(regModuleFile, regFile);
        let regClassName = className;

        if (fs.existsSync(regFile) && fs.existsSync(regModuleFile)) {
            let regContent = fs.readFileSync(regModuleFile, 'utf-8');
            regContent = PushToImport(regContent, regClassName, regImportFile);
            if (regOpt.moduleImport) {
                regContent = PushToModuleImports(regContent, regClassName);
            }
            if (regOpt.moduleProvider) {
                regContent = PushToModuleProviders(regContent, regClassName);
            }
            if (regOpt.moduleDeclaration) {
                regContent = PushToModuleDeclarations(regContent, regClassName);
            }
            if (regOpt.moduleExport) {
                regContent = PushToModuleExports(regContent, regClassName);
            }
            if (regOpt.moduleEntryComponent) {
                regContent = PushToModuleEntryComponents(regContent, regClassName);
            }
            if (regOpt.moduleRouting) {
                regContent = PushToModuleRouting(regContent, regOpt.routePath || '', regClassName, regImportFile, regOpt.isModule);
            }
            fs.writeFileSync(regModuleFile, regContent, 'utf-8');
            return true;
        } else
            return false;
    };

    let _fileName = '', _curFile = '';
    context.subscriptions.push(commands.registerCommand('vuesiphelper.quickpicks', (args) => {
        let curPath = _preDoneRegisterCommand(args);

        _calcRootPath(curPath);

        let configs = getConfig().commands;

        showQuickPick(configs, _getRootPath(), args);

    }));

    let terminals = {};
    let send_terminal = (name: string, path: string, cmd: string) => {
        name || (name = "ng-alain-sip");
        dispose_Terminal(name);
        let terminal = terminals[name] = window.createTerminal(name);
        terminal.show(true);
        path && terminal.sendText('cd "' + path + '"');
        terminal.sendText(cmd);
    };
    let dispose_Terminal = (name: string) => {
        let terminal: Terminal = terminals[name];
        try {
            if (terminal) {
                terminals[name] = null;
                terminal.dispose();
            }
        } catch (e) {
            return;
        }
    };
    let getVarText = (text: string, params: { args: any; input: string; params: string; }): string => {
        text = text.replace(/\%currentpath\%/gi, getRelativePath(params.args));
        text = text.replace(/\%workspaceroot\%/gi, _getRootPath());
        text = text.replace(/\%input\%/gi, params.input);
        text = text.replace(/\%params\%/gi, params.params);
        return text;
    };
    let _openFile = (file: string): PromiseLike<TextDocument> => {
        return file ? workspace.openTextDocument(file).then(r => {
            window.showTextDocument(r, { preview: false });
            return r;
        }) : Promise.resolve<any>(null);
    };
    let send_builtin = (config: IConfigCommand, args, params: string, fsPath: string, inputText: string) => {
        let p = argv(params || '');
        let rootPath = _getRootPath();
        let gParam = Object.assign({
            name: inputText,
            path: fsPath,
            rootPath: rootPath,
            moduleFile: FindModuleFile(rootPath, fsPath)
        }, p);
        switch (config.command) {
            case 'config':
                setConfig();
                break;
            case 'npm':
                npm();
                break;
            case 'snippet-text':
                commands.executeCommand('vuesiphelper.tosnippettext', args);
                break;
            case 'json-class':
                commands.executeCommand('vuesiphelper.jsontoclass', args);
                break;
            case 'json-interface':
                commands.executeCommand('vuesiphelper.jsontointerface', args);
                break;
            case 'region':
                commands.executeCommand('vuesiphelper.region', args);
                break;
            case 'sip-generate':
                commands.executeCommand('vuesiphelper.sipgenerate', args);
                break;
            case 'sip-generate-tmpl':
                commands.executeCommand('vuesiphelper.sipgenerate.tmpl', args);
                break;
            case 'sip-regmodlue':
                sipRegmodlue(new SipRegModule(), gParam);
                break;
            case 'sip-gen-del':
                if (IsDirectory(_curFile)) {
                    window.showWarningMessage('不能处理目录!');
                } else {
                    window.showInformationMessage(`确定要删除 ${path.basename(_curFile)} 吗?`, '确定').then((text) => {
                        if (text == '确定') sipGenerateDel(gParam);
                    });
                }
                break;
        }
    };
    let sipRegmodlue = (genObj: ContentBase, p: any) => {
        if (IsDirectory(_curFile)) {
            window.showWarningMessage('不能处理目录!');
            return;
        }
        let rootPath = p.rootPath;
        let curFile = p.path = _curFile;
        let curPath = path.dirname(_curFile);
        p.name = path.basename(_curFile).split('.')[0];
        let files = FindUpwardModuleFiles(rootPath, curFile);
        let routingRegex = /\-routing\./i;
        files = files.filter((file) => {
            if (p.routing) return routingRegex.test(file);
            if (p.module) return true;
            if (p.both) return !routingRegex.test(file);

            if (p.cleanrouting) return routingRegex.test(file);
            if (p.cleanmodule) return true;
            if (p.cleanboth) return !routingRegex.test(file);
        });
        let picks = files.map(file => path.relative(curPath, file));
        window.showQuickPick(picks).then(file => {
            if (!file) return;
            file = path.join(curPath, file);
            if (p.both || p.cleanboth) {
                //处理module
                p.moduleFile = file;
                p.module = p.both;
                p.routing = false;
                p.cleanmodule = p.cleanboth;
                p.cleanrouting = false;
                genObj.generate(p);
                //处理routing
                p.moduleFile = file.replace(/\.module\.ts$/, '-routing.module.ts');
                p.module = false;
                p.routing = p.both;
                p.cleanmodule = false;
                p.cleanrouting = p.cleanboth;
                genObj.generate(p);

            } else {
                p.moduleFile = file;
                genObj.generate(p);
            }
        });
    };
    let sipGenerateDel = (p: any, args?: any) => {
        p.cleanmodule = true;
        p.cleanrouting = true;
        let rootPath = p.rootPath;
        let curFile = p.path = _curFile;
        p.name = path.basename(_curFile).split('.')[0];
        let files = FindUpwardModuleFiles(rootPath, curFile);
        files.forEach((file) => {
            if (!file) return;
            p.moduleFile = file;
            new SipRegModule().generate(p);
        });

        let delInfo = path.parse(curFile);
        let delPath = path.join(delInfo.dir, delInfo.name);
        ['html', 'ts', 'css', 'less', 'spec.ts'].map((item) => {
            let file = [delPath, item].join('.');
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
            }
        })
        if (IsEmptyDirectory(delInfo.dir))
            fs.rmdirSync(delInfo.dir);
    };
    let showQuickPick = (configs: IConfigCommand[], parentPath: string, args) => {
        let picks = configs.map(item => item.title);

        window.showQuickPick(picks).then((title) => {
            if (!title) return;
            let config: IConfigCommand = configs.find(item => item.title == title);
            if (!config) return;
            let path = config.path ? config.path : parentPath;
            let children = config.children;
            let params = config.params;
            if (children && children.length > 0) {
                showQuickPick(children, path, args);
            } else if (params && params.length > 0) {
                showParamsQuickPick(config, path, args);
            } else {
                send_command(config.terminal, path, config.command, '', config.input, args, config);
            }
        });

    };
    let showParamsQuickPick = (config: IConfigCommand, path: string, args) => {
        let params = config.params;

        let doneFn = (param: IParam) => {
            let cmd = config.command;
            if (!cmd) return;
            let input = 'input' in param ? param.input : config.input;
            send_command(param.terminal || config.terminal, path, cmd, param.param, input, args, config);
        };

        if (params.length <= 1) {
            doneFn(params[0]);
            return;
        }

        let picks = params.map(item => item.title);
        window.showQuickPick(picks).then((title) => {
            if (!title) return;
            let param: IParam = params.find(item => item.title == title);
            param && doneFn(param);
        });
    };

    let send_command = (name: string, path: string, cmd: string, params: string, input: boolean, args, config: IConfigCommand, inputText = '') => {
        if (!input) {
            path = getVarText(path, {
                args: args,
                input: inputText, params: params
            });
            if (config.builtin) {
                send_builtin(config, args, params, path, inputText);
            } else if (cmd) {
                cmd = getVarText(cmd, {
                    args: args,
                    input: inputText, params: params
                });
                send_terminal(name, path, cmd);
            }
        }
        else {
            window.showInputBox({
                prompt: '请输入文件名称/内容？',
                value: _fileName
            }).then((fileName) => {
                if (fileName) {
                    if (/[~`!#$%\^&*+=\[\]\\';,{}|\\":<>\?]/g.test(fileName)) {
                        window.showInformationMessage('文件名称存在不合法字符!');
                    } else {
                        send_command(name, path, cmd, params, false, args, config, fileName);
                    }
                }
            },
                (error) => console.error(error));
        }
    };

    let configFile = './vue-sip-helper.config.json';

    let getConfig = (): IConfig => {
        let fsPath = path.join(_getRootPath(), configFile);
        let fsDefaultConfig = fs.readFileSync(path.join(context.extensionPath, 'default.config.json'), 'utf-8');
        return (!fs.existsSync(fsPath)) ? jsonic(fsDefaultConfig) : jsonic(fs.readFileSync(fsPath, 'utf-8'));
    };

    let setConfig = () => {
        let fsPath = path.join(_getRootPath(), configFile);
        if (!fs.existsSync(fsPath))
            saveDefaultConfig();

        workspace.openTextDocument(fsPath).then((textDocument) => {
            if (!textDocument) return;
            window.showTextDocument(textDocument).then((editor) => {
            });
        });
    };

    let saveDefaultConfig = () => {
        let fsPath = path.join(_getRootPath(), configFile);
        let fsDefaultConfig = fs.readFileSync(path.join(context.extensionPath, 'default.config.json'), 'utf-8');
        fs.writeFileSync(fsPath, fsDefaultConfig, 'utf-8');
    };

    let saveConfigTmpls = (templates: any[]) => {
        let config = getConfig();
        config.templates = templates;
        let fsPath = path.join(_getRootPath(), configFile);
        fs.writeFileSync(fsPath, stringify(config, { space: '    ' }), 'utf-8');
    };

    let npm = () => {
        let fsPath = path.join(_getRootPath(), './package.json');
        if (!fs.existsSync(fsPath)) return;
        let packageJson = jsonic(fs.readFileSync(fsPath, 'utf-8'));
        let scripts = packageJson.scripts;
        let scriptList = Object.keys(scripts).map(key => {
            return {
                command: 'npm run ' + key,
                title: key
            };
        });
        let picks = scriptList.map(item => item.title);

        window.showQuickPick(picks).then((title) => {
            if (!title) return;
            let item: any = scriptList.find(item => item.title == title);
            if (!item) return;
            send_terminal('sip-npm-' + title, _getRootPath(), item.command);
        });
    };

    context.subscriptions.push(commands.registerTextEditorCommand('vuesiphelper.tosnippettext', (textEditor, edit) => {
        _calcRootPath(textEditor.document.fileName);

        var { document, selection } = textEditor
        let isEmpty = textEditor.selection.isEmpty;

        var text = isEmpty ? document.getText() : document.getText(textEditor.selection);
        text = formatSnippetText(text);
        edit.replace(isEmpty ? new Range(new Position(0, 0), new Position(100000, 100000)) :
            textEditor.selection, text);
    }))

    let formatSnippetText = (text: string): string => {

        let preLen = -1;
        text = ['["', text.replace(/\n\r|\r\n/g, '\n').split('\n').map(item => {
            if (preLen == -1) {
                preLen = /^\s*/.exec(item)[0].length || 0;
            }
            return item.replace(/(\"|\\)/g, '\\$1').replace(/(\$)/g, '\\\\$1').substr(preLen).replace(/\t/g, '\\t');
        }).join('",\n"'), '$0"]'].join('');

        return text;
    };

    context.subscriptions.push(commands.registerTextEditorCommand('vuesiphelper.jsontoclass', (textEditor, edit) => {
        let fsFile: string = textEditor.document.fileName;
        _calcRootPath(fsFile);

        let { document, selection } = textEditor

        let isEmpty = textEditor.selection.isEmpty;

        let text = isEmpty ?
            document.getText() :
            document.getText(textEditor.selection);
        try {

            text = jsonToClass(jsonic(text), fsFile);
            edit.replace(isEmpty ? new Range(new Position(0, 0), new Position(100000, 100000)) :
                textEditor.selection, text);
        } catch (e) {
            window.showErrorMessage(e.message);
        }
    }))

    let jsonToClass = (json: object, fsFile: string): string => {
        let props = [], item, defName;
        Object.keys(json).forEach(key => {
            item = json[key];
            key += '?';
            if (Lib.isString(item)) {
                defName = key + ': string';
                props.push('    ' + defName + ' = "";');
            } else if (Lib.isBoolean(item)) {
                defName = key + ': boolean';
                props.push('    ' + defName + ' = false;');
            } else if (Lib.isNumeric(item)) {
                defName = key + ': number';
                props.push('    ' + defName + ' = 0;');
            } else if (Lib.isArray(item)) {
                defName = key + ': any[]';
                props.push('    ' + defName + ' = [];');
            } else if (Lib.isObject(item)) {
                defName = key + ': object';
                props.push('    ' + defName + ' = {};');
            } else {
                defName = key + ': any';
                props.push('    ' + defName + ' = null;');
            }
        });

        let fInfo = path.parse(fsFile);
        let className = MakeClassName(fInfo.name, '');
        let classText = `//定义模型(model)
export class ${className} {

${props.join('\n')}

    constructor(p?: Partial<${className}>) {
        if (p){
            Object.assign(this, p);
        }
    }
}`;

        return classText;
    };

    context.subscriptions.push(commands.registerTextEditorCommand('vuesiphelper.jsontointerface', (textEditor, edit) => {
        let fsFile: string = textEditor.document.fileName;
        _calcRootPath(fsFile);

        let { document, selection } = textEditor

        let isEmpty = textEditor.selection.isEmpty;

        let text = isEmpty ?
            document.getText() :
            document.getText(textEditor.selection);
        try {

            text = jsonToInterface(jsonic(text), fsFile);
            edit.replace(isEmpty ? new Range(new Position(0, 0), new Position(100000, 100000)) :
                textEditor.selection, text);
        } catch (e) {
            window.showErrorMessage(e.message);
        }
    }))

    let jsonToInterface = (json: object, fsFile: string): string => {
        let props = [], item, defName;
        Object.keys(json).forEach(key => {
            item = json[key];
            key += '?';
            if (Lib.isString(item)) {
                defName = key + ': string';
                props.push('    ' + defName + ';');
            } else if (Lib.isBoolean(item)) {
                defName = key + ': boolean';
                props.push('    ' + defName + ';');
            } else if (Lib.isNumeric(item)) {
                defName = key + ': number';
                props.push('    ' + defName + ';');
            } else if (Lib.isArray(item)) {
                defName = key + ': any[]';
                props.push('    ' + defName + ';');
            } else if (Lib.isObject(item)) {
                defName = key + ': object';
                props.push('    ' + defName + ';');
            } else {
                defName = key + ': any';
                props.push('    ' + defName + ';');
            }
        });

        let fInfo = path.parse(fsFile);
        let className = MakeClassName(fInfo.name, '');
        let classText = `//定义模型(model)
export interface ${className} {

${props.join('\n')}

}`;

        return classText;
    };

    context.subscriptions.push(commands.registerTextEditorCommand('vuesiphelper.region', (textEditor, edit) => {
        _calcRootPath(textEditor.document.fileName);

        var { document, selection } = textEditor
        let isEmpty = textEditor.selection.isEmpty;
        if (isEmpty) return;

        var text = document.getText(textEditor.selection);
        var time = new Date().valueOf();

        text = ['    //#region region' + time + '\n', text, '    //#endregion region' + time + '\n'].join('\n');
        edit.replace(isEmpty ? new Range(new Position(0, 0), new Position(100000, 100000)) :
            textEditor.selection, text);
    }))

    function _preDoneRegisterCommand(args: any) {
        let curPath = _curFile = getCurrentPath(args), defaultName = path.basename(curPath);
        _fileName = defaultName.split('.')[0];
        return curPath;
    }

    function showSipGenerateUI(args: any, generateOpt?: any) {
        let inputFile = args ? getCurrentPath(args) : _curFile;
        let isDir = IsDirectory(inputFile);
        let fileName = path.basename(inputFile);
        let curFile = isDir ? '' : inputFile;
        let curPath = isDir ? inputFile : path.dirname(inputFile);
        let isLinux: boolean = curPath.indexOf('/') >= 0;
        let htmlFile = path.join(context.extensionPath, 'webview/generate/dist/generate/index.html');
        let htmlPath = path.dirname(htmlFile);
        const panel = window.createWebviewPanel('sipgenerate', 'sip-generate', ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [Uri.file(htmlPath)]
        });
        const webview = panel.webview;
        let html = fs.readFileSync(htmlFile, 'utf-8');
        let basePath = Uri.file(htmlPath).with({
            scheme: "vscode-resource"
        }).toString();
        html = html.replace('<base href=".">', `<base href="${basePath}/"><meta name="viewport" content="width=device-width, initial-scale=1.0"><script>const vscode = acquireVsCodeApi();window.isVscodeMode = true;</script>`);
        webview.html = html;
        let sendMsg = function (id: string, msg: string, data?: any, err?: any) {
            webview.postMessage({ id: id, command: msg, data: data, err: err });
            return msg + '_receive';
        };
        let receiveMsg = function (id: string, msg: string, data?: any, err?: any) {
            return sendMsg(id, msg + '_receive', data, err);
        };
        let workspaceRoot = _getRootPath();
        if (generateOpt && generateOpt.path) {
            curPath = path.join(curPath, generateOpt.path);
        }
        webview.onDidReceiveMessage(message => {
            let data = message.data;
            let cmd = message.command;
            let id = message.id;
            switch (cmd) {
                case 'options':
                    let input = isDir ? fileName : fileName.split('.')[0];
                    let opt = {
                        curPath: curPath,
                        curFile: curFile,
                        isDir: isDir,
                        isLinux: isLinux,
                        input: input,
                        prefix: 'app',
                        fileName: isDir ? '' : fileName,
                        workspaceRoot: workspaceRoot,
                        extensionPath: context.extensionPath,
                        modules: FindUpwardModuleFiles(workspaceRoot, inputFile).map(file => ['@{curPath}', path.relative(curPath, file)].join(isLinux ? "/" : "\\")),
                        generate: generateOpt
                    };
                    receiveMsg(id, cmd, opt);
                    break;
                case 'saveConfig':
                    saveConfigTmpls(JSON.parse(data.templates));
                    break;
                case 'readConfig':
                    receiveMsg(id, cmd, JSON.stringify(getConfig()));
                    break;
                case 'saveFile':
                    /**data:{ file: 'demo/demo.ts', content: 'content', basePath:'' } */
                    let file: string = path.join(data.basePath || curPath, data.file);
                    let retFile = path.relative(curPath, file);
                    let overWrite = data.flag && data.flag.indexOf('w') >= 0;
                    if (file && (overWrite || !fs.existsSync(file))) {
                        try {
                            let content: string = data.content;
                            let fsPath = path.dirname(file);
                            if (!fs.existsSync(fsPath)) {
                                mkdirSync(fsPath);
                            }
                            fs.writeFile(file, content, { encoding: 'utf-8', flag: 'w' }, (err) => {
                                receiveMsg(id, cmd, [retFile, err ? err.message : '成功'].join(', '));
                            });
                        }
                        catch (e) {
                            receiveMsg(id, cmd, [retFile, e.message].join(', '));
                        }
                    }
                    else
                        receiveMsg(id, cmd, [retFile, '文件已存在！'].join(', '));
                    break;
                case 'readFile':
                    let readFile: string = path.join(data.basePath || curPath, data.file);
                    let readContent: string = '';
                    if (readFile && fs.existsSync(readFile)) {
                        readContent = fs.readFileSync(readFile, 'utf-8');
                    }
                    receiveMsg(id, cmd, readContent);
                    break;
                case 'importToModule':
                    /**data:
                     * {
                     *      file:'', module:'', basePath:'', className:'',
                     *      regOpt:{
                     *       moduleExport?: boolean;
                     *       moduleImport?: boolean;
                     *       moduleDeclaration?: boolean;
                     *       moduleEntryComponent?: boolean;
                     *       moduleProvider?: boolean;
                     *       moduleRouting?: boolean;
                     *       routePath:string;
                     *   }
                     * } */
                    let regFile: string = path.join(data.basePath || curPath, data.file);
                    let regFilePath: string = path.dirname(regFile);
                    let retRegFile = path.relative(curPath, regFile);
                    let regModuleFile: string = fs.existsSync(data.moduleFile) ? data.moduleFile : path.join(regFilePath, data.moduleFile);
                    try {
                    if (regModule(regFile, regModuleFile, data.className, data.regOpt)) {
                            receiveMsg(id, cmd, [retRegFile, '注册到', path.relative(curPath, regModuleFile), '成功'].join(', '));
                        }
                        else
                            receiveMsg(id, cmd, ['注册', retRegFile, '文件不存在！'].join(', '));
                    }
                    catch (e) {
                        receiveMsg(id, cmd, ['注册', retRegFile, e.message].join(', '));
                    }
                    break;
                case 'importToRouting':
                    break;
                case 'log':
                    receiveMsg(id, cmd);
                    break;
                case 'close':
                    panel.dispose();
                    break;
                case 'openFile':
                    _openFile(path.join(data.basePath || curPath, data.file));
                    break;
            }
            // console.log(cmd, data);
        }, undefined, context.subscriptions);
    }
}

