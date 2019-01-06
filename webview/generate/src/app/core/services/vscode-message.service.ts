import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { IConfig, ITmplItem, IVscodeOption, SetVarObject } from '../lib';

declare const vscode: any;

let _msgId = 0;

export const vscode_msg = (msg: string, data?: any) => <T>(source: Observable<T>) => {
    return new Observable<T>(observer => {
        source.subscribe({
            next: function (r) {
                if (!environment.isVscode) {
                    observer.next(null); return;
                }
                let id = (_msgId++);
                if (_msgId == 999) _msgId = 0;
                vscode.postMessage({ id: id, command: msg, data: data });
                let msg_receive = msg + '_receive';
                let fn = function (event) {
                    const message = event.data;
                    let command = message.command;
                    if (message.id == id) {
                        window.removeEventListener('message', fn);
                        observer.next(message.data);
                    }
                };
                window.addEventListener('message', fn);
            },
            error: function (r) {
                observer.error(r);
            }
        });
    });
}

@Injectable()
export class VscodeMessageService {

    options: IVscodeOption;

    private _sendMsg(msg: string, data?: any): Observable<any> {
        let obs = of(null);
        return environment.isVscode ? obs.pipe(vscode_msg(msg, data)) : obs;
    }

    public get input(): string {
        return this.options.input;
    }
    public set input(p: string) {
        this.options.input = p;
    }

    public get prefix(): string {
        return this.options.prefix;
    }
    public set prefix(p: string) {
        this.options.prefix = p;
    }

    private _inited = false;
    _startUP(callback: () => void) {
        if (this._inited) { callback(); return }
        this._sendMsg('options').subscribe(async (p) => {
            this.options = Object.assign({
                curPath: "d:\\root\\demo",
                curFile: "",
                isDir: true,
                isLinux: false,
                input: 'demo',
                prefix: 'app',
                fileName: '',
                workspaceRoot: 'd:\\root',
                extensionPath: 'd:\\temp\\extension',
                modules: []
            }, p);
            let options = this.options;
            if (!options.helper) {
                options.helper = `

                /** 定义helper */
                var _helper = {
                    /** 大驼峰转换：sip-user_list.component ===> SipUserListComponent */
                    upperCamel(str) {
                        return (str || '').replace(/\b(\w)|\s(\w)/g, function (m) { return m.toUpperCase(); }).replace(/[^a-z0-9]/gi, '');
                    },
                    /** 小驼峰转换：sip-user_list.component ===> sipUserListComponent */
                    camel(str) {
                        return _helper.upperCamel(str).replace(/^\w/, function (f) { return f.toLowerCase(); });
                    }
                };
                
                /** 扩展helper */
                SipHelper.extend(_helper);
`
            }
            this.options.modules = this.options.modules.slice();
            this.readConfig().subscribe((readConfig) => {
                let config: IConfig = readConfig ? JSON.parse(readConfig) : null;
                this.config = config;
                if (config) {
                    this.options.prefix = config.prefix;
                }
                let helper: any = {};
                if (this.options.helper) {
                    (new Function('SipHelper', this.options.helper))({
                        extend: function (obj: any) {
                            helper = obj;
                            // Object.assign(helper, obj);
                        },
                        log() {
                            return helper.log ? helper.log.apply(this, arguments) : '';
                        }
                    });
                }
                SetVarObject(Object.assign({}, this.options, {
                    helper: helper
                }));
                callback();

            });
        });
    }

    close() {
        this._sendMsg('close').subscribe();
    }

    /**
     * 保存文件
     * @param file 文件名称（相对basePath，如：demo/demo.ts）
     * @param content 保存内容
     * @param basePath 默认为当前路径
     * @param flag 'w'
     * @example saveFile('name1111', 'test11112').subscribe()
     */
    saveFile(file: string, content: string, basePath?: string, flag?: 'w' | null, dir?: boolean): Observable<string> {
        return this._sendMsg('saveFile', { basePath: basePath, file: file, content: content, flag: flag, dir: dir === true });
    }

    readFile(file: string, basePath?: string): Observable<string> {
        return this._sendMsg('readFile', { basePath: basePath, file: file });
    }

    openFile(file: string, basePath?: string): Observable<string> {
        return this._sendMsg('openFile', { basePath: basePath, file: file });
    }


    log(msg: any): Observable<void> {
        return this._sendMsg('log', msg);
    }

    private _config: IConfig;
    public get config(): IConfig {
        return this._config;
    }
    public set config(p: IConfig) {
        this._config = p;
    }

    saveConfig(tmpls: ITmplItem[]): Observable<string> {
        return this._sendMsg('saveConfig', { templates: JSON.stringify(tmpls) });
    }

    readConfig(): Observable<string> {
        return this._sendMsg('readConfig');
    }

    importToModule(file: string, moduleFile: string, className: string, regOpt: {
        moduleExport?: boolean;
        moduleImport?: boolean;
        moduleDeclaration?: boolean;
        moduleEntryComponent?: boolean;
        moduleProvider?: boolean;
        moduleRouting?: boolean;
        routePath?: string;
        isModule?: boolean;
    }, basePath?: string): Observable<string> {
        return this._sendMsg('importToModule', { basePath: basePath, file: file, moduleFile: moduleFile, className: className, regOpt: regOpt });
    }

}
